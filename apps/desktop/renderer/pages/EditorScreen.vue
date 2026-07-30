<script setup lang="ts">
import { computed, shallowRef } from 'vue';

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
const editorData = computed(() => createEditorScreenData(props.project));
</script>

<template>
    <main
        :aria-label="editorHeader.ariaLabel"
        class="h-screen min-h-[720px] overflow-hidden bg-[#0E0F12] text-[#F5F7FA]"
    >
        <div class="flex h-full min-w-[1280px] flex-col">
            <EditorHeader />
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
