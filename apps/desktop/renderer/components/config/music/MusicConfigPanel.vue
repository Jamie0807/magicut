<script setup lang="ts">
import { musicConfigPanel } from '../../../constants/config';

import ConfigHeader from '../shared/ConfigHeader.vue';
import ConfigPanelShell from '../shared/ConfigPanelShell.vue';
import ConfigSectionShell from '../shared/ConfigSectionShell.vue';
import ConfigSliderRow from '../shared/ConfigSliderRow.vue';
import ConfigToggleRow from '../shared/ConfigToggleRow.vue';
import MusicCategoryChip from './MusicCategoryChip.vue';
import MusicCover from './MusicCover.vue';
import MusicTrackRow from './MusicTrackRow.vue';
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
                    :enabled="musicConfigPanel.header.toggleEnabled"
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
                                :src="musicConfigPanel.current.coverImageUrl"
                                :alt="musicConfigPanel.current.trackTitle"
                            />
                            <div class="min-w-0 flex-1">
                                <div
                                    class="truncate text-[17px] font-[850] text-[#F5F7FA]"
                                >
                                    {{ musicConfigPanel.current.trackTitle }}
                                </div>
                                <div
                                    class="mt-1 truncate text-[11px] font-semibold text-[#A9AFBA]"
                                >
                                    {{ musicConfigPanel.current.artistLine }}
                                </div>
                                <div
                                    class="mt-1 truncate font-['Geist_Mono'] text-[10px] font-[700] text-[#6F7784]"
                                >
                                    {{ musicConfigPanel.current.metaLine }}
                                </div>
                            </div>
                        </div>
                    </ConfigSectionShell>

                    <ConfigSectionShell class-name="p-[12px_14px]">
                        <ConfigSliderRow :slider="musicConfigPanel.volume" />
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
                                        v-for="category in musicConfigPanel
                                            .recommendations.categories"
                                        :key="category.label"
                                        :category="category"
                                    />
                                </div>
                            </div>
                        </div>

                        <div class="mt-[10px] grid gap-2">
                            <MusicTrackRow
                                v-for="track in musicConfigPanel.recommendations
                                    .tracks"
                                :key="track.title"
                                :track="track"
                            />
                        </div>
                    </ConfigSectionShell>
                </div>
            </div>
        </div>
    </ConfigPanelShell>
</template>
