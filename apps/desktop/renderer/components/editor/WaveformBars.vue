<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
    defineProps<{
        bars?: number;
    }>(),
    {
        bars: 18
    }
);

const waveformBarHeights = ['h-2', 'h-3', 'h-4', 'h-5', 'h-6'];
const barIndexes = computed(() =>
    Array.from({ length: props.bars }, (_, index) => index)
);
</script>

<template>
    <div class="flex items-center gap-[3px]" aria-hidden="true">
        <span
            v-for="index in barIndexes"
            :key="index"
            :class="[
                'w-[3px] rounded-full bg-[#BFFFE266]',
                waveformBarHeights[index % waveformBarHeights.length]
            ]"
        />
    </div>
</template>
