<script setup lang="ts">
import type { VoiceUploadCard } from '../../../types/config';

import IconGlyph from '../../editor/IconGlyph.vue';

withDefaults(
    defineProps<{
        card: VoiceUploadCard;
        className?: string;
        disabled?: boolean;
        statusLabel?: string;
    }>(),
    {
        className: undefined,
        disabled: false,
        statusLabel: undefined
    }
);
const emit = defineEmits<{
    click: [];
}>();
</script>

<template>
    <button
        type="button"
        :disabled="disabled"
        :class="[
            'relative h-[72px] w-[260px] rounded-[12px] border border-[#3A3F49] bg-[#101216] px-[14px] py-[13px] text-left transition-all duration-200',
            disabled
                ? 'cursor-not-allowed opacity-60'
                : 'cursor-pointer hover:-translate-y-[1px] hover:bg-[#262B33]',
            className
        ]"
        @click="emit('click')"
    >
        <div
            class="flex h-[23px] w-[107px] items-center gap-1 rounded-[8px] text-left text-white"
        >
            <IconGlyph :name="card.buttonIcon" class-name="h-4 w-4 shrink-0" />
            <span class="text-[12px] leading-none font-[800]">
                {{ card.title }}
            </span>
        </div>
        <p
            class="mt-[12px] max-w-[193px] text-[9px] leading-[1.25] font-semibold text-[#6F7784]"
        >
            {{ statusLabel ?? card.description }}
        </p>
    </button>
</template>
