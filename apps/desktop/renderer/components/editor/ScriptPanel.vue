<script setup lang="ts">
import { computed } from 'vue';

import {
    storyboardItems,
    storyboardSummary
} from '../../constants/editor-screen';
import type { StoryboardData, StoryboardItem } from '../../types/editor-screen';

const fallbackStoryboardData: StoryboardData = {
    items: storyboardItems,
    summary: storyboardSummary
};

const props = defineProps<{
    data?: StoryboardData;
}>();
const storyboardData = computed(() => props.data ?? fallbackStoryboardData);

const cardToneClassNames: Record<StoryboardItem['tone'], string> = {
    current:
        'border-[#F05F73] bg-[#0B0D11] p-[12px_14px_13px] shadow-[0_10px_20px_rgba(0,0,0,0.6)]',
    default: 'border-transparent bg-[#171A20] p-[10px_12px]'
};

const textToneClassNames: Record<StoryboardItem['tone'], string> = {
    current: 'font-bold text-[#F5F7FA]',
    default: 'font-medium text-[#A9AFBA]'
};

const metaToneClassNames: Record<StoryboardItem['tone'], string> = {
    current: 'text-[#DCE7FF]',
    default: 'text-[#6F7784]'
};

const cards = computed(() =>
    storyboardData.value.items.map((item) => ({
        item,
        key: `${item.title}-${item.time}-${item.body}`
    }))
);
</script>

<template>
    <aside
        class="min-h-0 overflow-hidden border-r border-[#2A2F38] bg-[#15171B] p-[18px_16px]"
    >
        <div class="mb-3 grid gap-1.5">
            <h2 class="text-xl leading-[1.1] font-bold">
                {{ storyboardData.summary.title }}
            </h2>
            <p
                class="font-['Geist'] text-[11px] leading-[1.2] font-medium text-[#6F7784]"
            >
                {{ storyboardData.summary.meta }}
            </p>
        </div>
        <div class="grid gap-2">
            <article
                v-for="{ item, key } in cards"
                :key="key"
                :class="['rounded-md border', cardToneClassNames[item.tone]]"
            >
                <div class="mb-2 flex items-center justify-between gap-3">
                    <div class="flex items-center gap-2">
                        <span
                            :class="[
                                `font-['Geist'] leading-none font-bold`,
                                item.tone === 'current'
                                    ? 'text-xs text-[#F5F7FA]'
                                    : 'text-[11px] text-[#6F7784]'
                            ]"
                        >
                            {{ item.title }}
                        </span>
                        <span
                            v-if="item.tone === 'current'"
                            class="rounded-full bg-[#F05F73]/15 px-2 py-0.5 font-['Geist'] text-[10px] leading-none font-bold text-[#F05F73]"
                        >
                            当前
                        </span>
                    </div>
                    <span
                        :class="[
                            `font-['Geist'] leading-none font-semibold`,
                            item.tone === 'current'
                                ? 'text-[11px]'
                                : 'text-[10px]',
                            metaToneClassNames[item.tone]
                        ]"
                    >
                        {{ item.time }}
                    </span>
                </div>
                <p
                    :class="[
                        'text-sm leading-[1.5] whitespace-pre-line',
                        textToneClassNames[item.tone]
                    ]"
                >
                    {{ item.body }}
                </p>
            </article>
        </div>
    </aside>
</template>
