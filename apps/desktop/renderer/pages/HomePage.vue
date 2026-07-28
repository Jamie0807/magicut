<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue';

import CreateMainContent from '../components/create/CreateMainContent.vue';
import WorkspaceProjectsContent from '../components/workspace/WorkspaceProjectsContent.vue';
import WorkspaceSidebar from '../components/workspace/WorkspaceSidebar.vue';
import { createPageContent } from '../constants/create';
import {
    getWorkspaceNavItems,
    workspaceBrand,
    workspaceCreateCard,
    workspaceHeader,
    workspaceProjects
} from '../constants/workspace';
import type { WorkspaceView } from '../types/workspace';

const props = withDefaults(
    defineProps<{
        initialView?: WorkspaceView;
    }>(),
    {
        initialView: 'projects'
    }
);

const activeView = shallowRef<WorkspaceView>(props.initialView);
const workspaceNavItems = computed(() =>
    getWorkspaceNavItems(activeView.value)
);

const viewClassName = (view: WorkspaceView) => [
    'absolute inset-0 min-w-0 transition-opacity duration-200',
    activeView.value === view
        ? 'pointer-events-auto opacity-100'
        : 'pointer-events-none opacity-0'
];

const selectView = (view: WorkspaceView) => {
    activeView.value = view;
};

watch(
    () => props.initialView,
    (nextView) => {
        activeView.value = nextView;
    }
);
</script>

<template>
    <main
        aria-label="Magicut 工作台"
        class="relative h-screen min-h-[720px] overflow-hidden bg-[radial-gradient(circle_at_0%_0%,#582CFF30_0%,transparent_34%),radial-gradient(circle_at_86%_8%,#00F2FF14_0%,transparent_32%),linear-gradient(180deg,#10121B_0%,#080911_48%,#05060A_100%)] text-[#F5F7FA]"
    >
        <div
            class="relative z-10 grid h-full min-w-[1280px] grid-cols-[260px_minmax(0,1fr)]"
        >
            <WorkspaceSidebar
                :brand="workspaceBrand"
                :nav-items="workspaceNavItems"
                @nav-item-select="selectView"
            />
            <section
                class="workspace-view-stack relative min-w-0 overflow-hidden"
            >
                <div
                    data-workspace-view="create"
                    :class="viewClassName('create')"
                >
                    <CreateMainContent :content="createPageContent" />
                </div>
                <div
                    data-workspace-view="projects"
                    :class="viewClassName('projects')"
                >
                    <WorkspaceProjectsContent
                        :header="workspaceHeader"
                        :create-card="workspaceCreateCard"
                        :projects="workspaceProjects"
                        @create="selectView('create')"
                    />
                </div>
            </section>
        </div>
    </main>
</template>
