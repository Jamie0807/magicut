<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue';

import type { VideoProject } from '@magicut/video-project';

import ConfigPanel from '../components/config/ConfigPanel.vue';
import EditorHeader from '../components/editor/EditorHeader.vue';
import ModeRail from '../components/editor/ModeRail.vue';
import PreviewPanel from '../components/editor/PreviewPanel.vue';
import ScriptPanel from '../components/editor/ScriptPanel.vue';
import TimelinePanel from '../components/editor/TimelinePanel.vue';
import { editorConfigMode } from '../constants/config';
import { editorHeader } from '../constants/editor-screen';
import {
    createEditorScreenData,
    createPlaybackStoryboard,
    createTimelinePlayhead
} from '../mappers/video-project-to-editor';
import type { ConfigMode } from '../types/config';
import type { TimelineData } from '../types/editor-screen';
import {
    advancePlaybackTime,
    createAnimationClock
} from '../utils/editorPlayback';

const props = defineProps<{
    project?: VideoProject;
}>();

const activeMode = shallowRef<ConfigMode>(editorConfigMode);
const currentProject = shallowRef<VideoProject | undefined>(props.project);
const committedTimeMs = shallowRef(0);
const hoverPreviewTimeMs = shallowRef<number | undefined>();
const isPreviewPlaying = shallowRef(false);
const titleSaveStatus = shallowRef(editorHeader.status);
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
    isPreviewPlaying.value = !isPreviewPlaying.value;
};

watch(
    () => props.project,
    (project) => {
        currentProject.value = project;
        committedTimeMs.value = 0;
        hoverPreviewTimeMs.value = undefined;
        isPreviewPlaying.value = false;
        titleSaveStatus.value = editorHeader.status;
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
                    @seek="commitPreviewTime"
                />
                <PreviewPanel
                    :current-time-ms="previewTimeMs"
                    :data="editorData.preview"
                    :is-playing="isPreviewPlaying"
                    @toggle-playback="togglePlayback"
                />
                <ConfigPanel :mode="activeMode" />
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
            />
        </div>
    </main>
</template>
