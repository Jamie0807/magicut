<script setup lang="ts">
import type { SubtitlePreset } from '../../../types/config';

defineProps<SubtitlePreset>();
</script>

<template>
    <button
        type="button"
        :aria-pressed="active"
        data-testid="subtitle-preset"
        :data-active="active"
        class="flex h-[36px] w-[32px] items-center justify-center rounded-[8px] border transition-all duration-200 hover:-translate-y-[1px]"
        :style="{ backgroundColor, borderColor }"
    >
        <div class="relative h-full w-full" aria-hidden="true">
            <span
                class="absolute top-[6px] left-[8px] text-[20px] leading-none font-[900]"
                :style="{ color: outerTextColor }"
            >
                T
            </span>
            <span
                class="absolute top-[6px] left-[10px] text-[20px] leading-none font-[900]"
                :style="{ color: innerTextColor }"
            >
                T
            </span>
        </div>
        <span class="sr-only">{{ label }}</span>
    </button>
</template>
