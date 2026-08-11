<script setup lang="ts">
import type { SliderTrackConfig } from '../../../types/config';

withDefaults(
    defineProps<
        Pick<
            SliderTrackConfig,
            | 'progressWidthClassName'
            | 'thumbLeftClassName'
            | 'trackWidthClassName'
        > & {
            progressPercent?: number;
            thumbPercent?: number;
        }
    >(),
    {
        progressPercent: undefined,
        thumbPercent: undefined
    }
);
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
                    progressPercent === undefined
                        ? progressWidthClassName
                        : undefined
                ]"
                :style="
                    progressPercent === undefined
                        ? undefined
                        : { width: `${progressPercent}%` }
                "
            />
            <span
                :class="[
                    'absolute top-0 h-4 w-4 rounded-full border-[3px] border-[#0E0F12] bg-white',
                    thumbPercent === undefined ? thumbLeftClassName : undefined
                ]"
                :style="
                    thumbPercent === undefined
                        ? undefined
                        : { left: `calc(${thumbPercent}% - 8px)` }
                "
            />
            <slot />
        </div>
    </div>
</template>
