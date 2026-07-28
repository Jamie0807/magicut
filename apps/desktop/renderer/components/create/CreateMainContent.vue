<script setup lang="ts">
import type { CreatePageContent } from '../../types/create';
import SoftAurora from '../reactbits/SoftAurora/SoftAurora.vue';

import CreateHero from './CreateHero.vue';
import CreateInputPanel from './CreateInputPanel.vue';

defineProps<{
    content: CreatePageContent;
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
                class="absolute top-[362px] left-[129px] w-[1340px] max-w-[calc(100%-258px)]"
            >
                <CreateInputPanel :content="content" />
            </div>
        </div>
    </section>
</template>
