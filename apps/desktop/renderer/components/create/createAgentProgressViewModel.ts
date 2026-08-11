import type { DesktopAgentRunEvent } from '../../../shared/video-agent';

type AgentProgressStatus =
    | 'cancelled'
    | 'completed'
    | 'failed'
    | 'idle'
    | 'running'
    | 'waiting';

export type AgentProgressEntry = {
    detail?: string;
    label: string;
    sequence: number;
    tone: AgentProgressStatus;
};

export type AgentProgressViewModel = {
    canApprove: boolean;
    canCancel: boolean;
    canRetry: boolean;
    editorHref?: string;
    entries: AgentProgressEntry[];
    status: AgentProgressStatus;
    title: string;
};

const nodeStageLabels: Record<string, string> = {
    asset_matcher: '正在匹配素材',
    asset_scan: '正在分析素材',
    asset_understand: '正在分析素材',
    creative_brief: '正在生成分镜',
    project_save: '正在保存工程',
    scene_approval: '等待分镜确认',
    scene_planner: '正在生成分镜',
    timeline_assemble: '正在组装时间线',
    tts: '正在生成配音',
    validation: '正在校验工程'
};

export const sortAgentRunEvents = (events: DesktopAgentRunEvent[]) => {
    return [...events].sort(
        (first, second) => first.sequence - second.sequence
    );
};

const getEventLabel = (event: DesktopAgentRunEvent) => {
    if (event.type === 'run.started') return '已开始智能创作';
    if (event.type === 'approval.required') {
        if (event.approval.type === 'scene-plan') return '等待分镜确认';

        return '等待人工确认';
    }
    if (event.type === 'model.delta') return '模型流式输出';
    if (event.type === 'voice.regeneration.progress') return '正在生成口播';
    if (event.type === 'run.completed') return '已完成';
    if (event.type === 'run.failed') return '已失败';
    if (event.type === 'run.cancelled') return '已取消';
    if (event.type === 'node.failed') {
        const stageLabel = nodeStageLabels[event.nodeName] ?? event.nodeName;

        return `${stageLabel.replace(/^正在/, '')}失败`;
    }

    return nodeStageLabels[event.nodeName] ?? event.nodeName;
};

const getEventDetail = (event: DesktopAgentRunEvent) => {
    if (event.type === 'run.started') {
        return `${event.input.selectedVoice} · ${event.input.sourceAssetDirectory}`;
    }
    if (event.type === 'node.failed') return event.error;
    if (event.type === 'model.delta') return event.delta;
    if (event.type === 'voice.regeneration.progress') return event.message;
    if (event.type === 'run.failed') return event.error;
    if (event.type === 'run.cancelled') return event.reason;
    if (event.type === 'run.completed') return event.savedProjectPath;

    return undefined;
};

const getEventTone = (event: DesktopAgentRunEvent): AgentProgressStatus => {
    if (event.type === 'run.completed') return 'completed';
    if (event.type === 'run.failed' || event.type === 'node.failed') {
        return 'failed';
    }
    if (event.type === 'run.cancelled') return 'cancelled';
    if (event.type === 'approval.required') return 'waiting';

    return 'running';
};

const getTitle = (status: AgentProgressStatus) => {
    if (status === 'completed') return '已完成';
    if (status === 'failed') return '已失败';
    if (status === 'cancelled') return '已取消';
    if (status === 'waiting') return '等待确认';
    if (status === 'running') return '智能体运行中';

    return '等待创建指令';
};

const shouldDisplayProgressEvent = (event: DesktopAgentRunEvent) => {
    return event.type !== 'node.completed';
};

const shouldCoalesceProgressEntries = (
    previous: AgentProgressEntry,
    current: AgentProgressEntry
) => {
    if (previous.label !== current.label) return false;

    if (previous.tone === 'failed' || current.tone === 'failed') {
        return previous.detail === current.detail;
    }

    return true;
};

const coalesceProgressEntries = (entries: AgentProgressEntry[]) => {
    return entries.reduce<AgentProgressEntry[]>((coalescedEntries, entry) => {
        const previousEntry = coalescedEntries.at(-1);

        if (
            previousEntry &&
            shouldCoalesceProgressEntries(previousEntry, entry)
        ) {
            return [...coalescedEntries.slice(0, -1), entry];
        }

        return [...coalescedEntries, entry];
    }, []);
};

export const createAgentProgressViewModel = (
    events: DesktopAgentRunEvent[]
): AgentProgressViewModel => {
    const sortedEvents = sortAgentRunEvents(events);
    const latestEvent = sortedEvents.at(-1);
    const status = latestEvent ? getEventTone(latestEvent) : 'idle';
    const seenFailureDetails = new Set<string>();
    const progressEntries = sortedEvents.flatMap((event) => {
        if (!shouldDisplayProgressEvent(event)) return [];

        const detail = getEventDetail(event);
        const isFailure =
            event.type === 'node.failed' || event.type === 'run.failed';

        if (isFailure && detail) {
            if (seenFailureDetails.has(detail)) return [];

            seenFailureDetails.add(detail);
        }

        return [
            {
                detail,
                label: getEventLabel(event),
                sequence: event.sequence,
                tone: getEventTone(event)
            }
        ];
    });
    const entries = coalesceProgressEntries(progressEntries);

    return {
        canApprove: latestEvent?.type === 'approval.required',
        canCancel: status === 'running' || status === 'waiting',
        canRetry: status === 'cancelled' || status === 'failed',
        editorHref:
            latestEvent?.type === 'run.completed'
                ? `/editor/${latestEvent.projectId}`
                : undefined,
        entries,
        status,
        title: getTitle(status)
    };
};
