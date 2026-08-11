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
        isRegeneratingScene?: boolean;
        isRegeneratingVoices?: boolean;
        mode?: ConfigMode;
        selectedScene?: ConfigPanelContext['selectedScene'];
        subtitleSettings?: ConfigPanelContext['subtitleSettings'];
        voicePreviewStopSignal?: number;
        voiceSettings?: ConfigPanelContext['voiceSettings'];
    }>(),
    {
        mode: editorConfigMode
    }
);
const emit = defineEmits<{
    clearSelectedScene: [];
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
    subtitleSettingsChange: [
        settings: NonNullable<ConfigPanelContext['subtitleSettings']>
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

const activePanelProps = computed(() =>
    props.mode === 'visual' ||
    props.mode === 'voice' ||
    props.mode === 'subtitle'
        ? {
              context: {
                  conversation: props.conversation,
                  isRegeneratingScene: props.isRegeneratingScene,
                  isRegeneratingVoices: props.isRegeneratingVoices,
                  onClearSelectedScene: () => emit('clearSelectedScene'),
                  onRegenerateScene: (input) => emit('regenerateScene', input),
                  onRegenerateVoices: (input) =>
                      emit('regenerateVoices', input),
                  onSubtitleSettingsChange: (settings) =>
                      emit('subtitleSettingsChange', settings),
                  onVoiceSettingsChange: (settings) =>
                      emit('voiceSettingsChange', settings),
                  selectedScene: props.selectedScene,
                  subtitleSettings: props.subtitleSettings,
                  voicePreviewStopSignal: props.voicePreviewStopSignal,
                  voiceSettings: props.voiceSettings
              } satisfies ConfigPanelContext
          }
        : {}
);
</script>

<template>
    <component :is="activePanel" v-bind="activePanelProps" />
</template>
