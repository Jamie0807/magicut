<script setup lang="ts">
import type { VoicePresetCard } from '../../../types/config';

import IconGlyph from '../../editor/IconGlyph.vue';

defineProps<{
    card: VoicePresetCard;
}>();
</script>

<template>
    <button
        type="button"
        :aria-pressed="card.selected"
        :class="[
            'flex h-[54px] w-[126px] items-start justify-between rounded-[10px] border px-3 py-2 text-left',
            card.selected
                ? 'border-[#F05F73] bg-[#f0607333]'
                : 'border-[#2A2F38] bg-[#13161B]'
        ]"
    >
        <span class="grid gap-0.5">
            <span
                :class="[
                    'text-[13px] font-[800]',
                    card.selected ? 'text-[#F5F7FA]' : 'text-[#A9AFBA]'
                ]"
            >
                {{ card.title }}
            </span>
            <span
                :class="[
                    'text-[10px] font-semibold',
                    card.selected ? 'text-[#F05F73]' : 'text-[#6F7784]'
                ]"
            >
                {{ card.description }}
            </span>
        </span>
        <span
            :class="[
                'mt-[2px] grid h-6 w-6 place-items-center rounded-full',
                card.selected ? 'bg-[#f0607340]' : 'bg-[#20242B]'
            ]"
        >
            <IconGlyph
                :name="card.actionIcon"
                :class-name="
                    [
                        'h-3 w-3',
                        card.selected ? 'text-[#F05F73]' : 'text-[#A9AFBA]'
                    ].join(' ')
                "
            />
        </span>
    </button>
</template>
