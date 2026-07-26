<script setup lang="ts">
import type { SliderTrackConfig } from '../../../types/config';

defineProps<
    Pick<
        SliderTrackConfig,
        'trackWidthClassName' | 'progressWidthClassName' | 'thumbLeftClassName'
    >
>();
</script>

<template>
    <div class="flex w-full justify-end">
        <div :class="['relative h-4 shrink-0', trackWidthClassName]">
            <span
                class="absolute top-[5px] left-0 h-[6px] w-full rounded-full bg-[#30343C]"
            />
            <span
                :class="[
                    'absolute top-[5px] h-[6px] rounded-full bg-white',
                    progressWidthClassName
                ]"
            />
            <span
                :class="[
                    'absolute top-0 h-4 w-4 rounded-full border-[3px] border-[#0E0F12] bg-white',
                    thumbLeftClassName
                ]"
            />
        </div>
    </div>
</template>
