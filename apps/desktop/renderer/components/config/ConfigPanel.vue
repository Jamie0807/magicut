<script setup lang="ts">
import { computed } from 'vue';
import type { Component } from 'vue';

import { editorConfigMode } from '../../constants/config';
import type { ConfigMode, ConfigPanelContext } from '../../types/config';

import MusicConfigPanel from './music/MusicConfigPanel.vue';
import SubtitleConfigPanel from './subtitle/SubtitleConfigPanel.vue';
import VisualConfigPanel from './visual/VisualConfigPanel.vue';
import VoiceConfigPanel from './voice/VoiceConfigPanel.vue';

const props = withDefaults(
    defineProps<{
        conversation?: ConfigPanelContext['conversation'];
        customVoiceStatus?: ConfigPanelContext['customVoiceStatus'];
        customVoices?: ConfigPanelContext['customVoices'];
        isRegeneratingScene?: boolean;
        isRegeneratingVoices?: boolean;
        isUploadingCustomVoice?: boolean;
        mode?: ConfigMode;
        musicSettings?: ConfigPanelContext['musicSettings'];
        selectedScene?: ConfigPanelContext['selectedScene'];
        selectedVoice?: ConfigPanelContext['selectedVoice'];
        subtitleSettings?: ConfigPanelContext['subtitleSettings'];
        voicePreviewStopSignal?: number;
        voiceRegenerationProgress?: ConfigPanelContext['voiceRegenerationProgress'];
        voiceSettings?: ConfigPanelContext['voiceSettings'];
    }>(),
    {
        mode: editorConfigMode
    }
);
const emit = defineEmits<{
    clearSelectedScene: [];
    cancelRegenerateVoices: [];
    importCustomVoice: [];
    regenerateScene: [
        input: {
            prompt: string;
            sceneId: string;
        }
    ];
    regenerateVoices: [
        input: {
            selectedVoice: string;
            selectedVoiceType?: string;
        }
    ];
    musicSettingsChange: [
        settings: NonNullable<ConfigPanelContext['musicSettings']>
    ];
    subtitleSettingsChange: [
        settings: NonNullable<ConfigPanelContext['subtitleSettings']>
    ];
    voiceSelectionChange: [
        selection: NonNullable<ConfigPanelContext['selectedVoice']>
    ];
    voiceSettingsChange: [
        settings: NonNullable<ConfigPanelContext['voiceSettings']>
    ];
}>();

const panelStrategies = {
    visual: VisualConfigPanel,
    voice: VoiceConfigPanel,
    subtitle: SubtitleConfigPanel,
    music: MusicConfigPanel
} satisfies Record<ConfigMode, Component>;

const activePanel = computed(() => panelStrategies[props.mode]);

const activePanelProps = computed(() => ({
    context: {
        conversation: props.conversation,
        customVoiceStatus: props.customVoiceStatus,
        customVoices: props.customVoices,
        isRegeneratingScene: props.isRegeneratingScene,
        isRegeneratingVoices: props.isRegeneratingVoices,
        isUploadingCustomVoice: props.isUploadingCustomVoice,
        musicSettings: props.musicSettings,
        onCancelRegenerateVoices: () => emit('cancelRegenerateVoices'),
        onClearSelectedScene: () => emit('clearSelectedScene'),
        onImportCustomVoice: () => emit('importCustomVoice'),
        onMusicSettingsChange: (settings) =>
            emit('musicSettingsChange', settings),
        onRegenerateScene: (input) => emit('regenerateScene', input),
        onRegenerateVoices: (input) => emit('regenerateVoices', input),
        onSubtitleSettingsChange: (settings) =>
            emit('subtitleSettingsChange', settings),
        onVoiceSelectionChange: (selection) =>
            emit('voiceSelectionChange', selection),
        onVoiceSettingsChange: (settings) =>
            emit('voiceSettingsChange', settings),
        selectedScene: props.selectedScene,
        selectedVoice: props.selectedVoice,
        subtitleSettings: props.subtitleSettings,
        voicePreviewStopSignal: props.voicePreviewStopSignal,
        voiceRegenerationProgress: props.voiceRegenerationProgress,
        voiceSettings: props.voiceSettings
    } satisfies ConfigPanelContext
}));
</script>

<template>
    <component :is="activePanel" v-bind="activePanelProps" />
</template>
