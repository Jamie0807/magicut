<script setup lang="ts">
import { computed } from 'vue';
import type { Component } from 'vue';

import { editorConfigMode } from '../../constants/config';
import type { ConfigMode } from '../../types/config';

import MusicConfigPanel from './music/MusicConfigPanel.vue';
import SubtitleConfigPanel from './subtitle/SubtitleConfigPanel.vue';
import VisualConfigPanel from './visual/VisualConfigPanel.vue';
import VoiceConfigPanel from './voice/VoiceConfigPanel.vue';

const props = withDefaults(
    defineProps<{
        mode?: ConfigMode;
    }>(),
    {
        mode: editorConfigMode
    }
);

const panelStrategies = {
    visual: VisualConfigPanel,
    voice: VoiceConfigPanel,
    subtitle: SubtitleConfigPanel,
    music: MusicConfigPanel
} satisfies Record<ConfigMode, Component>;

const activePanel = computed(() => panelStrategies[props.mode]);
</script>

<template>
    <component :is="activePanel" />
</template>
