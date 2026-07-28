<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
    defineProps<{
        bars?: number;
        size?: 'compact' | 'default';
    }>(),
    {
        bars: 18,
        size: 'default'
    }
);

const waveformBarHeightClassNames = {
    compact: ['h-1', 'h-1.5', 'h-2', 'h-2.5', 'h-3'],
    default: ['h-2', 'h-3', 'h-4', 'h-5', 'h-6']
} satisfies Record<NonNullable<typeof props.size>, string[]>;
const waveformSizeClassNames = {
    compact: 'gap-[2px]',
    default: 'gap-[3px]'
} satisfies Record<NonNullable<typeof props.size>, string>;
const waveformBarWidthClassNames = {
    compact: 'w-[2px]',
    default: 'w-[3px]'
} satisfies Record<NonNullable<typeof props.size>, string>;
const barHeights = computed(() => waveformBarHeightClassNames[props.size]);
const barIndexes = computed(() =>
    Array.from({ length: props.bars }, (_, index) => index)
);
</script>

<template>
    <div
        class="flex items-center"
        :class="waveformSizeClassNames[size]"
        :data-waveform-size="size"
        aria-hidden="true"
    >
        <span
            v-for="index in barIndexes"
            :key="index"
            :class="[
                waveformBarWidthClassNames[size],
                'rounded-full bg-[#BFFFE266]',
                barHeights[index % barHeights.length]
            ]"
        />
    </div>
</template>
