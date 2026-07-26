<script setup lang="ts">
import type { VoiceSlider } from '../../../types/config';

import IconGlyph from '../../editor/IconGlyph.vue';

defineProps<{
    slider: VoiceSlider;
}>();
</script>

<template>
    <div class="grid gap-2.5">
        <div class="flex items-center gap-2">
            <IconGlyph
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
        <div class="flex w-full justify-end">
            <div :class="['relative h-4 shrink-0', slider.trackWidthClassName]">
                <span
                    class="absolute top-[5px] left-0 h-[6px] w-full rounded-full bg-[#30343C]"
                />
                <span
                    :class="[
                        'absolute top-[5px] h-[6px] rounded-full bg-white',
                        slider.progressWidthClassName
                    ]"
                />
                <span
                    :class="[
                        'absolute top-0 h-4 w-4 rounded-full border-[3px] border-[#0E0F12] bg-white',
                        slider.thumbLeftClassName
                    ]"
                />
            </div>
        </div>
    </div>
</template>
