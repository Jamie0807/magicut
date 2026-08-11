<script setup lang="ts">
import { computed, onMounted, shallowRef, watch } from 'vue';

import type { VideoProject } from '@magicut/video-project';

import ConfigPanel from '../components/config/ConfigPanel.vue';
import EditorHeader from '../components/editor/EditorHeader.vue';
import ExportProgressDialog from '../components/editor/ExportProgressDialog.vue';
import type { ExportDialogState } from '../components/editor/ExportProgressDialog.vue';
import ModeRail from '../components/editor/ModeRail.vue';
import PreviewPanel from '../components/editor/PreviewPanel.vue';
import ScriptPanel from '../components/editor/ScriptPanel.vue';
import TimelinePanel from '../components/editor/TimelinePanel.vue';
import {
    defaultVideoAgentVoice,
    defaultVideoAgentVoiceSettings
} from '../../shared/video-agent-voices';
import type {
    CustomVoiceItem,
    CustomVoiceProviderStatus
} from '../../shared/custom-voice';
import type { VideoExportProgressEvent } from '../../shared/video-export';
import {
    defaultMusicSettings,
    defaultSubtitleSettings,
    editorConfigMode
} from '../constants/config';
import { editorHeader } from '../constants/editor-screen';
import {
    applySceneRegenerationStreamEvent,
    createSceneRegenerationPendingConversation,
    resolveSceneVoiceOption
} from '../mappers/scene-regeneration-conversation';
import {
    createEditorScreenData,
    createPlaybackStoryboard,
    createTimelinePlayhead
} from '../mappers/video-project-to-editor';
import type {
    ConfigMode,
    ConfigPanelContext,
    MusicSettings,
    SubtitleSettings,
    VoiceRegenerationProgress,
    VoiceSelection
} from '../types/config';
import type { StoryboardItem, TimelineData } from '../types/editor-screen';
import {
    advancePlaybackTime,
    createAnimationClock
} from '../utils/editorPlayback';

const props = defineProps<{
    initialMode?: ConfigMode;
    project?: VideoProject;
}>();

const activeMode = shallowRef<ConfigMode>(
    props.initialMode ?? editorConfigMode
);
const currentProject = shallowRef<VideoProject | undefined>(props.project);
const committedTimeMs = shallowRef(0);
const hoverPreviewTimeMs = shallowRef<number | undefined>();
const isPreviewPlaying = shallowRef(false);
const isQuickAdjustmentSceneLinked = shallowRef(true);
const customVoiceStatus = shallowRef<CustomVoiceProviderStatus | undefined>();
const customVoices = shallowRef<CustomVoiceItem[]>([]);
const isUploadingCustomVoice = shallowRef(false);
const isRegeneratingScene = shallowRef(false);
const isRegeneratingVoices = shallowRef(false);
const selectedSceneId = shallowRef<string | undefined>();
const selectedVoice = shallowRef<VoiceSelection>({
    title: defaultVideoAgentVoice.label,
    voiceType: defaultVideoAgentVoice.voiceType
});
const titleSaveStatus = shallowRef(editorHeader.status);
const voiceRegenerationRunId = shallowRef<string | undefined>();
const voiceRegenerationProgress = shallowRef<
    VoiceRegenerationProgress | undefined
>();
const exportDialogState = shallowRef<ExportDialogState | undefined>();
const exportOutputPath = shallowRef<string | undefined>();
const exportProgress = shallowRef<VideoExportProgressEvent | undefined>();
const musicSettings = shallowRef<MusicSettings>({
    ...defaultMusicSettings
});
const subtitleSettings = shallowRef<SubtitleSettings>({
    ...defaultSubtitleSettings
});
const voicePreviewStopSignal = shallowRef(0);
const voiceSettings = shallowRef({ ...defaultVideoAgentVoiceSettings });
const editorData = computed(() =>
    createEditorScreenData(currentProject.value, {
        musicSettings: musicSettings.value,
        subtitleSettings: subtitleSettings.value
    })
);
const canHoverPreviewTimeline = computed(() => !isPreviewPlaying.value);
const previewTimeMs = computed(() =>
    canHoverPreviewTimeline.value
        ? (hoverPreviewTimeMs.value ?? committedTimeMs.value)
        : committedTimeMs.value
);
const timelineHoverTimeMs = computed(() =>
    canHoverPreviewTimeline.value ? hoverPreviewTimeMs.value : undefined
);
const timelineData = computed<TimelineData>(() => ({
    ...editorData.value.timeline,
    playhead: createTimelinePlayhead({
        currentTimeMs: committedTimeMs.value,
        durationMs: editorData.value.preview.durationMs
    })
}));
const storyboardData = computed(() =>
    createPlaybackStoryboard({
        currentTimeMs: previewTimeMs.value,
        storyboard: editorData.value.storyboard
    })
);
const editorTitle = computed(
    () => currentProject.value?.project.title ?? editorHeader.title
);
const selectedStoryboardItem = computed(
    () =>
        storyboardData.value.items.find(
            (item) => item.sceneId === selectedSceneId.value
        ) ??
        storyboardData.value.items.find((item) => item.tone === 'current') ??
        storyboardData.value.items[0]
);
const createSelectedSceneContext = (item?: StoryboardItem) => {
    if (!item?.sceneId) return undefined;

    return {
        endMs: item.endMs,
        id: item.sceneId,
        label: item.title,
        script: item.body,
        startMs: item.startMs
    };
};
const selectedScene = computed(() =>
    isQuickAdjustmentSceneLinked.value
        ? createSelectedSceneContext(selectedStoryboardItem.value)
        : undefined
);

const refreshCustomVoiceLibrary = async () => {
    if (typeof window === 'undefined' || !window.magicutAPI?.customVoice) {
        return;
    }

    const [status, voices] = await Promise.all([
        window.magicutAPI.customVoice.checkIndexTts2(),
        window.magicutAPI.customVoice.list()
    ]);

    if (status.success) {
        customVoiceStatus.value = status.data;
    }

    if (voices.success) {
        customVoices.value = voices.data;
    }
};

onMounted(() => {
    void refreshCustomVoiceLibrary();
});

const handleProjectTitleChange = async (title: string) => {
    const project = currentProject.value;

    if (!project || title === project.project.title) return;

    const nextProject = {
        ...project,
        project: {
            ...project.project,
            title,
            updatedAt: new Date().toISOString()
        }
    } satisfies VideoProject;

    currentProject.value = nextProject;
    titleSaveStatus.value = '正在保存项目标题';

    if (typeof window === 'undefined' || !window.magicutAPI?.videoProject) {
        titleSaveStatus.value = '标题保存失败';
        return;
    }

    try {
        const result = await window.magicutAPI.videoProject.create(nextProject);

        titleSaveStatus.value =
            result.success === true ? '刚刚更新 · 已自动保存' : '标题保存失败';
    } catch {
        titleSaveStatus.value = '标题保存失败';
    }
};

const openExportDialog = async () => {
    exportDialogState.value = 'idle';
    exportProgress.value = undefined;

    if (typeof window === 'undefined' || !window.magicutAPI?.videoExport) {
        titleSaveStatus.value = '导出服务不可用';
        return;
    }

    const result = await window.magicutAPI.videoExport.selectOutputPath({
        projectTitle: editorTitle.value
    });

    if (result.success === false) {
        exportDialogState.value = 'cancelled';
        exportProgress.value = {
            message: result.error.message,
            percent: 100,
            phase: 'cancelled'
        };
        return;
    }

    exportOutputPath.value = result.data.outputPath;
};

const closeExportDialog = () => {
    if (exportDialogState.value === 'running') return;

    exportDialogState.value = undefined;
    exportProgress.value = undefined;
};

const startExport = async () => {
    const project = currentProject.value;

    if (!project || typeof window === 'undefined') return;

    const videoExport = window.magicutAPI?.videoExport;

    if (!videoExport) {
        exportDialogState.value = 'failed';
        exportProgress.value = {
            message: '导出服务不可用',
            percent: 100,
            phase: 'failed'
        };
        return;
    }

    exportDialogState.value = 'running';
    titleSaveStatus.value = '正在导出视频';

    const unsubscribe = videoExport.onProgress((event) => {
        exportProgress.value = event;
        exportDialogState.value =
            event.phase === 'completed' ||
            event.phase === 'failed' ||
            event.phase === 'cancelled'
                ? event.phase
                : 'running';
    });

    try {
        const result = await videoExport.render({
            musicSettings: musicSettings.value,
            outputPath: exportOutputPath.value,
            project,
            subtitleSettings: subtitleSettings.value
        });

        if (result.success === false) {
            exportDialogState.value =
                result.error.code === 'CANCELLED' ? 'cancelled' : 'failed';
            exportProgress.value = {
                message: result.error.message,
                percent: 100,
                phase: exportDialogState.value
            };
            titleSaveStatus.value = '视频导出失败';
            return;
        }

        exportOutputPath.value = result.data.outputPath;
        exportDialogState.value = 'completed';
        exportProgress.value = {
            message: '导出完成',
            percent: 100,
            phase: 'completed'
        };
        titleSaveStatus.value = '视频导出完成';
    } catch {
        exportDialogState.value = 'failed';
        exportProgress.value = {
            message: '视频导出失败',
            percent: 100,
            phase: 'failed'
        };
        titleSaveStatus.value = '视频导出失败';
    } finally {
        unsubscribe();
    }
};

const commitPreviewTime = (timeMs: number) => {
    const durationMs = editorData.value.preview.durationMs;
    const nextTimeMs = Math.min(Math.max(timeMs, 0), durationMs);

    committedTimeMs.value = nextTimeMs;
    hoverPreviewTimeMs.value = undefined;
};

const handleSceneSelect = ({
    sceneId,
    startMs
}: {
    sceneId: string;
    startMs: number;
}) => {
    selectedSceneId.value = sceneId;
    isQuickAdjustmentSceneLinked.value = true;
    commitPreviewTime(startMs);
};

const handleRegenerateScene = async ({
    prompt,
    sceneId
}: {
    prompt: string;
    sceneId: string;
}) => {
    const project = currentProject.value;

    if (!project) return;

    if (typeof window === 'undefined' || !window.magicutAPI?.videoAgent) {
        titleSaveStatus.value = '分镜优化失败';
        return;
    }

    const requestProject = project;
    const voiceOption = resolveSceneVoiceOption({
        project: requestProject,
        sceneId
    });
    const sceneLabel = selectedScene.value?.label ?? sceneId;

    isQuickAdjustmentSceneLinked.value = false;
    isRegeneratingScene.value = true;
    titleSaveStatus.value = '正在优化当前分镜';
    currentProject.value = {
        ...requestProject,
        ai: {
            ...requestProject.ai,
            conversation: createSceneRegenerationPendingConversation({
                conversation: requestProject.ai.conversation ?? [],
                now: () => new Date().toISOString(),
                prompt,
                sceneLabel
            })
        }
    };

    const unsubscribe = window.magicutAPI.videoAgent.onEvent((event) => {
        if (!event.runId.startsWith('regen_')) return;

        if (
            event.type !== 'model.stream.started' &&
            event.type !== 'model.stream.delta' &&
            event.type !== 'model.stream.completed'
        ) {
            return;
        }

        const current = currentProject.value;

        if (!current) return;

        currentProject.value = {
            ...current,
            ai: {
                ...current.ai,
                conversation: applySceneRegenerationStreamEvent({
                    conversation: current.ai.conversation ?? [],
                    event
                })
            }
        };
    });

    try {
        const result = await window.magicutAPI.videoAgent.regenerateScene({
            projectId: requestProject.project.id,
            prompt,
            sceneId,
            selectedVoice: voiceOption.selectedVoice,
            selectedVoiceType: voiceOption.selectedVoiceType,
            voiceSpeed: voiceSettings.value.voiceSpeed,
            voiceVolume: voiceSettings.value.voiceVolume
        });

        if (result.success === false) {
            titleSaveStatus.value = '分镜优化失败';
            return;
        }

        const loaded = await window.magicutAPI.videoProject.readById(
            requestProject.project.id
        );

        if (loaded.success === false) {
            titleSaveStatus.value = '分镜优化已完成，重新加载失败';
            return;
        }

        currentProject.value = loaded.data;
        selectedSceneId.value = sceneId;
        titleSaveStatus.value = '刚刚更新 · 已自动保存';
    } catch {
        titleSaveStatus.value = '分镜优化失败';
    } finally {
        unsubscribe();
        isRegeneratingScene.value = false;
    }
};

const handleVoiceSettingsChange: NonNullable<
    ConfigPanelContext['onVoiceSettingsChange']
> = (settings) => {
    voiceSettings.value = settings;
};

const handleVoiceSelectionChange: NonNullable<
    ConfigPanelContext['onVoiceSelectionChange']
> = (selection) => {
    selectedVoice.value = selection;
};

const handleImportCustomVoice: NonNullable<
    ConfigPanelContext['onImportCustomVoice']
> = async () => {
    if (typeof window === 'undefined' || !window.magicutAPI?.customVoice) {
        titleSaveStatus.value = '自定义音色库不可用';
        return undefined;
    }

    isUploadingCustomVoice.value = true;
    titleSaveStatus.value = '正在导入自定义音色';

    try {
        const status = await window.magicutAPI.customVoice.checkIndexTts2();

        if (status.success) {
            customVoiceStatus.value = status.data;

            if (!status.data.available) {
                titleSaveStatus.value = '本地 IndexTTS2 未就绪';
                return undefined;
            }
        }

        const imported =
            await window.magicutAPI.customVoice.importReferenceAudio();

        if (imported.success === false) {
            titleSaveStatus.value =
                imported.error.code === 'IMPORT_CANCELLED'
                    ? '已取消导入自定义音色'
                    : `自定义音色导入失败：${imported.error.message}`;
            return undefined;
        }

        const listed = await window.magicutAPI.customVoice.list();
        const nextVoices =
            listed.success === true
                ? listed.data
                : [...customVoices.value, imported.data.voice];

        customVoices.value = nextVoices;
        selectedVoice.value = {
            title: imported.data.voice.title,
            voiceType: imported.data.voice.voiceType
        };
        titleSaveStatus.value = '自定义音色已导入';

        return imported.data.voice;
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);

        titleSaveStatus.value = `自定义音色导入失败：${message}`;
        return undefined;
    } finally {
        isUploadingCustomVoice.value = false;
    }
};

const handleSubtitleSettingsChange: NonNullable<
    ConfigPanelContext['onSubtitleSettingsChange']
> = (settings) => {
    subtitleSettings.value = settings;
};

const handleMusicSettingsChange: NonNullable<
    ConfigPanelContext['onMusicSettingsChange']
> = (settings) => {
    musicSettings.value = settings;
};

const handleRegenerateVoices: NonNullable<
    ConfigPanelContext['onRegenerateVoices']
> = async ({ selectedVoice, selectedVoiceType }) => {
    const project = currentProject.value;

    if (!project) return;

    if (typeof window === 'undefined' || !window.magicutAPI?.videoAgent) {
        titleSaveStatus.value = '口播音轨生成失败';
        return;
    }

    isRegeneratingVoices.value = true;
    voiceRegenerationProgress.value = undefined;
    titleSaveStatus.value = '正在生成口播音轨';
    let activeRunId: string | undefined;
    const unsubscribe = window.magicutAPI.videoAgent.onEvent(async (event) => {
        if (activeRunId && event.runId !== activeRunId) return;

        if (event.type === 'voice.regeneration.progress') {
            voiceRegenerationProgress.value = {
                current: event.current,
                message: event.message,
                percent: event.percent,
                total: event.total
            };
            titleSaveStatus.value = event.message;
            return;
        }

        if (event.type === 'run.completed') {
            if (event.projectId !== project.project.id) return;

            const loaded = await window.magicutAPI.videoProject.readById(
                project.project.id
            );

            if (loaded.success === false) {
                titleSaveStatus.value = '口播音轨已生成，重新加载失败';
                isRegeneratingVoices.value = false;
                voiceRegenerationRunId.value = undefined;
                unsubscribe();
                return;
            }

            currentProject.value = loaded.data;
            committedTimeMs.value = 0;
            hoverPreviewTimeMs.value = undefined;
            isPreviewPlaying.value = false;
            titleSaveStatus.value = '刚刚更新 · 已自动保存';
            isRegeneratingVoices.value = false;
            voiceRegenerationRunId.value = undefined;
            unsubscribe();
            return;
        }

        if (event.type === 'run.cancelled' || event.type === 'run.failed') {
            titleSaveStatus.value =
                event.type === 'run.cancelled'
                    ? '已取消口播音轨生成'
                    : '口播音轨生成失败';
            isRegeneratingVoices.value = false;
            voiceRegenerationRunId.value = undefined;
            unsubscribe();
        }
    });

    try {
        const result = await window.magicutAPI.videoAgent.regenerateVoices({
            projectId: project.project.id,
            selectedVoice,
            selectedVoiceType,
            voiceSpeed: voiceSettings.value.voiceSpeed,
            voiceVolume: voiceSettings.value.voiceVolume
        });

        if (result.success === false) {
            titleSaveStatus.value = '口播音轨生成失败';
            isRegeneratingVoices.value = false;
            unsubscribe();
            return;
        }

        activeRunId = result.data.runId;
        voiceRegenerationRunId.value = result.data.runId;
    } catch {
        titleSaveStatus.value = '口播音轨生成失败';
        isRegeneratingVoices.value = false;
        voiceRegenerationRunId.value = undefined;
        unsubscribe();
    }
};

const handleCancelRegenerateVoices = async () => {
    const runId = voiceRegenerationRunId.value;

    if (!runId || typeof window === 'undefined') return;

    const result = await window.magicutAPI?.videoAgent.cancel({ runId });

    if (result?.success === false) {
        titleSaveStatus.value = `取消失败：${result.error.message}`;
    }
};

const clearHoverPreviewTime = () => {
    hoverPreviewTimeMs.value = undefined;
};

const previewTimelineTime = (timeMs: number) => {
    if (!canHoverPreviewTimeline.value) return;

    hoverPreviewTimeMs.value = timeMs;
};

const clearTimelineHoverTime = () => {
    if (!canHoverPreviewTimeline.value) return;

    clearHoverPreviewTime();
};

const togglePlayback = () => {
    hoverPreviewTimeMs.value = undefined;
    const nextIsPlaying = !isPreviewPlaying.value;

    if (nextIsPlaying) {
        voicePreviewStopSignal.value += 1;
    }

    isPreviewPlaying.value = nextIsPlaying;
};

watch(
    () => props.project,
    (project) => {
        currentProject.value = project;
        committedTimeMs.value = 0;
        hoverPreviewTimeMs.value = undefined;
        isPreviewPlaying.value = false;
        isQuickAdjustmentSceneLinked.value = true;
        customVoiceStatus.value = undefined;
        customVoices.value = [];
        isUploadingCustomVoice.value = false;
        isRegeneratingScene.value = false;
        isRegeneratingVoices.value = false;
        selectedVoice.value = {
            title: defaultVideoAgentVoice.label,
            voiceType: defaultVideoAgentVoice.voiceType
        };
        selectedSceneId.value = undefined;
        exportDialogState.value = undefined;
        exportOutputPath.value = undefined;
        exportProgress.value = undefined;
        musicSettings.value = { ...defaultMusicSettings };
        subtitleSettings.value = { ...defaultSubtitleSettings };
        titleSaveStatus.value = editorHeader.status;
        voiceRegenerationRunId.value = undefined;
        voiceRegenerationProgress.value = undefined;
        voicePreviewStopSignal.value += 1;
        void refreshCustomVoiceLibrary();
    }
);

watch(
    () =>
        [isPreviewPlaying.value, editorData.value.preview.durationMs] as const,
    ([isPlaying, durationMs], _previous, onCleanup) => {
        if (!isPlaying) return;

        const stopClock = createAnimationClock((elapsedMs) => {
            const nextTimeMs = advancePlaybackTime({
                currentTimeMs: committedTimeMs.value,
                durationMs,
                elapsedMs
            });

            committedTimeMs.value = nextTimeMs;

            if (nextTimeMs >= durationMs) {
                isPreviewPlaying.value = false;
                return true;
            }

            return false;
        });

        onCleanup(() => {
            stopClock();
        });
    }
);
</script>

<template>
    <main
        :aria-label="editorHeader.ariaLabel"
        class="h-screen min-h-[720px] overflow-hidden bg-[#0E0F12] text-[#F5F7FA]"
    >
        <div class="flex h-full min-w-[1280px] flex-col">
            <EditorHeader
                :title="editorTitle"
                :status="titleSaveStatus"
                @export-click="openExportDialog"
                @title-change="handleProjectTitleChange"
            />
            <section
                class="grid min-h-0 flex-1 grid-cols-[300px_minmax(420px,1fr)_320px_59px]"
            >
                <ScriptPanel
                    :auto-scroll-active-item="isPreviewPlaying"
                    :data="storyboardData"
                    @scene-select="handleSceneSelect"
                    @seek="commitPreviewTime"
                />
                <PreviewPanel
                    :current-time-ms="previewTimeMs"
                    :data="editorData.preview"
                    :is-playing="isPreviewPlaying"
                    :preview-volume="voiceSettings.voiceVolume"
                    @toggle-playback="togglePlayback"
                />
                <ConfigPanel
                    :conversation="currentProject?.ai.conversation"
                    :custom-voice-status="customVoiceStatus"
                    :custom-voices="customVoices"
                    :is-regenerating-scene="isRegeneratingScene"
                    :is-regenerating-voices="isRegeneratingVoices"
                    :is-uploading-custom-voice="isUploadingCustomVoice"
                    :mode="activeMode"
                    :music-settings="musicSettings"
                    :selected-scene="selectedScene"
                    :selected-voice="selectedVoice"
                    :subtitle-settings="subtitleSettings"
                    :voice-preview-stop-signal="voicePreviewStopSignal"
                    :voice-regeneration-progress="voiceRegenerationProgress"
                    :voice-settings="voiceSettings"
                    @cancel-regenerate-voices="handleCancelRegenerateVoices"
                    @clear-selected-scene="isQuickAdjustmentSceneLinked = false"
                    @import-custom-voice="handleImportCustomVoice"
                    @regenerate-scene="handleRegenerateScene"
                    @regenerate-voices="handleRegenerateVoices"
                    @music-settings-change="handleMusicSettingsChange"
                    @subtitle-settings-change="handleSubtitleSettingsChange"
                    @voice-selection-change="handleVoiceSelectionChange"
                    @voice-settings-change="handleVoiceSettingsChange"
                />
                <ModeRail
                    :active-mode="activeMode"
                    @mode-change="activeMode = $event"
                />
            </section>
            <TimelinePanel
                :data="timelineData"
                :duration-ms="editorData.preview.durationMs"
                :hover-time-ms="timelineHoverTimeMs"
                @pointer-time-clear="clearTimelineHoverTime"
                @pointer-time-commit="commitPreviewTime"
                @pointer-time-preview="previewTimelineTime"
                @scene-select="handleSceneSelect"
            />
            <ExportProgressDialog
                :duration-ms="editorData.preview.durationMs"
                :output-path="exportOutputPath"
                :progress="exportProgress"
                :state="exportDialogState"
                @choose-path="openExportDialog"
                @close="closeExportDialog"
                @start-export="startExport"
            />
        </div>
    </main>
</template>
