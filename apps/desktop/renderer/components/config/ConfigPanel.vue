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
        mode?: ConfigMode;
        selectedScene?: ConfigPanelContext['selectedScene'];
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
}>();

const panelStrategies = {
    visual: VisualConfigPanel,
    voice: VoiceConfigPanel,
    subtitle: SubtitleConfigPanel,
    music: MusicConfigPanel
} satisfies Record<ConfigMode, Component>;

const activePanel = computed(() => panelStrategies[props.mode]);

const activePanelProps = computed(() =>
    props.mode === 'visual'
        ? {
              context: {
                  conversation: props.conversation,
                  isRegeneratingScene: props.isRegeneratingScene,
                  onClearSelectedScene: () => emit('clearSelectedScene'),
                  onRegenerateScene: (input) => emit('regenerateScene', input),
                  selectedScene: props.selectedScene
              } satisfies ConfigPanelContext
          }
        : {}
);
</script>

<template>
    <component :is="activePanel" v-bind="activePanelProps" />
</template>
