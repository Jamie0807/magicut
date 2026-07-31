<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue';
import { useRoute } from 'vue-router';

import type { VideoProject } from '@magicut/video-project';

import EditorScreen from './EditorScreen.vue';

type EditorProjectLoadState =
    | {
          error?: string;
          project?: undefined;
          status: 'failed' | 'idle' | 'loading';
      }
    | {
          error?: undefined;
          project: VideoProject;
          status: 'loaded';
      };

const route = useRoute();
const projectId = computed(() =>
    typeof route.params.projectId === 'string'
        ? route.params.projectId
        : undefined
);
const loadState = shallowRef<EditorProjectLoadState>({
    status: projectId.value ? 'loading' : 'idle'
});
const project = computed(() =>
    loadState.value.status === 'loaded' ? loadState.value.project : undefined
);

const getProjectErrorMessage = (error: unknown) => {
    if (error instanceof Error) return error.message;

    return String(error);
};

watch(
    projectId,
    async (nextProjectId, _previousProjectId, onCleanup) => {
        let isCurrent = true;
        onCleanup(() => {
            isCurrent = false;
        });

        if (!nextProjectId) {
            loadState.value = { status: 'idle' };
            return;
        }

        loadState.value = { status: 'loading' };

        try {
            const result =
                await window.magicutAPI.videoProject.readById(nextProjectId);

            if (!isCurrent) return;

            if (result.success === false) {
                loadState.value = {
                    error: result.error.message,
                    status: 'failed'
                };
                return;
            }

            loadState.value = {
                project: result.data,
                status: 'loaded'
            };
        } catch (error: unknown) {
            if (!isCurrent) return;

            loadState.value = {
                error: getProjectErrorMessage(error),
                status: 'failed'
            };
        }
    },
    {
        immediate: true
    }
);
</script>

<template>
    <div class="relative">
        <EditorScreen :project="project" />
        <div
            v-if="loadState.status === 'loading'"
            class="pointer-events-none absolute top-20 right-6 rounded-[12px] border border-[#3B3948] bg-[#171821CC] px-4 py-3 text-[13px] leading-[1.45] font-[800] text-[#EAE7F2] shadow-[0_18px_48px_rgba(0,0,0,0.26)] backdrop-blur-[18px]"
        >
            正在加载工程
        </div>
        <div
            v-if="loadState.status === 'failed'"
            class="absolute top-20 right-6 max-w-[360px] rounded-[12px] border border-[#5D3141] bg-[#2A1720E6] px-4 py-3 text-[13px] leading-[1.45] font-[800] text-[#FFD9E2] shadow-[0_18px_48px_rgba(0,0,0,0.3)] backdrop-blur-[18px]"
        >
            {{ loadState.error }}
        </div>
    </div>
</template>
