<script setup lang="ts">
import { computed, shallowRef } from 'vue';

import {
    defaultMusicSettings,
    musicConfigPanel,
    musicLibraryTracks
} from '../../../constants/config';
import type { ConfigPanelContext, MusicTrack } from '../../../types/config';

import ConfigHeader from '../shared/ConfigHeader.vue';
import ConfigPanelShell from '../shared/ConfigPanelShell.vue';
import ConfigSectionShell from '../shared/ConfigSectionShell.vue';
import ConfigSliderRow from '../shared/ConfigSliderRow.vue';
import ConfigToggleRow from '../shared/ConfigToggleRow.vue';
import MusicCategoryChip from './MusicCategoryChip.vue';
import MusicCover from './MusicCover.vue';
import MusicTrackRow from './MusicTrackRow.vue';

const props = defineProps<{
    context?: ConfigPanelContext;
}>();

const selectedCategory = shallowRef('全部');
const musicSettings = computed(
    () => props.context?.musicSettings ?? defaultMusicSettings
);
const selectedTrack = computed(
    () =>
        musicLibraryTracks.find(
            (track) => track.id === musicSettings.value.selectedTrackId
        ) ??
        musicLibraryTracks[0] ??
        musicConfigPanel.recommendations.tracks[0]
);
const filteredTracks = computed(() =>
    selectedCategory.value === '全部' || selectedCategory.value === '更多'
        ? musicConfigPanel.recommendations.tracks
        : musicConfigPanel.recommendations.tracks.filter(
              (track) => track.mood === selectedCategory.value
          )
);
const categoryItems = computed(() =>
    musicConfigPanel.recommendations.categories.map((category) => ({
        ...category,
        active: category.label === selectedCategory.value
    }))
);
const visibleTracks = computed(() =>
    filteredTracks.value.map((track) => ({
        ...track,
        active: track.id === musicSettings.value.selectedTrackId,
        statusLabel:
            track.id === musicSettings.value.selectedTrackId
                ? '使用中'
                : undefined
    }))
);
const volumePercent = computed(() =>
    Math.round(musicSettings.value.volume * 100)
);
const volumeSlider = computed(() => ({
    ...musicConfigPanel.volume,
    numericValue: volumePercent.value,
    value: `${volumePercent.value}%`
}));

const updateMusicSettings = (settings: Partial<typeof musicSettings.value>) => {
    props.context?.onMusicSettingsChange?.({
        ...musicSettings.value,
        ...settings
    });
};

const handleTrackSelect = (track: MusicTrack) => {
    updateMusicSettings({
        enabled: true,
        selectedTrackId: track.id
    });
};
</script>

<template>
    <ConfigPanelShell
        class-name="w-[320px]"
        content-class-name="flex min-h-0 flex-col"
    >
        <div class="flex h-full min-h-0 min-w-0 flex-col p-[16px]">
            <div class="flex items-center justify-between gap-4">
                <ConfigHeader
                    :title="musicConfigPanel.header.title"
                    :subtitle="musicConfigPanel.header.subtitle"
                    title-class-name="text-[20px] leading-none font-[850]"
                    subtitle-class-name="text-[11px] leading-none font-semibold text-[#6F7784]"
                    class-name="text-left"
                />
                <ConfigToggleRow
                    :label="musicConfigPanel.header.toggleLabel"
                    :enabled="musicSettings.enabled"
                    @toggle="
                        updateMusicSettings({
                            enabled: !musicSettings.enabled
                        })
                    "
                />
            </div>

            <div class="min-h-0 flex-1 overflow-y-auto pb-3">
                <div class="mt-[14px] flex flex-col gap-[12px]">
                    <ConfigSectionShell class-name="p-[12px_14px]">
                        <div class="flex items-center justify-between">
                            <ConfigHeader
                                :title="musicConfigPanel.current.sectionTitle"
                                class-name="text-left"
                                title-class-name="text-[14px] leading-none font-[800]"
                            />
                        </div>
                        <div class="mt-[12px] flex items-center gap-3">
                            <MusicCover
                                :src="selectedTrack.coverImageUrl"
                                :alt="selectedTrack.title"
                            />
                            <div class="min-w-0 flex-1">
                                <div
                                    class="truncate text-[17px] font-[850] text-[#F5F7FA]"
                                >
                                    {{ selectedTrack.title }}
                                </div>
                                <div
                                    class="mt-1 truncate text-[11px] font-semibold text-[#A9AFBA]"
                                >
                                    {{ musicConfigPanel.current.artistLine }}
                                </div>
                                <div
                                    class="mt-1 truncate font-['Geist_Mono'] text-[10px] font-[700] text-[#6F7784]"
                                >
                                    {{
                                        `${selectedTrack.tempo} · ${selectedTrack.durationLabel} · 已对齐时间线`
                                    }}
                                </div>
                            </div>
                        </div>
                    </ConfigSectionShell>

                    <ConfigSectionShell class-name="p-[12px_14px]">
                        <ConfigSliderRow
                            :slider="volumeSlider"
                            @value-change="
                                (value) =>
                                    updateMusicSettings({
                                        volume: value / 100
                                    })
                            "
                        />
                    </ConfigSectionShell>

                    <ConfigSectionShell class-name="p-[12px_14px]">
                        <ConfigHeader
                            :title="musicConfigPanel.recommendations.title"
                            class-name="text-left"
                            title-class-name="text-[14px] leading-none font-[800]"
                        />

                        <div class="mt-[12px] min-w-0">
                            <div class="w-full min-w-0 overflow-x-auto">
                                <div
                                    class="flex w-max min-w-full flex-nowrap gap-1 py-2"
                                >
                                    <MusicCategoryChip
                                        v-for="category in categoryItems"
                                        :key="category.label"
                                        :category="category"
                                        @select="
                                            (label) =>
                                                (selectedCategory = label)
                                        "
                                    />
                                </div>
                            </div>
                        </div>

                        <div class="mt-[10px] grid gap-2">
                            <MusicTrackRow
                                v-for="track in visibleTracks"
                                :key="track.id"
                                :track="track"
                                @select="handleTrackSelect"
                            />
                        </div>
                    </ConfigSectionShell>
                </div>
            </div>
        </div>
    </ConfigPanelShell>
</template>
