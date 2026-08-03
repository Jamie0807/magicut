import { computed, readonly, shallowRef } from 'vue';

import type { AgentConversationMessage } from '@magicut/video-project';

import type {
    DesktopAgentRunEvent,
    VideoAgentOperationResult,
    VideoAgentResultData,
    VideoAgentStartInput
} from '../../shared/video-agent';
import {
    type AgentConversationViewModel,
    type AgentRunConversationEvent,
    createAgentConversationViewModel,
    type UserReplyConversationEvent
} from '../mappers/agent-run-conversation';

type AgentRunSnapshot = {
    activeRunId?: string;
    events: AgentRunConversationEvent[];
    viewModel: AgentConversationViewModel;
};

const eventsByRunId = new Map<string, AgentRunConversationEvent[]>();
const activeRunId = shallowRef<string | undefined>();
const lastSubmitInput = shallowRef<VideoAgentStartInput | undefined>();
const version = shallowRef(0);
let eventSubscription: (() => void) | undefined;

const notify = () => {
    version.value += 1;
};

const getEvents = (runId: string) => eventsByRunId.get(runId) ?? [];

const setEvents = (runId: string, events: AgentRunConversationEvent[]) => {
    eventsByRunId.set(runId, events);
    notify();
};

const getNextLocalSequence = (runId: string) =>
    Math.max(0, ...getEvents(runId).map((event) => event.sequence)) + 1;

const isSameEvent = (
    first: AgentRunConversationEvent,
    second: AgentRunConversationEvent
) =>
    first.runId === second.runId &&
    first.sequence === second.sequence &&
    first.type === second.type;

const persistConversation = async ({
    conversation,
    projectId
}: {
    conversation: AgentConversationMessage[];
    projectId: string;
}) => {
    if (typeof window === 'undefined' || !window.magicutAPI?.videoProject) {
        return;
    }

    const listResult = await window.magicutAPI.videoProject.list();

    if (listResult.success === false) return;

    const projectFile = listResult.data.find(
        (item) => item.project.project.id === projectId
    );

    if (!projectFile) return;

    await window.magicutAPI.videoProject.save({
        filePath: projectFile.filePath,
        project: {
            ...projectFile.project,
            ai: {
                ...projectFile.project.ai,
                conversation
            }
        }
    });
};

export const addAgentRunEvent = (event: DesktopAgentRunEvent) => {
    const currentEvents = getEvents(event.runId);
    const withoutOptimisticStarted =
        event.type === 'run.started'
            ? currentEvents.filter(
                  (currentEvent) =>
                      !(
                          currentEvent.type === 'run.started' &&
                          currentEvent.sequence === 0
                      )
              )
            : currentEvents;

    if (
        withoutOptimisticStarted.some((currentEvent) =>
            isSameEvent(currentEvent, event)
        )
    ) {
        return;
    }

    const nextEvents = [...withoutOptimisticStarted, event];

    activeRunId.value = event.runId;
    setEvents(event.runId, nextEvents);

    if (event.type === 'run.completed') {
        const viewModel = createAgentConversationViewModel({
            events: nextEvents
        });

        void persistConversation({
            conversation: viewModel.messages,
            projectId: event.projectId
        });
    }
};

export const ensureAgentRunEventSubscription = () => {
    if (eventSubscription) return;
    if (typeof window === 'undefined') return;

    eventSubscription = window.magicutAPI?.videoAgent?.onEvent((event) => {
        addAgentRunEvent(event);
    });
};

export const startAgentRun = async (
    input: VideoAgentStartInput
): Promise<VideoAgentOperationResult<VideoAgentResultData>> => {
    lastSubmitInput.value = input;
    ensureAgentRunEventSubscription();

    if (typeof window === 'undefined' || !window.magicutAPI?.videoAgent) {
        return {
            error: {
                code: 'RUN_FAILED',
                message: '智能体接口尚未就绪'
            },
            success: false
        };
    }

    const result = await window.magicutAPI.videoAgent.start(input);

    if (result.success) {
        activeRunId.value = result.data.runId;

        if (
            !getEvents(result.data.runId).some(
                (event) => event.type === 'run.started'
            )
        ) {
            setEvents(result.data.runId, [
                {
                    createdAt: new Date().toISOString(),
                    input: {
                        prompt: input.prompt,
                        selectedVoice: input.selectedVoice,
                        selectedVoiceType: input.selectedVoiceType,
                        sourceAssetDirectory: input.sourceAssetDirectory
                    },
                    runId: result.data.runId,
                    sequence: 0,
                    type: 'run.started'
                }
            ]);
        } else {
            notify();
        }
    }

    return result;
};

export const addAgentRunUserReply = ({
    approved,
    content,
    runId
}: {
    approved: boolean;
    content: string;
    runId: string;
}) => {
    const event: UserReplyConversationEvent = {
        approved,
        content,
        createdAt: new Date().toISOString(),
        runId,
        sequence: getNextLocalSequence(runId),
        type: 'user.reply'
    };

    setEvents(runId, [...getEvents(runId), event]);
};

export const approveAgentRun = async (runId: string) => {
    addAgentRunUserReply({
        approved: true,
        content: '确认分镜，继续生成',
        runId
    });

    return window.magicutAPI.videoAgent.approve({
        approved: true,
        runId
    });
};

export const cancelAgentRun = async (runId: string) => {
    addAgentRunUserReply({
        approved: false,
        content: '取消本次创作',
        runId
    });

    return window.magicutAPI.videoAgent.cancel({ runId });
};

export const getAgentRunSnapshot = (runId?: string): AgentRunSnapshot => {
    const currentVersion = version.value;
    void currentVersion;

    const resolvedRunId = runId ?? activeRunId.value;
    const events = resolvedRunId ? getEvents(resolvedRunId) : [];

    return {
        activeRunId: resolvedRunId,
        events,
        viewModel: createAgentConversationViewModel({ events })
    };
};

export const getLastAgentSubmitInput = () => lastSubmitInput.value;

export const useAgentRunSnapshot = (runId?: string) =>
    computed(() => getAgentRunSnapshot(runId));

export const agentRunState = readonly({
    activeRunId,
    lastSubmitInput,
    version
});
