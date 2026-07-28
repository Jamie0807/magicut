<script setup lang="ts">
import type { CreatePageContent } from '../../types/create';

import GradientText from './GradientText.vue';

defineProps<{
    content: CreatePageContent;
}>();
</script>

<template>
    <header class="flex h-[148px] w-full flex-col items-center gap-[22px]">
        <h1
            class="flex h-[78px] items-center justify-center text-[62px] leading-none font-[900]"
        >
            <span class="text-white">{{ content.titlePrefix }}</span>
            <GradientText
                :colors="content.titleAccentColors"
                :animation-speed="7"
            >
                {{ content.titleAccent }}
            </GradientText>
        </h1>
        <p class="text-[24px] leading-[1.2] font-[650] text-[#8D8797]">
            {{ content.subtitle }}
        </p>
    </header>
</template>
