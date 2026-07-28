<script setup lang="ts">
import type {
    WorkspaceCreateCard as WorkspaceCreateCardData,
    WorkspaceProject
} from '../../types/workspace';

import WorkspaceCreateCard from './WorkspaceCreateCard.vue';
import WorkspaceProjectCard from './WorkspaceProjectCard.vue';

defineProps<{
    createCard: WorkspaceCreateCardData;
    projects: WorkspaceProject[];
}>();
</script>

<template>
    <ul class="grid grid-cols-4 gap-[18px]">
        <li>
            <WorkspaceCreateCard :card="createCard" />
        </li>
        <li v-for="project in projects" :key="project.title">
            <WorkspaceProjectCard :project="project" />
        </li>
    </ul>
</template>
