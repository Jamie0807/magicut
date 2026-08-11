<script setup lang="ts">
import { computed, onUnmounted, shallowRef, useTemplateRef, watch } from 'vue';

import {
    defaultVideoAgentVoiceSettings,
    normalizeVideoAgentVoiceSettings
} from '../../../../shared/video-agent-voices';
import { voiceConfigPanel } from '../../../constants/config';
import type {
    ConfigPanelContext,
    VoicePresetCard,
    VoiceSlider
} from '../../../types/config';

import ConfigHeader from '../shared/ConfigHeader.vue';
import ConfigPanelShell from '../shared/ConfigPanelShell.vue';
import ConfigPrimaryButton from '../shared/ConfigPrimaryButton.vue';
import ConfigSectionShell from '../shared/ConfigSectionShell.vue';
import ConfigSelectableCard from '../shared/ConfigSelectableCard.vue';
import ConfigSliderRow from '../shared/ConfigSliderRow.vue';
import ConfigUploadCard from '../shared/ConfigUploadCard.vue';

const props = defineProps<{
    context?: ConfigPanelContext;
}>();

const selectedVoiceTitle = shallowRef(voiceConfigPanel.presets[0]?.title ?? '');
const previewAudioRef = useTemplateRef<HTMLAudioElement>('previewAudioRef');

const voiceSettings = computed(() =>
    normalizeVideoAgentVoiceSettings(
        props.context?.voiceSettings ?? defaultVideoAgentVoiceSettings
    )
);

const presets = computed(() =>
    voiceConfigPanel.presets.map((preset) => ({
        ...preset,
        selected: preset.title === selectedVoiceTitle.value
    }))
);

const selectedPreset = computed(
    () =>
        presets.value.find((preset) => preset.selected) ??
        voiceConfigPanel.presets[0]
);
const readSelectedPresetVoiceType = (selectedPreset: VoicePresetCard) =>
    selectedPreset.voiceType;
const selectedPresetVoiceType = computed(() =>
    readSelectedPresetVoiceType(selectedPreset.value)
);

const sliders = computed<VoiceSlider[]>(() =>
    voiceConfigPanel.sliders.map((slider) => {
        if (slider.label === '音量') {
            const value = Math.round(voiceSettings.value.voiceVolume * 100);

            return {
                ...slider,
                numericValue: value,
                value: `${value}%`
            };
        }

        if (slider.label === '语速') {
            return {
                ...slider,
                numericValue: voiceSettings.value.voiceSpeed,
                value: `${voiceSettings.value.voiceSpeed.toFixed(2)}x`
            };
        }

        return slider;
    })
);

const actionLabel = computed(() =>
    props.context?.isRegeneratingVoices
        ? '正在生成口播音轨'
        : voiceConfigPanel.actionLabel
);

const stopPreviewAudio = () => {
    const audio = previewAudioRef.value;

    if (!audio) return;

    audio.pause();
    audio.currentTime = 0;
};

const handleSelect = (card: VoicePresetCard) => {
    selectedVoiceTitle.value = card.title;
};

const handlePreview = async (card: VoicePresetCard) => {
    selectedVoiceTitle.value = card.title;
    const audio = previewAudioRef.value;

    if (!audio) return;

    if (audio.src !== card.previewAudioUrl) {
        audio.src = card.previewAudioUrl;
    }

    audio.volume = voiceSettings.value.voiceVolume;
    audio.playbackRate = voiceSettings.value.voiceSpeed;
    audio.currentTime = 0;

    await audio.play().catch((): void => undefined);
};

const handleSliderChange = (slider: VoiceSlider, value: number) => {
    if (slider.label === '音量') {
        props.context?.onVoiceSettingsChange?.({
            ...voiceSettings.value,
            voiceVolume: value / 100
        });
        return;
    }

    if (slider.label === '语速') {
        props.context?.onVoiceSettingsChange?.({
            ...voiceSettings.value,
            voiceSpeed: value
        });
    }
};

const handleRegenerateVoices = () => {
    const preset = selectedPreset.value;

    props.context?.onRegenerateVoices?.({
        selectedVoice: preset.title,
        selectedVoiceType: selectedPresetVoiceType.value
    });
};

watch(
    () => (props.context ? props.context.voicePreviewStopSignal : undefined),
    () => {
        stopPreviewAudio();
    }
);

watch(voiceSettings, (settings) => {
    const audio = previewAudioRef.value;

    if (!audio) return;

    audio.volume = settings.voiceVolume;
    audio.playbackRate = settings.voiceSpeed;
});

onUnmounted(() => {
    stopPreviewAudio();
});
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
                            v-for="card in presets"
                            :key="card.title"
                            :card="card"
                            @preview="handlePreview"
                            @select="handleSelect"
                        />
                    </div>
                    <audio
                        ref="previewAudioRef"
                        data-voice-preview-audio="true"
                        :src="selectedPreset.previewAudioUrl"
                    />
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
                            v-for="slider in sliders"
                            :key="slider.label"
                            :slider="slider"
                            @value-change="handleSliderChange(slider, $event)"
                        />
                    </div>
                </ConfigSectionShell>
            </div>
        </div>

        <template #footer>
            <ConfigPrimaryButton
                :disabled="context?.isRegeneratingVoices"
                :label="actionLabel"
                icon="mic"
                @click="handleRegenerateVoices"
            />
        </template>
    </ConfigPanelShell>
</template>
