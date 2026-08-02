<script setup lang="ts">
import { computed, shallowRef, useTemplateRef, watch } from 'vue';
import type { CSSProperties } from 'vue';

import {
    timelineClipsByTrack,
    timelineLayout,
    timelinePanel,
    timelineTicks,
    timelineToolActions,
    timelineTracks
} from '../../constants/editor-screen';
import type {
    TimelineClip,
    TimelineData,
    TimelineToolAction,
    TimelineTrack,
    TimelineTrackKind
} from '../../types/editor-screen';
import {
    calculateTimelinePointerTimeMs,
    formatTimelinePointerTime
} from '../../utils/timelinePointer';

import IconButton from './IconButton.vue';
import IconGlyph from './IconGlyph.vue';
import WaveformBars from './WaveformBars.vue';

const trackToneClassNames: Record<TimelineTrack['tone'], string> = {
    primary: 'bg-[#111318]',
    muted: 'bg-[#0E1014]'
};

const trackContentClassNames: Record<TimelineTrackKind, string> = {
    music: 'bg-[#101216]',
    subtitle: 'bg-[#15171B]',
    video: 'bg-[#15171B]',
    voice: 'bg-[#101216]'
};

const clipTextClassNames: Record<TimelineTrackKind, string> = {
    music: 'text-[11px] font-bold text-[#DCE7FF]',
    subtitle: 'text-[11px] font-bold text-[#F5F7FA]',
    video: 'text-[11px] font-extrabold text-[#F5F7FA]',
    voice: 'text-[11px] font-bold text-[#F5F7FA]'
};

const timelineToolButtonVariant: Record<
    TimelineToolAction['tone'],
    'timeline' | 'timelineActive'
> = {
    default: 'timeline',
    active: 'timelineActive'
};

const decorativeThumbnailIndexes = [0, 1, 2, 3];
const timelineTrackRowStartClassNames = [
    'row-start-2',
    'row-start-3',
    'row-start-4',
    'row-start-5'
] as const;
const PLAYHEAD_CONTENT_START_PX = 200;
const PLAYHEAD_LINE_OFFSET_PX = 9;
const PLAYHEAD_SCROLL_LEADING_PADDING_PX = 24;
const PLAYHEAD_SCROLL_TRAILING_PADDING_PX = 96;
const FALLBACK_TIMELINE_DURATION_MS = 90_000;

const fallbackTimelineData: TimelineData = {
    clipsByTrack: timelineClipsByTrack,
    layout: timelineLayout,
    panel: timelinePanel,
    playhead: {
        currentTimeMs: 0,
        progress: 0
    },
    ticks: timelineTicks,
    tracks: timelineTracks
};

const props = defineProps<{
    data?: TimelineData;
    durationMs?: number;
    hoverTimeMs?: number;
}>();
const emit = defineEmits<{
    pointerTimeClear: [];
    pointerTimeCommit: [timeMs: number];
    pointerTimePreview: [timeMs: number];
}>();
const timelineData = computed(() => props.data ?? fallbackTimelineData);
const scrollContainerRef = useTemplateRef<HTMLDivElement>('scrollContainerRef');
const scrollLeftPx = shallowRef(0);
const contentWidthPx = computed(
    () => timelineData.value.layout.contentWidthPx ?? 1728
);
const durationMs = computed(
    () => props.durationMs ?? FALLBACK_TIMELINE_DURATION_MS
);
const playheadX = computed(
    () => contentWidthPx.value * timelineData.value.playhead.progress
);

const trackRows = computed(() =>
    timelineData.value.tracks.map((track, index) => ({
        track,
        rowClassName: timelineTrackRowStartClassNames[index] ?? 'row-start-2'
    }))
);

const clipStyle = (clip: TimelineClip): CSSProperties => ({
    width: `${clip.widthPx}px`
});

const handleTimelineScroll = (event: Event) => {
    scrollLeftPx.value = (event.currentTarget as HTMLDivElement).scrollLeft;
};

const calculateEventTimeMs = (event: MouseEvent | PointerEvent) => {
    const scrollContainer = event.currentTarget as HTMLDivElement;
    const rect = scrollContainer.getBoundingClientRect();

    return calculateTimelinePointerTimeMs({
        clientX: event.clientX,
        contentWidthPx: contentWidthPx.value,
        durationMs: durationMs.value,
        scrollContainerLeft: rect.left,
        scrollLeft: scrollContainer.scrollLeft
    });
};

const handleTimelineClick = (event: MouseEvent) => {
    emit('pointerTimeCommit', calculateEventTimeMs(event));
};

const handleTimelinePointerMove = (event: PointerEvent) => {
    emit('pointerTimePreview', calculateEventTimeMs(event));
};

const handleTimelinePointerLeave = () => {
    emit('pointerTimeClear');
};

const timelineContentStyle = computed<CSSProperties | undefined>(() => {
    if (!timelineData.value.layout.contentWidthPx) {
        return undefined;
    }

    return {
        minWidth: `${timelineData.value.layout.contentWidthPx}px`,
        width: `${timelineData.value.layout.contentWidthPx}px`
    };
});

const tickStyle = computed<CSSProperties | undefined>(() => {
    if (!timelineData.value.layout.tickWidthPx) {
        return undefined;
    }

    return {
        width: `${timelineData.value.layout.tickWidthPx}px`
    };
});

const calculateTimelineScrollLeft = ({
    contentWidthPx,
    currentScrollLeft,
    playheadX,
    viewportWidth
}: {
    contentWidthPx: number;
    currentScrollLeft: number;
    playheadX: number;
    viewportWidth: number;
}) => {
    if (viewportWidth <= 0) return currentScrollLeft;

    const maxScrollLeft = Math.max(0, contentWidthPx - viewportWidth);
    const visibleStart = currentScrollLeft + PLAYHEAD_SCROLL_LEADING_PADDING_PX;
    const visibleEnd =
        currentScrollLeft + viewportWidth - PLAYHEAD_SCROLL_TRAILING_PADDING_PX;

    if (playheadX < visibleStart) {
        return Math.max(0, playheadX - PLAYHEAD_SCROLL_LEADING_PADDING_PX);
    }

    if (playheadX > visibleEnd) {
        return Math.min(
            maxScrollLeft,
            playheadX - viewportWidth + PLAYHEAD_SCROLL_TRAILING_PADDING_PX
        );
    }

    return currentScrollLeft;
};

const playheadStyle = computed<CSSProperties>(() => {
    const visiblePlayheadX = playheadX.value - scrollLeftPx.value;

    return {
        left: `calc(${PLAYHEAD_CONTENT_START_PX}px - ${PLAYHEAD_LINE_OFFSET_PX}px)`,
        transform: `translateX(${visiblePlayheadX}px)`
    };
});

const hoverPlayheadTimeMs = computed(() =>
    props.hoverTimeMs === undefined || durationMs.value <= 0
        ? undefined
        : Math.min(Math.max(props.hoverTimeMs, 0), durationMs.value)
);

const hoverPlayheadStyle = computed<CSSProperties>(() => {
    const clampedTimeMs = hoverPlayheadTimeMs.value ?? 0;
    const progress =
        durationMs.value > 0 ? clampedTimeMs / durationMs.value : 0;
    const visiblePlayheadX =
        contentWidthPx.value * progress - scrollLeftPx.value;

    return {
        left: `calc(${PLAYHEAD_CONTENT_START_PX}px - ${PLAYHEAD_LINE_OFFSET_PX}px)`,
        transform: `translateX(${visiblePlayheadX}px)`
    };
});

const hoverPlayheadLabel = computed(() =>
    hoverPlayheadTimeMs.value === undefined
        ? ''
        : formatTimelinePointerTime(hoverPlayheadTimeMs.value)
);

watch([contentWidthPx, playheadX], () => {
    const scrollContainer = scrollContainerRef.value;

    if (!scrollContainer) return;

    const nextScrollLeft = calculateTimelineScrollLeft({
        contentWidthPx: contentWidthPx.value,
        currentScrollLeft: scrollContainer.scrollLeft,
        playheadX: playheadX.value,
        viewportWidth: scrollContainer.clientWidth
    });

    if (Math.abs(nextScrollLeft - scrollContainer.scrollLeft) <= 1) {
        return;
    }

    scrollContainer.scrollTo({
        behavior: 'smooth',
        left: nextScrollLeft
    });
    scrollLeftPx.value = nextScrollLeft;
});
</script>

<template>
    <section
        :class="[
            'relative flex min-h-0 flex-col overflow-hidden border-t border-[#2A2F38] bg-[#121418]',
            timelineData.layout.sectionHeightClassName
        ]"
        aria-label="时间线"
    >
        <div
            :class="[
                'flex h-[42px] w-full items-center justify-between border-b border-[#2A2F38] bg-[#15171B] px-3 py-[6px]',
                timelineData.layout.titleBarHeightClassName
            ]"
        >
            <div class="flex items-center gap-4">
                <h2 class="font-sm">
                    {{ timelineData.panel.title }}
                </h2>
                <span class="font-['Geist_Mono'] text-xs text-[#A9AFBA]">
                    {{ timelineData.panel.timecode }}
                </span>
            </div>
            <div class="flex items-center gap-2.5">
                <IconButton
                    v-for="action in timelineToolActions"
                    :key="action.label"
                    :label="action.label"
                    :icon="action.icon"
                    :variant="timelineToolButtonVariant[action.tone]"
                    class-name="h-7 w-7"
                    icon-class-name="h-[15px] w-[15px]"
                />
                <div class="flex h-[14px] w-[136px] items-center gap-2">
                    <IconGlyph
                        name="minus"
                        class-name="h-[14px] w-[14px] text-[#6F7784]"
                    />
                    <div
                        class="relative h-1 w-[92px] rounded-full bg-[#2A2F38]"
                    >
                        <span
                            class="absolute top-0 left-0 h-1 w-[54px] rounded-full bg-white"
                        />
                        <span
                            class="absolute top-[-4px] left-[50px] h-3 w-3 rounded-full bg-white"
                        />
                    </div>
                    <IconGlyph
                        name="plus"
                        class-name="h-[14px] w-[14px] text-[#6F7784]"
                    />
                </div>
            </div>
        </div>

        <div
            :class="[
                'grid min-h-0 w-full flex-1',
                timelineData.layout.contentGridClassName,
                timelineData.layout.contentRowsClassName
            ]"
        >
            <div
                class="col-start-1 row-start-1 border-r border-b border-[#2A2F38] bg-[#111318]"
            />

            <div
                v-for="{ track, rowClassName } in trackRows"
                :key="track.id"
                :class="[
                    'col-start-1 flex h-full items-center gap-3 border-r border-b border-[#2A2F38] px-[18px]',
                    rowClassName,
                    trackToneClassNames[track.tone]
                ]"
            >
                <IconGlyph
                    :name="track.icon"
                    class-name="h-[18px] w-[18px] text-[#A9AFBA]"
                />
                <div class="grid gap-1">
                    <span class="text-sm font-bold text-[#F5F7FA]">
                        {{ track.title }}
                    </span>
                    <span class="font-['Geist'] text-[10px] text-[#6F7784]">
                        {{ track.meta }}
                    </span>
                </div>
            </div>

            <div
                ref="scrollContainerRef"
                data-timeline-scroll-container="true"
                class="col-start-2 row-start-1 row-span-5 min-w-0 cursor-crosshair overflow-x-auto overflow-y-hidden"
                @click="handleTimelineClick"
                @pointerleave="handleTimelinePointerLeave"
                @pointermove="handleTimelinePointerMove"
                @scroll="handleTimelineScroll"
            >
                <div
                    :class="[
                        'grid h-full',
                        timelineData.layout.contentRowsClassName,
                        timelineData.layout.contentMinWidthClassName
                    ]"
                    :style="timelineContentStyle"
                >
                    <div
                        class="relative row-start-1 flex h-full border-b border-[#2A2F38] bg-[#121418]"
                    >
                        <div
                            v-for="(tick, index) in timelineData.ticks"
                            :key="tick"
                            :class="[
                                'relative border-l border-[#313741]',
                                timelineData.layout.tickWidthClassName,
                                index === 0 ? 'border-l-0' : ''
                            ]"
                            :style="tickStyle"
                        >
                            <span
                                class="absolute top-2 left-2 font-['Geist_Mono'] text-[10px] text-[#6F7784]"
                            >
                                {{ tick }}
                            </span>
                        </div>
                    </div>

                    <div
                        v-for="{ track, rowClassName } in trackRows"
                        :key="`${track.id}-content`"
                        :data-timeline-track="track.id"
                        :class="[
                            'min-h-0 border-b border-[#2A2F38]',
                            rowClassName,
                            trackContentClassNames[track.id]
                        ]"
                    >
                        <div class="flex h-full items-center gap-0">
                            <div
                                v-for="clip in timelineData.clipsByTrack[
                                    track.id
                                ]"
                                :key="clip.label"
                                :data-timeline-clip-kind="clip.kind"
                                :data-duration-seconds="clip.durationSeconds"
                                :data-width-px="clip.widthPx"
                                :title="clip.caption ?? clip.label"
                                :style="clipStyle(clip)"
                                :class="[
                                    'flex h-[28px] shrink-0 items-center gap-1.5 overflow-hidden rounded-md border px-2',
                                    clip.colorClassName,
                                    clipTextClassNames[clip.kind]
                                ]"
                            >
                                <span
                                    v-if="clip.kind === 'video'"
                                    class="h-3 w-0.5 shrink-0 rounded-full bg-white/70"
                                />
                                <IconGlyph
                                    v-if="clip.kind === 'subtitle'"
                                    name="captions"
                                    class-name="h-3 w-3 shrink-0 text-[#F6B84B]"
                                />
                                <IconGlyph
                                    v-if="clip.kind === 'music'"
                                    name="music"
                                    class-name="h-3 w-3 shrink-0 text-[#8EA2FF]"
                                />
                                <span class="truncate">{{ clip.label }}</span>
                                <WaveformBars
                                    v-if="clip.bars"
                                    :bars="clip.bars"
                                    size="compact"
                                />
                                <div
                                    v-if="clip.showThumbnails"
                                    class="ml-auto flex gap-[2px]"
                                    aria-hidden="true"
                                >
                                    <span
                                        v-for="index in decorativeThumbnailIndexes"
                                        :key="index"
                                        :class="[
                                            'h-2 w-2 rounded',
                                            index % 2 === 0
                                                ? 'bg-white/15'
                                                : 'bg-black/20'
                                        ]"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div
            :style="playheadStyle"
            :data-playhead-progress="timelineData.playhead.progress"
            :data-playhead-scroll-left="scrollLeftPx"
            class="absolute top-[35px] h-[237px] w-5 will-change-transform"
        >
            <span
                class="absolute top-0 left-[3px] h-[14px] w-[14px] rounded-full border-[3px] border-[#06372F] bg-[#F05F73]"
            />
            <span
                class="absolute top-[7px] left-[9px] h-[230px] w-0.5 bg-[#F05F73]"
            />
        </div>
        <div
            v-if="hoverPlayheadTimeMs !== undefined"
            :style="hoverPlayheadStyle"
            :data-hover-time-ms="hoverPlayheadTimeMs"
            data-timeline-hover-playhead="true"
            class="pointer-events-none absolute top-[35px] h-[237px] w-5 will-change-transform"
        >
            <span
                class="absolute top-[-28px] left-1/2 -translate-x-1/2 rounded-md border border-[#F6B84B]/50 bg-[#1B1710] px-1.5 py-0.5 font-['Geist_Mono'] text-[10px] font-bold text-[#F6B84B] shadow-[0_8px_18px_rgba(0,0,0,0.32)]"
            >
                {{ hoverPlayheadLabel }}
            </span>
            <span
                class="absolute top-0 left-[6px] h-[14px] w-[8px] rounded-full bg-[#F6B84B]"
            />
            <span
                class="absolute top-[7px] left-[9px] h-[230px] w-0.5 bg-[#F6B84B]/80"
            />
        </div>
    </section>
</template>
