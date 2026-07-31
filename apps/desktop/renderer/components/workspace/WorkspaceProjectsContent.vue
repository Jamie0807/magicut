<script setup lang="ts">
import type {
    WorkspaceCreateCard as WorkspaceCreateCardData,
    WorkspaceHeaderContent,
    WorkspaceProject
} from '../../types/workspace';

import WorkspaceHeader from './WorkspaceHeader.vue';
import WorkspaceProjectGrid from './WorkspaceProjectGrid.vue';

defineProps<{
    createCard: WorkspaceCreateCardData;
    header: WorkspaceHeaderContent;
    projects: WorkspaceProject[];
}>();

defineEmits<{
    create: [];
    projectDeleteRequest: [project: WorkspaceProject];
}>();
</script>

<template>
    <section
        class="relative h-full min-w-0 overflow-y-auto bg-[#111318]/24 backdrop-blur-[12px]"
    >
        <div
            aria-hidden="true"
            class="workspace-dot-field-layer pointer-events-none absolute inset-0 z-[1] overflow-hidden opacity-100"
        >
            <div
                class="h-full w-full bg-[radial-gradient(circle_at_28%_22%,rgba(168,85,247,0.22)_0%,transparent_18%),radial-gradient(circle_at_72%_16%,rgba(0,242,255,0.12)_0%,transparent_16%),radial-gradient(circle_at_50%_50%,#120F17_0%,transparent_42%)]"
            />
            <div
                class="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.15)_1px,transparent_0)] bg-[length:14px_14px] opacity-35"
            />
        </div>
        <div
            class="relative z-10 flex min-h-full flex-col px-[86px] pt-[180px] pb-10"
        >
            <WorkspaceHeader :content="header" />
            <div class="mt-[18px]">
                <WorkspaceProjectGrid
                    :create-card="createCard"
                    :projects="projects"
                    @create="$emit('create')"
                    @project-delete-request="
                        $emit('projectDeleteRequest', $event)
                    "
                />
            </div>
        </div>
    </section>
</template>
