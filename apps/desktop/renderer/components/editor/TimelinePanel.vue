<script setup lang="ts">
import { computed } from 'vue';
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
    TimelineToolAction,
    TimelineTrack,
    TimelineTrackKind
} from '../../types/editor-screen';

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

const trackRows = computed(() =>
    timelineTracks.map((track, index) => ({
        track,
        rowClassName: timelineTrackRowStartClassNames[index] ?? 'row-start-2'
    }))
);

const clipStyle = (clip: TimelineClip): CSSProperties => ({
    width: `${clip.widthPx}px`
});
</script>

<template>
    <section
        :class="[
            'relative flex min-h-0 flex-col overflow-hidden border-t border-[#2A2F38] bg-[#121418]',
            timelineLayout.sectionHeightClassName
        ]"
        aria-label="时间线"
    >
        <div
            :class="[
                'flex h-[42px] w-full items-center justify-between border-b border-[#2A2F38] bg-[#15171B] px-3 py-[6px]',
                timelineLayout.titleBarHeightClassName
            ]"
        >
            <div class="flex items-center gap-4">
                <h2 class="font-sm">
                    {{ timelinePanel.title }}
                </h2>
                <span class="font-['Geist_Mono'] text-xs text-[#A9AFBA]">
                    {{ timelinePanel.timecode }}
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
                timelineLayout.contentGridClassName,
                timelineLayout.contentRowsClassName
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
                class="col-start-2 row-start-1 row-span-5 min-w-0 overflow-x-auto overflow-y-hidden"
            >
                <div
                    :class="[
                        'grid h-full',
                        timelineLayout.contentRowsClassName,
                        timelineLayout.contentMinWidthClassName
                    ]"
                >
                    <div
                        class="relative row-start-1 flex h-full border-b border-[#2A2F38] bg-[#121418]"
                    >
                        <div
                            v-for="(tick, index) in timelineTicks"
                            :key="tick"
                            :class="[
                                'relative border-l border-[#313741]',
                                timelineLayout.tickWidthClassName,
                                index === 0 ? 'border-l-0' : ''
                            ]"
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
                                v-for="clip in timelineClipsByTrack[track.id]"
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

        <div class="absolute top-[35px] left-[191px] h-[237px] w-5">
            <span
                class="absolute top-0 left-[3px] h-[14px] w-[14px] rounded-full border-[3px] border-[#06372F] bg-[#F05F73]"
            />
            <span
                class="absolute top-[7px] left-[9px] h-[230px] w-0.5 bg-[#F05F73]"
            />
        </div>
    </section>
</template>
