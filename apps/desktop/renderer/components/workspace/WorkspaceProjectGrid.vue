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

defineEmits<{
    create: [];
    projectDeleteRequest: [project: WorkspaceProject];
}>();
</script>

<template>
    <ul class="grid grid-cols-4 gap-[18px]">
        <li>
            <WorkspaceCreateCard :card="createCard" @create="$emit('create')" />
        </li>
        <li v-for="project in projects" :key="project.id">
            <WorkspaceProjectCard
                :project="project"
                @delete-request="$emit('projectDeleteRequest', $event)"
            />
        </li>
    </ul>
</template>
