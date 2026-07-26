<script setup lang="ts">
import { railModes } from '../../constants/editor-screen';
import type { ConfigMode } from '../../types/config';
import { createConfigModeSelectionHandler } from '../../utils/configModeSelection';

import IconGlyph from './IconGlyph.vue';

const modeToneClassNames: Record<'current' | 'default', string> = {
    current: 'text-[#F05F73]',
    default: 'text-[#6F7784]'
};

const props = defineProps<{
    activeMode: ConfigMode;
}>();

const emit = defineEmits<{
    'mode-change': [mode: ConfigMode];
}>();

const selectMode = createConfigModeSelectionHandler((mode) =>
    emit('mode-change', mode)
);
</script>

<template>
    <nav
        class="flex flex-col items-center gap-4 border-l border-[#2A2F38] bg-[#101216] pt-[18px]"
        aria-label="编辑功能"
    >
        <button
            v-for="item in railModes"
            :key="item.label"
            type="button"
            :data-mode="item.mode"
            :aria-current="item.mode === props.activeMode ? 'page' : undefined"
            :class="[
                'grid h-[52px] w-[52px] cursor-pointer place-items-center rounded-[10px] text-xs font-bold transition-all duration-200 hover:-translate-y-[1px] hover:bg-white/5',
                item.mode === props.activeMode
                    ? modeToneClassNames.current
                    : modeToneClassNames.default
            ]"
            @click="selectMode(item.mode)"
        >
            <IconGlyph :name="item.icon" class-name="h-5 w-5" />
            <span>{{ item.label }}</span>
        </button>
    </nav>
</template>
