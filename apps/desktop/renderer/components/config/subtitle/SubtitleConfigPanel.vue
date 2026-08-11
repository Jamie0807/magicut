<script setup lang="ts">
import { computed } from 'vue';

import {
    defaultSubtitleSettings,
    subtitleConfigPanel
} from '../../../constants/config';
import type {
    ConfigPanelContext,
    SubtitleSettings
} from '../../../types/config';

import ConfigHeader from '../shared/ConfigHeader.vue';
import ConfigPanelShell from '../shared/ConfigPanelShell.vue';
import ConfigPresetSwatch from '../shared/ConfigPresetSwatch.vue';
import ConfigSectionShell from '../shared/ConfigSectionShell.vue';
import ConfigSliderRow from '../shared/ConfigSliderRow.vue';
import ConfigToggleRow from '../shared/ConfigToggleRow.vue';

const props = defineProps<{
    context?: ConfigPanelContext;
}>();

const formatFontSize = (fontSizePx: number) => `${Math.round(fontSizePx)} px`;

const createSubtitleSettingsFromPreset = ({
    fontSizePx,
    isVisible,
    preset
}: {
    fontSizePx: number;
    isVisible: boolean;
    preset: (typeof subtitleConfigPanel.style.presets)[number];
}): SubtitleSettings => ({
    fontSizePx,
    isVisible,
    outlineColor: preset.outerTextColor,
    presetLabel: preset.label,
    textColor: preset.innerTextColor
});

const fallbackSettings = createSubtitleSettingsFromPreset({
    fontSizePx:
        subtitleConfigPanel.size.numericValue ??
        defaultSubtitleSettings.fontSizePx,
    isVisible: defaultSubtitleSettings.isVisible,
    preset: subtitleConfigPanel.style.presets[0]
});

const settings = computed(
    () => props.context?.subtitleSettings ?? fallbackSettings
);

const activePreset = computed(
    () =>
        subtitleConfigPanel.style.presets.find(
            (preset) => preset.label === settings.value.presetLabel
        ) ?? subtitleConfigPanel.style.presets[0]
);

const presets = computed(() =>
    subtitleConfigPanel.style.presets.map((preset) => ({
        ...preset,
        active: preset.label === activePreset.value.label
    }))
);

const sizeSlider = computed(() => ({
    ...subtitleConfigPanel.size,
    numericValue: settings.value.fontSizePx,
    value: formatFontSize(settings.value.fontSizePx)
}));

const updateSettings = (nextSettings: SubtitleSettings) => {
    props.context?.onSubtitleSettingsChange?.(nextSettings);
};

const handleToggle = () => {
    updateSettings({
        ...settings.value,
        isVisible: !settings.value.isVisible
    });
};

const handleFontSizeChange = (fontSizePx: number) => {
    updateSettings({
        ...settings.value,
        fontSizePx
    });
};

const handlePresetSelect = (
    preset: (typeof subtitleConfigPanel.style.presets)[number]
) => {
    updateSettings(
        createSubtitleSettingsFromPreset({
            fontSizePx: settings.value.fontSizePx,
            isVisible: settings.value.isVisible,
            preset
        })
    );
};
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
                    :enabled="settings.isVisible"
                    @toggle="handleToggle"
                />
            </div>

            <ConfigSectionShell class-name="p-[12px_14px]">
                <ConfigSliderRow
                    :slider="sizeSlider"
                    @value-change="handleFontSizeChange"
                />
            </ConfigSectionShell>

            <ConfigSectionShell class-name="p-[12px_14px]">
                <div class="grid gap-3">
                    <span class="text-[14px] font-[800] text-[#F5F7FA]">
                        {{ subtitleConfigPanel.style.title }}
                    </span>
                    <div class="grid grid-cols-7 gap-1.5">
                        <ConfigPresetSwatch
                            v-for="preset in presets"
                            :key="preset.label"
                            v-bind="preset"
                            @click="handlePresetSelect(preset)"
                        />
                    </div>

                    <div class="flex items-center justify-between">
                        <span class="text-[12px] font-[750] text-[#F5F7FA]">
                            {{ activePreset.label }}
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
