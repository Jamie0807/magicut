<script setup lang="ts">
import WorkspaceHeader from '../components/workspace/WorkspaceHeader.vue';
import WorkspaceProjectGrid from '../components/workspace/WorkspaceProjectGrid.vue';
import WorkspaceSidebar from '../components/workspace/WorkspaceSidebar.vue';
import {
    workspaceBrand,
    workspaceCreateCard,
    workspaceHeader,
    workspaceNavItems,
    workspaceProjects
} from '../constants/workspace';
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
            />
            <section
                class="relative min-w-0 overflow-y-auto bg-[#111318]/24 backdrop-blur-[12px]"
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
                    <WorkspaceHeader :content="workspaceHeader" />
                    <div class="mt-[18px]">
                        <WorkspaceProjectGrid
                            :create-card="workspaceCreateCard"
                            :projects="workspaceProjects"
                        />
                    </div>
                </div>
            </section>
        </div>
    </main>
</template>
