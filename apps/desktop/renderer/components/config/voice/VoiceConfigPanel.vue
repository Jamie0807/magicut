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

const createVoiceSelectionKey = (
    card: Pick<VoicePresetCard, 'title' | 'voiceType'>
) => card.voiceType || card.title;

const localSelectedVoiceKey = shallowRef(
    createVoiceSelectionKey(
        voiceConfigPanel.presets[0] ?? { title: '', voiceType: '' }
    )
);
const previewAudioRef = useTemplateRef<HTMLAudioElement>('previewAudioRef');

const voiceSettings = computed(() =>
    normalizeVideoAgentVoiceSettings(
        props.context?.voiceSettings ?? defaultVideoAgentVoiceSettings
    )
);

const customVoiceCards = computed<VoicePresetCard[]>(() =>
    (props.context?.customVoices ?? []).map((voice) => ({
        actionIcon: 'play',
        description: '自定义',
        previewAudioUrl: voice.previewAudioUrl ?? '',
        selected: false,
        title: voice.title,
        voiceType: voice.voiceType
    }))
);

const selectedVoiceKey = computed(
    () =>
        props.context?.selectedVoice?.voiceType ??
        props.context?.selectedVoice?.title ??
        localSelectedVoiceKey.value
);

const presets = computed(() =>
    [...voiceConfigPanel.presets, ...customVoiceCards.value].map((preset) => ({
        ...preset,
        selected: createVoiceSelectionKey(preset) === selectedVoiceKey.value
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
        ? '取消生成口播'
        : voiceConfigPanel.actionLabel
);

const customVoiceStatusLabel = computed(() => {
    if (props.context?.isUploadingCustomVoice) {
        return '正在导入原始音色音频';
    }

    if (props.context?.customVoiceStatus?.available) {
        return '本地 IndexTTS2 已就绪，上传后可用于生成口播';
    }

    if (props.context?.customVoiceStatus) {
        return '启动本地 IndexTTS2 后可上传自定义音色';
    }

    return '正在检测本地 IndexTTS2 服务';
});

const voiceRegenerationProgressLabel = computed(() => {
    const progress = props.context?.voiceRegenerationProgress;

    if (!progress) return '0%';

    return `${progress.current}/${progress.total} · ${progress.percent}%`;
});

const stopPreviewAudio = () => {
    const audio = previewAudioRef.value;

    if (!audio) return;

    audio.pause();
    audio.currentTime = 0;
};

const handleSelect = (card: VoicePresetCard) => {
    localSelectedVoiceKey.value = createVoiceSelectionKey(card);
    props.context?.onVoiceSelectionChange?.({
        title: card.title,
        voiceType: card.voiceType
    });
};

const handlePreview = async (card: VoicePresetCard) => {
    handleSelect(card);
    const audio = previewAudioRef.value;

    if (!audio || !card.previewAudioUrl) return;

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
    if (props.context?.isRegeneratingVoices) {
        void props.context.onCancelRegenerateVoices?.();
        return;
    }

    const preset = selectedPreset.value;

    if (!preset) return;

    props.context?.onRegenerateVoices?.({
        selectedVoice: preset.title,
        selectedVoiceType: selectedPresetVoiceType.value
    });
};

const handleImportCustomVoice = () => {
    void props.context?.onImportCustomVoice?.();
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
                        <ConfigUploadCard
                            :card="voiceConfigPanel.uploadCard"
                            :disabled="context?.isUploadingCustomVoice"
                            :status-label="customVoiceStatusLabel"
                            @click="handleImportCustomVoice"
                        />
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
            <div
                v-if="context?.isRegeneratingVoices"
                data-voice-regeneration-progress="true"
                class="mb-2 grid gap-1.5"
            >
                <div
                    class="flex items-center justify-between text-[11px] font-semibold text-[#B8C0CC]"
                >
                    <span>正在生成口播音轨</span>
                    <span>{{ voiceRegenerationProgressLabel }}</span>
                </div>
                <div class="h-1.5 overflow-hidden rounded-full bg-[#252932]">
                    <div
                        class="h-full rounded-full bg-[#F05F73] transition-[width] duration-300 ease-out"
                        :style="{
                            width: `${context?.voiceRegenerationProgress?.percent ?? 0}%`
                        }"
                    />
                </div>
            </div>
            <ConfigPrimaryButton
                :label="actionLabel"
                icon="mic"
                @click="handleRegenerateVoices"
            />
        </template>
    </ConfigPanelShell>
</template>
