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
import { createEditorScreenData } from '../mappers/video-project-to-editor';
import type { ConfigMode } from '../types/config';

const props = defineProps<{
    project?: VideoProject;
}>();

const activeMode = shallowRef<ConfigMode>(editorConfigMode);
const currentProject = shallowRef<VideoProject | undefined>(props.project);
const titleSaveStatus = shallowRef(editorHeader.status);
const editorData = computed(() => createEditorScreenData(currentProject.value));
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

watch(
    () => props.project,
    (project) => {
        currentProject.value = project;
        titleSaveStatus.value = editorHeader.status;
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
                <ScriptPanel :data="editorData.storyboard" />
                <PreviewPanel />
                <ConfigPanel :mode="activeMode" />
                <ModeRail
                    :active-mode="activeMode"
                    @mode-change="activeMode = $event"
                />
            </section>
            <TimelinePanel :data="editorData.timeline" />
        </div>
    </main>
</template>
