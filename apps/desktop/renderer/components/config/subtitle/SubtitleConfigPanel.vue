<script setup lang="ts">
import { subtitleConfigPanel } from '../../../constants/config';

import ConfigHeader from '../shared/ConfigHeader.vue';
import ConfigPanelShell from '../shared/ConfigPanelShell.vue';
import ConfigPresetSwatch from '../shared/ConfigPresetSwatch.vue';
import ConfigSectionShell from '../shared/ConfigSectionShell.vue';
import ConfigSliderRow from '../shared/ConfigSliderRow.vue';
import ConfigToggleRow from '../shared/ConfigToggleRow.vue';
</script>

<template>
    <ConfigPanelShell class-name="w-[320px]" content-class-name="p-[16px]">
        <div class="flex h-full min-h-0 flex-col gap-[14px]">
            <div class="flex items-center justify-between">
                <ConfigHeader
                    :title="subtitleConfigPanel.header.title"
                    :subtitle="subtitleConfigPanel.header.subtitle"
                    title-class-name="text-[20px] leading-none font-[850]"
                    subtitle-class-name="text-[11px] leading-none font-semibold text-[#6F7784]"
                    class-name="text-left"
                />
                <ConfigToggleRow
                    :label="subtitleConfigPanel.visibility.label"
                    :enabled="subtitleConfigPanel.visibility.enabled"
                />
            </div>

            <ConfigSectionShell class-name="p-[12px_14px]">
                <ConfigSliderRow :slider="subtitleConfigPanel.size" />
            </ConfigSectionShell>

            <ConfigSectionShell class-name="p-[12px_14px]">
                <div class="grid gap-3">
                    <span class="text-[14px] font-[800] text-[#F5F7FA]">
                        {{ subtitleConfigPanel.style.title }}
                    </span>
                    <div class="grid grid-cols-7 gap-1.5">
                        <ConfigPresetSwatch
                            v-for="preset in subtitleConfigPanel.style.presets"
                            :key="preset.label"
                            v-bind="preset"
                        />
                    </div>

                    <div class="flex items-center justify-between">
                        <span class="text-[12px] font-[750] text-[#F5F7FA]">
                            {{ subtitleConfigPanel.style.activePresetLabel }}
                        </span>
                        <span class="text-[11px] font-semibold text-[#6F7784]">
                            {{ subtitleConfigPanel.style.subtitle }}
                        </span>
                    </div>
                </div>
            </ConfigSectionShell>
        </div>
    </ConfigPanelShell>
</template>
