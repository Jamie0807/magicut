<script setup lang="ts">
import { computed } from 'vue';

import type { SliderRow } from '../../../types/config';

import IconGlyph from '../../editor/IconGlyph.vue';
import ConfigTrackSlider from './ConfigTrackSlider.vue';

const props = defineProps<{
    slider: SliderRow;
}>();
const emit = defineEmits<{
    valueChange: [value: number];
}>();

const range = computed(() => {
    const min = props.slider.min ?? 0;
    const max = props.slider.max ?? 100;
    const value = props.slider.numericValue ?? min;
    const progress = max === min ? 0 : ((value - min) / (max - min)) * 100;

    return {
        max,
        min,
        progressPercent: Math.min(Math.max(progress, 0), 100),
        step: props.slider.step ?? 1,
        value
    };
});

const handleInput = (event: Event) => {
    emit('valueChange', Number((event.target as HTMLInputElement).value));
};
</script>

<template>
    <div class="grid gap-2.5">
        <div class="flex items-center gap-2">
            <IconGlyph
                v-if="slider.icon"
                :name="slider.icon"
                class-name="h-4 w-4 text-[#A9AFBA]"
            />
            <span class="text-[12px] font-[750] text-[#A9AFBA]">
                {{ slider.label }}
            </span>
            <span
                class="ml-auto font-['Geist_Mono'] text-[12px] font-bold text-[#F5F7FA]"
            >
                {{ slider.value }}
            </span>
        </div>
        <ConfigTrackSlider
            :track-width-class-name="slider.trackWidthClassName"
            :progress-width-class-name="slider.progressWidthClassName"
            :thumb-left-class-name="slider.thumbLeftClassName"
            :progress-percent="
                slider.numericValue === undefined
                    ? undefined
                    : range.progressPercent
            "
            :thumb-percent="
                slider.numericValue === undefined
                    ? undefined
                    : range.progressPercent
            "
        >
            <input
                v-if="slider.numericValue !== undefined"
                type="range"
                :aria-label="slider.label"
                class="absolute inset-0 h-4 w-full cursor-pointer opacity-0"
                :max="range.max"
                :min="range.min"
                :step="range.step"
                :value="range.value"
                @input="handleInput"
            />
        </ConfigTrackSlider>
    </div>
</template>
