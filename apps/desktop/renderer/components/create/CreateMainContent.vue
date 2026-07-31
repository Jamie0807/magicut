<script setup lang="ts">
import type { DesktopAgentRunEvent } from '../../../shared/video-agent';
import type {
    CreateAgentSubmitInput,
    CreatePageContent
} from '../../types/create';
import SoftAurora from '../reactbits/SoftAurora/SoftAurora.vue';

import CreateAgentProgress from './CreateAgentProgress.vue';
import CreateHero from './CreateHero.vue';
import CreateInputPanel from './CreateInputPanel.vue';

withDefaults(
    defineProps<{
        agentEvents?: DesktopAgentRunEvent[];
        content: CreatePageContent;
        isAgentBusy?: boolean;
    }>(),
    {
        agentEvents: () => [],
        isAgentBusy: false
    }
);

const emit = defineEmits<{
    agentApprove: [];
    agentCancel: [];
    agentRetry: [];
    agentSubmit: [input: CreateAgentSubmitInput];
}>();
</script>

<template>
    <section class="relative h-full min-w-0 overflow-hidden bg-[#090A0E]">
        <div class="absolute inset-0 bg-[#090A0E]" />
        <div
            class="create-main-soft-aurora-layer pointer-events-none absolute inset-0 z-[1] overflow-hidden opacity-75 mix-blend-screen"
        >
            <div class="absolute top-[280px] left-0 h-[620px] w-full">
                <SoftAurora
                    color1="#F7F7F7"
                    color2="#E100FF"
                    :brightness="0.66"
                    :scale="1.55"
                    :speed="0.52"
                    :band-height="0.58"
                    :band-spread="1.08"
                />
            </div>
        </div>
        <div class="relative z-10 h-full w-full">
            <div
                class="absolute top-[155px] left-[149px] w-[1300px] max-w-[calc(100%-298px)]"
            >
                <CreateHero :content="content" />
            </div>
            <div
                class="absolute top-[238px] left-[460px] z-20 w-[650px] max-w-[calc(100%-920px)]"
            >
                <CreateAgentProgress
                    :events="agentEvents"
                    @approve="emit('agentApprove')"
                    @cancel="emit('agentCancel')"
                    @retry="emit('agentRetry')"
                />
            </div>
            <div
                class="absolute top-[362px] left-[129px] z-10 w-[1340px] max-w-[calc(100%-258px)]"
            >
                <CreateInputPanel
                    :content="content"
                    :disabled="isAgentBusy"
                    @submit="emit('agentSubmit', $event)"
                />
            </div>
        </div>
    </section>
</template>
