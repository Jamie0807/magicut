<script setup lang="ts">
import { computed, onMounted, onUnmounted, shallowRef, watch } from 'vue';

import {
    defaultVideoAgentCanvas,
    type DesktopAgentRunEvent
} from '../../shared/video-agent';
import CreateMainContent from '../components/create/CreateMainContent.vue';
import ProjectDeleteConfirmDialog from '../components/workspace/ProjectDeleteConfirmDialog.vue';
import WorkspaceProjectsContent from '../components/workspace/WorkspaceProjectsContent.vue';
import WorkspaceSidebar from '../components/workspace/WorkspaceSidebar.vue';
import { createPageContent } from '../constants/create';
import {
    getWorkspaceNavItems,
    workspaceBrand,
    workspaceCreateCard,
    workspaceHeader
} from '../constants/workspace';
import { mapVideoProjectFilesToWorkspaceProjects } from '../mappers/workspace-projects';
import type { CreateAgentSubmitInput } from '../types/create';
import type { WorkspaceProject, WorkspaceView } from '../types/workspace';

const props = withDefaults(
    defineProps<{
        initialProjects?: WorkspaceProject[];
        initialView?: WorkspaceView;
    }>(),
    {
        initialProjects: () => [],
        initialView: 'projects'
    }
);

const activeView = shallowRef<WorkspaceView>(props.initialView);
const agentEvents = shallowRef<DesktopAgentRunEvent[]>([]);
const activeAgentRunId = shallowRef<string | undefined>();
const lastAgentSubmitInput = shallowRef<CreateAgentSubmitInput | undefined>();
const isProjectDeleting = shallowRef(false);
const projectDeleteErrorMessage = shallowRef<string | undefined>();
const projectPendingDeletion = shallowRef<WorkspaceProject | undefined>();
const workspaceProjectsFromStore = shallowRef<WorkspaceProject[]>(
    props.initialProjects
);
let unsubscribeAgentEvents: (() => void) | undefined;
const workspaceNavItems = computed(() =>
    getWorkspaceNavItems(activeView.value)
);
const latestAgentEvent = computed(() =>
    [...agentEvents.value]
        .sort((first, second) => first.sequence - second.sequence)
        .at(-1)
);
const isAgentBusy = computed(() => {
    const event = latestAgentEvent.value;

    return (
        event?.type === 'run.started' ||
        event?.type === 'node.started' ||
        event?.type === 'node.completed' ||
        event?.type === 'model.delta' ||
        event?.type === 'approval.required'
    );
});

const viewClassName = (view: WorkspaceView) => [
    'absolute inset-0 min-w-0 transition-opacity duration-200',
    activeView.value === view
        ? 'pointer-events-auto opacity-100'
        : 'pointer-events-none opacity-0'
];

const selectView = (view: WorkspaceView) => {
    activeView.value = view;
};

const loadWorkspaceProjects = async () => {
    if (typeof window === 'undefined' || !window.magicutAPI?.videoProject) {
        return;
    }

    const result = await window.magicutAPI.videoProject.list();

    if (result.success === false) return;

    workspaceProjectsFromStore.value = mapVideoProjectFilesToWorkspaceProjects(
        result.data
    );
};

const appendAgentEvent = (event: DesktopAgentRunEvent) => {
    agentEvents.value = [...agentEvents.value, event];

    if (event.type === 'run.started') {
        activeAgentRunId.value = event.runId;
    }

    if (event.type === 'run.completed') {
        void loadWorkspaceProjects();
    }
};

const appendLocalAgentFailure = (message: string) => {
    agentEvents.value = [
        ...agentEvents.value,
        {
            createdAt: new Date().toISOString(),
            error: message,
            runId: `local_${Date.now()}`,
            sequence: agentEvents.value.length + 1,
            type: 'run.failed'
        }
    ];
};

const handleAgentSubmit = async (input: CreateAgentSubmitInput) => {
    activeView.value = 'create';
    agentEvents.value = [];
    lastAgentSubmitInput.value = input;

    if (typeof window === 'undefined' || !window.magicutAPI?.videoAgent) {
        appendLocalAgentFailure('智能体接口尚未就绪');
        return;
    }

    const result = await window.magicutAPI.videoAgent.start({
        ...input,
        canvas: defaultVideoAgentCanvas
    });

    if (result.success === false) {
        appendLocalAgentFailure(result.error.message);
        return;
    }

    activeAgentRunId.value = result.data.runId;
};

const getLatestAgentRunId = () =>
    latestAgentEvent.value?.runId ?? activeAgentRunId.value;

const handleAgentApprove = async () => {
    const runId = getLatestAgentRunId();

    if (!runId || typeof window === 'undefined') return;

    const result = await window.magicutAPI.videoAgent.approve({
        approved: true,
        runId
    });

    if (result.success === false) {
        appendLocalAgentFailure(result.error.message);
    }
};

const handleAgentCancel = async () => {
    const runId = getLatestAgentRunId();

    if (!runId || typeof window === 'undefined') return;

    const result = await window.magicutAPI.videoAgent.cancel({ runId });

    if (result.success === false) {
        appendLocalAgentFailure(result.error.message);
    }
};

const handleAgentRetry = () => {
    if (!lastAgentSubmitInput.value) return;

    void handleAgentSubmit(lastAgentSubmitInput.value);
};

const handleProjectDeleteRequest = (project: WorkspaceProject) => {
    projectDeleteErrorMessage.value = undefined;
    projectPendingDeletion.value = project;
};

const handleProjectDeleteCancel = () => {
    if (isProjectDeleting.value) return;

    projectDeleteErrorMessage.value = undefined;
    projectPendingDeletion.value = undefined;
};

const handleProjectDeleteConfirm = async () => {
    const project = projectPendingDeletion.value;

    if (!project) return;

    if (typeof window === 'undefined' || !window.magicutAPI?.videoProject) {
        projectDeleteErrorMessage.value = '项目删除接口尚未就绪';
        return;
    }

    isProjectDeleting.value = true;
    const result = await window.magicutAPI.videoProject.delete(project.id);

    if (result.success === false) {
        projectDeleteErrorMessage.value = result.error.message;
        isProjectDeleting.value = false;
        return;
    }

    workspaceProjectsFromStore.value = workspaceProjectsFromStore.value.filter(
        (item) => item.id !== project.id
    );
    projectDeleteErrorMessage.value = undefined;
    projectPendingDeletion.value = undefined;
    isProjectDeleting.value = false;
};

watch(
    () => props.initialView,
    (nextView) => {
        activeView.value = nextView;
    }
);

onMounted(() => {
    if (typeof window === 'undefined') return;

    void loadWorkspaceProjects();

    unsubscribeAgentEvents =
        window.magicutAPI?.videoAgent?.onEvent(appendAgentEvent);
});

onUnmounted(() => {
    unsubscribeAgentEvents?.();
});
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
                    <CreateMainContent
                        :agent-events="agentEvents"
                        :content="createPageContent"
                        :is-agent-busy="isAgentBusy"
                        @agent-approve="handleAgentApprove"
                        @agent-cancel="handleAgentCancel"
                        @agent-retry="handleAgentRetry"
                        @agent-submit="handleAgentSubmit"
                    />
                </div>
                <div
                    data-workspace-view="projects"
                    :class="viewClassName('projects')"
                >
                    <WorkspaceProjectsContent
                        :header="workspaceHeader"
                        :create-card="workspaceCreateCard"
                        :projects="workspaceProjectsFromStore"
                        @create="selectView('create')"
                        @project-delete-request="handleProjectDeleteRequest"
                    />
                </div>
            </section>
        </div>
        <ProjectDeleteConfirmDialog
            :error-message="projectDeleteErrorMessage"
            :is-deleting="isProjectDeleting"
            :project="projectPendingDeletion"
            @cancel="handleProjectDeleteCancel"
            @confirm="handleProjectDeleteConfirm"
        />
    </main>
</template>
