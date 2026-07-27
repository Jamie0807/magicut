<script setup lang="ts">
import type { SliderRow } from '../../../types/config';

import IconGlyph from '../../editor/IconGlyph.vue';
import ConfigTrackSlider from './ConfigTrackSlider.vue';

defineProps<{
    slider: SliderRow;
}>();
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
        />
    </div>
</template>
