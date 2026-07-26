<script setup lang="ts">
import { computed } from 'vue';

import {
    timelineAudioClips,
    timelineHistoryActions,
    timelineLayout,
    timelinePanel,
    timelineTicks,
    timelineToolActions,
    timelineTracks,
    timelineVideoClips
} from '../../constants/editor-screen';
import type {
    TimelineAudioClip,
    TimelineToolAction,
    TimelineTrack
} from '../../types/editor-screen';

import IconButton from './IconButton.vue';
import IconGlyph from './IconGlyph.vue';
import WaveformBars from './WaveformBars.vue';

const trackToneClassNames: Record<TimelineTrack['tone'], string> = {
    primary: 'bg-[#111318]',
    muted: 'bg-[#0E1014]'
};

const audioToneClassNames: Record<TimelineAudioClip['tone'], string> = {
    voice: 'bg-[#245A34] border-white/10 justify-start px-3',
    pause: 'bg-[#2C3038] border-white/10 justify-center'
};

const timelineToolButtonVariant: Record<
    TimelineToolAction['tone'],
    'timeline' | 'timelineActive'
> = {
    default: 'timeline',
    active: 'timelineActive'
};

const decorativeThumbnailIndexes = [0, 1, 2, 3];

const trackRows = computed(() =>
    timelineTracks.map((track, index) => ({
        track,
        rowClassName:
            index === 0
                ? 'row-start-2'
                : index === 1
                  ? 'row-start-3'
                  : 'row-start-4'
    }))
);
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
                'flex h-[52px] w-full items-center justify-between border-b border-[#2A2F38] bg-[#15171B] px-3 py-[10px]',
                timelineLayout.titleBarHeightClassName
            ]"
        >
            <div class="flex items-center gap-4">
                <h2 class="text-lg font-extrabold">
                    {{ timelinePanel.title }}
                </h2>
                <span
                    class="font-['Geist_Mono'] text-sm font-semibold text-[#A9AFBA]"
                >
                    {{ timelinePanel.timecode }}
                </span>
            </div>
            <div class="flex items-center gap-2.5">
                <div
                    class="flex h-8 w-[76px] items-center gap-2.5 overflow-hidden"
                >
                    <IconButton
                        v-for="action in timelineHistoryActions"
                        :key="action.label"
                        :label="action.label"
                        :icon="action.icon"
                        variant="history"
                        icon-class-name="h-4 w-4"
                    />
                </div>
                <IconButton
                    v-for="action in timelineToolActions"
                    :key="action.label"
                    :label="action.label"
                    :icon="action.icon"
                    :variant="timelineToolButtonVariant[action.tone]"
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
                :class="[
                    'relative col-start-2 row-start-1 flex h-full border-b border-[#2A2F38] bg-[#121418]',
                    timelineLayout.contentMinWidthClassName
                ]"
            >
                <div
                    v-for="(tick, index) in timelineTicks"
                    :key="tick"
                    :class="[
                        'relative w-[150px] border-l border-[#313741]',
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
                :key="track.title"
                :class="[
                    'col-start-1 row-span-1 flex h-full items-center gap-3 border-r border-b border-[#2A2F38] px-[18px]',
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
                :class="[
                    'col-start-2 row-start-2 min-h-0 border-b border-[#2A2F38] bg-[#15171B]',
                    timelineLayout.contentMinWidthClassName
                ]"
            >
                <div class="flex h-full items-center gap-[15px] px-3">
                    <div
                        v-for="clip in timelineVideoClips"
                        :key="clip.label"
                        :class="[
                            'flex h-7 items-center gap-2 rounded-md border px-3',
                            clip.widthClassName,
                            clip.colorClassName
                        ]"
                    >
                        <span class="h-4 w-1 rounded-full bg-white/70" />
                        <span class="text-sm font-extrabold text-[#F5F7FA]">
                            {{ clip.label }}
                        </span>
                        <div class="ml-auto flex gap-[3px]" aria-hidden="true">
                            <span
                                v-for="index in decorativeThumbnailIndexes"
                                :key="index"
                                :class="[
                                    'h-3 w-3 rounded',
                                    index % 2 === 0
                                        ? 'bg-white/15'
                                        : 'bg-black/20'
                                ]"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div
                :class="[
                    'col-start-2 row-start-3 min-h-0 border-b border-[#2A2F38] bg-[#101216]',
                    timelineLayout.contentMinWidthClassName
                ]"
            >
                <div class="flex h-full items-center gap-3 px-3">
                    <div
                        v-for="clip in timelineAudioClips"
                        :key="clip.label"
                        :class="[
                            'flex h-[30px] items-center gap-3 rounded-lg border text-[13px] font-bold text-[#F5F7FA]',
                            clip.widthClassName,
                            audioToneClassNames[clip.tone]
                        ]"
                    >
                        <span>{{ clip.label }}</span>
                        <WaveformBars v-if="clip.bars" :bars="clip.bars" />
                    </div>
                </div>
            </div>

            <div
                :class="[
                    'col-start-2 row-start-4 min-h-0 border-b border-[#2A2F38] bg-[#15171B]',
                    timelineLayout.contentMinWidthClassName
                ]"
            >
                <div class="flex h-full items-center px-3 pt-3">
                    <div
                        class="flex h-7 w-[760px] items-center gap-3 rounded-lg border border-white/10 bg-[#6B471E] px-3"
                    >
                        <IconGlyph
                            name="captions"
                            class-name="h-4 w-4 text-[#F6B84B]"
                        />
                        <span class="text-[13px] font-bold">
                            Whisper 字幕 · 自动断句 · 可逐字微调
                        </span>
                    </div>
                </div>
            </div>
        </div>

        <div class="absolute top-[45px] left-[195px] h-[275px] w-5">
            <span
                class="absolute top-0 left-[3px] h-[14px] w-[14px] rounded-full border-[3px] border-[#06372F] bg-[#F05F73]"
            />
            <span
                class="absolute top-[7px] left-[9px] h-[268px] w-0.5 bg-[#F05F73]"
            />
        </div>
    </section>
</template>
