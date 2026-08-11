<script setup lang="ts">
import { computed } from 'vue';

import type { SubtitlePreset } from '../../../types/config';

const props = defineProps<SubtitlePreset>();
const emit = defineEmits<{
    click: [];
}>();

const swatchStyle = computed(() => ({
    backgroundColor: props.backgroundColor,
    borderColor: props.active ? '#F05F73' : props.borderColor
}));
</script>

<template>
    <button
        type="button"
        :aria-pressed="active"
        data-testid="subtitle-preset"
        :data-active="active"
        :data-subtitle-preset="label"
        class="flex h-[36px] w-[32px] items-center justify-center rounded-[8px] border transition-all duration-200 hover:-translate-y-[1px]"
        :style="swatchStyle"
        @click="emit('click')"
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
