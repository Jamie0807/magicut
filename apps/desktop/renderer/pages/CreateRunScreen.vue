<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';

import AgentConversationTimeline from '../components/agent/AgentConversationTimeline.vue';
import AgentRunStageNav from '../components/agent/AgentRunStageNav.vue';
import WindowDragRegion from '../components/WindowDragRegion.vue';
import {
    approveAgentRun,
    cancelAgentRun,
    ensureAgentRunEventSubscription,
    getAgentRunSnapshot
} from '../stores/agent-run-store';

const props = defineProps<{
    runId?: string;
}>();

const route = useRoute();
const routeRunId = computed(() =>
    typeof route.params.runId === 'string' ? route.params.runId : undefined
);
const requestedRunId = computed(() => props.runId ?? routeRunId.value);
const snapshot = computed(() => getAgentRunSnapshot(requestedRunId.value));
const resolvedRunId = computed(
    () => requestedRunId.value ?? snapshot.value.activeRunId
);
const headerTime = new Intl.DateTimeFormat('zh-CN', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: '2-digit'
}).format(new Date());

const handleApprove = () => {
    if (!resolvedRunId.value) return;

    void approveAgentRun(resolvedRunId.value);
};

const handleCancel = () => {
    if (!resolvedRunId.value) return;

    void cancelAgentRun(resolvedRunId.value);
};

onMounted(() => {
    ensureAgentRunEventSubscription();
});
</script>

<template>
    <main
        data-create-run-message-page="true"
        class="relative h-screen min-h-[720px] overflow-hidden bg-[#08090D] text-[#F5F7FA]"
    >
        <WindowDragRegion />
        <section
            data-create-run-chat-shell="true"
            class="relative mx-auto flex h-full w-[860px] flex-col"
        >
            <time
                class="mt-6 shrink-0 text-center text-[12px] leading-none font-[650] text-[#6F7784]"
            >
                {{ headerTime }}
            </time>
            <div class="min-h-0 flex-1 overflow-y-auto pb-[14px] pt-[18px]">
                <AgentConversationTimeline
                    :view-model="snapshot.viewModel"
                    @approve="handleApprove"
                    @cancel="handleCancel"
                />
            </div>
        </section>
        <AgentRunStageNav :stage-items="snapshot.viewModel.stageItems" />
    </main>
</template>
