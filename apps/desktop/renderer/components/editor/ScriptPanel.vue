<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue';

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
    autoScrollActiveItem?: boolean;
    data?: StoryboardData;
}>();
const emit = defineEmits<{
    seek: [timeMs: number];
}>();
const storyboardData = computed(() => props.data ?? fallbackStoryboardData);
const itemRefs = shallowRef(new Map<string, HTMLButtonElement>());

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
        key: createStoryboardItemKey(item),
        seekTimeMs: getStoryboardSeekTimeMs(item)
    }))
);

const parseStoryboardTimeStartMs = (time: string) => {
    const [startTime] = time.split('-');
    const parts = startTime?.split(':').map(Number);

    if (!parts || parts.some((part) => Number.isNaN(part))) {
        return undefined;
    }

    const [first = 0, second = 0, third] = parts;
    const totalSeconds =
        third === undefined
            ? first * 60 + second
            : first * 3600 + second * 60 + third;

    return totalSeconds * 1000;
};

const getStoryboardSeekTimeMs = (item: StoryboardItem) =>
    typeof item.startMs === 'number'
        ? item.startMs
        : parseStoryboardTimeStartMs(item.time);

const createStoryboardItemKey = (item: StoryboardItem) =>
    `${item.title}-${item.startMs ?? 'static'}-${item.body}`;

const activeItemKey = computed(() =>
    cards.value
        .filter(({ item }) => item.tone === 'current')
        .map(({ key }) => key)
        .at(0)
);

const setItemRef = (key: string, element: Element | null) => {
    const nextRefs = new Map(itemRefs.value);

    if (element instanceof HTMLButtonElement) {
        nextRefs.set(key, element);
    } else {
        nextRefs.delete(key);
    }

    itemRefs.value = nextRefs;
};

const handleCardClick = (seekTimeMs?: number) => {
    if (seekTimeMs === undefined) return;

    emit('seek', seekTimeMs);
};

watch(activeItemKey, (key) => {
    if (!props.autoScrollActiveItem || !key) return;

    itemRefs.value.get(key)?.scrollIntoView({
        block: 'nearest'
    });
});
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
        <div
            data-script-scroll="true"
            class="min-h-0 flex-1 overflow-y-auto pr-1"
        >
            <div class="grid gap-2">
                <button
                    v-for="{ item, key, seekTimeMs } in cards"
                    :key="key"
                    :ref="(element) => setItemRef(key, element)"
                    type="button"
                    :data-storyboard-current="
                        item.tone === 'current' ? 'true' : undefined
                    "
                    :data-storyboard-seek-time="seekTimeMs"
                    :disabled="seekTimeMs === undefined"
                    :class="[
                        'w-full rounded-md border text-left transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F05F73]',
                        seekTimeMs === undefined
                            ? 'cursor-default'
                            : 'cursor-pointer hover:border-[#F05F73]/70',
                        cardToneClassNames[item.tone]
                    ]"
                    @click="handleCardClick(seekTimeMs)"
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
                </button>
            </div>
        </div>
    </aside>
</template>
