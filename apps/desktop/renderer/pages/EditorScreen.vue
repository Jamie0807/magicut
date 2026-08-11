<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue';

import type { VideoProject } from '@magicut/video-project';

import ConfigPanel from '../components/config/ConfigPanel.vue';
import EditorHeader from '../components/editor/EditorHeader.vue';
import ModeRail from '../components/editor/ModeRail.vue';
import PreviewPanel from '../components/editor/PreviewPanel.vue';
import ScriptPanel from '../components/editor/ScriptPanel.vue';
import TimelinePanel from '../components/editor/TimelinePanel.vue';
import { defaultVideoAgentVoiceSettings } from '../../shared/video-agent-voices';
import { editorConfigMode } from '../constants/config';
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
import type { ConfigMode, ConfigPanelContext } from '../types/config';
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
const isRegeneratingScene = shallowRef(false);
const isRegeneratingVoices = shallowRef(false);
const selectedSceneId = shallowRef<string | undefined>();
const titleSaveStatus = shallowRef(editorHeader.status);
const voicePreviewStopSignal = shallowRef(0);
const voiceSettings = shallowRef({ ...defaultVideoAgentVoiceSettings });
const editorData = computed(() => createEditorScreenData(currentProject.value));
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
    titleSaveStatus.value = '正在生成口播音轨';

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
            return;
        }

        const loaded = await window.magicutAPI.videoProject.readById(
            project.project.id
        );

        if (loaded.success === false) {
            titleSaveStatus.value = '口播音轨已生成，重新加载失败';
            return;
        }

        currentProject.value = loaded.data;
        committedTimeMs.value = 0;
        hoverPreviewTimeMs.value = undefined;
        isPreviewPlaying.value = false;
        titleSaveStatus.value = '刚刚更新 · 已自动保存';
    } catch {
        titleSaveStatus.value = '口播音轨生成失败';
    } finally {
        isRegeneratingVoices.value = false;
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
        isRegeneratingScene.value = false;
        isRegeneratingVoices.value = false;
        selectedSceneId.value = undefined;
        titleSaveStatus.value = editorHeader.status;
        voicePreviewStopSignal.value += 1;
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
                    :is-regenerating-scene="isRegeneratingScene"
                    :is-regenerating-voices="isRegeneratingVoices"
                    :mode="activeMode"
                    :selected-scene="selectedScene"
                    :voice-preview-stop-signal="voicePreviewStopSignal"
                    :voice-settings="voiceSettings"
                    @clear-selected-scene="isQuickAdjustmentSceneLinked = false"
                    @regenerate-scene="handleRegenerateScene"
                    @regenerate-voices="handleRegenerateVoices"
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
        </div>
    </main>
</template>
