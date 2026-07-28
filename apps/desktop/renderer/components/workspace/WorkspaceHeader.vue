<script setup lang="ts">
import type { WorkspaceHeaderContent } from '../../types/workspace';

defineProps<{
    content: WorkspaceHeaderContent;
}>();
</script>

<template>
    <header class="grid gap-[5px]">
        <h2 class="text-[24px] leading-none font-[850] text-[#F5F7FA]">
            {{ content.title }}
        </h2>
        <p
            class="font-['Geist'] text-[12px] leading-none font-[650] text-[#858B96]"
        >
            {{ content.subtitle }}
        </p>
    </header>
</template>
