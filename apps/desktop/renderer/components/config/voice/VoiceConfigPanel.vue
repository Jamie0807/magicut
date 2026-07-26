<script setup lang="ts">
import { voiceConfigPanel } from '../../../constants/config';

import ConfigHeader from '../shared/ConfigHeader.vue';
import ConfigPanelShell from '../shared/ConfigPanelShell.vue';
import ConfigPrimaryButton from '../shared/ConfigPrimaryButton.vue';
import ConfigSectionShell from '../shared/ConfigSectionShell.vue';
import ConfigSelectableCard from '../shared/ConfigSelectableCard.vue';
import ConfigSliderRow from '../shared/ConfigSliderRow.vue';
import ConfigUploadCard from '../shared/ConfigUploadCard.vue';
</script>

<template>
    <ConfigPanelShell
        class-name="w-[320px]"
        content-class-name="flex min-h-0 flex-col"
        footer-class-name="border-t border-[#252932] bg-[#111214] px-[16px] pt-[12px] pb-[16px]"
    >
        <div class="flex h-full min-h-0 min-w-0 flex-col px-[16px] pt-[16px]">
            <ConfigHeader
                :title="voiceConfigPanel.header.title"
                :subtitle="voiceConfigPanel.header.subtitle"
                title-class-name="text-[20px] leading-none font-[800]"
                subtitle-class-name="text-[11px] leading-none font-semibold text-[#6F7784]"
                class-name="text-left"
            />

            <div class="min-h-0 flex-1 overflow-y-auto pr-1 pb-3">
                <ConfigSectionShell class-name="mt-[14px]">
                    <ConfigHeader
                        :title="voiceConfigPanel.section.title"
                        :subtitle="voiceConfigPanel.section.subtitle"
                        class-name="text-left"
                    />
                    <div class="mt-[13px] grid grid-cols-2 gap-2">
                        <ConfigSelectableCard
                            v-for="card in voiceConfigPanel.presets"
                            :key="card.title"
                            :card="card"
                        />
                    </div>
                    <div class="mt-[10px]">
                        <ConfigUploadCard :card="voiceConfigPanel.uploadCard" />
                    </div>
                </ConfigSectionShell>

                <ConfigSectionShell class-name="mt-[12px]">
                    <ConfigHeader
                        title="参数调整"
                        class-name="text-left"
                        title-class-name="text-[14px] leading-none font-[800]"
                    />
                    <div class="mt-[18px] grid gap-4">
                        <ConfigSliderRow
                            v-for="slider in voiceConfigPanel.sliders"
                            :key="slider.label"
                            :slider="slider"
                        />
                    </div>
                </ConfigSectionShell>
            </div>
        </div>

        <template #footer>
            <ConfigPrimaryButton
                :label="voiceConfigPanel.actionLabel"
                icon="mic"
            />
        </template>
    </ConfigPanelShell>
</template>
