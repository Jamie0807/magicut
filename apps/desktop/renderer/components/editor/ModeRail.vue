<script setup lang="ts">
import { railModes } from '../../constants/editor-screen';
import type { RailMode } from '../../types/editor-screen';

import IconGlyph from './IconGlyph.vue';

const modeToneClassNames: Record<RailMode['tone'], string> = {
    current: 'text-[#F05F73]',
    default: 'text-[#6F7784]'
};
</script>

<template>
    <nav
        class="flex flex-col items-center gap-2.5 border-l border-[#2A2F38] bg-[#101216] pt-[18px]"
        aria-label="编辑功能"
    >
        <button
            v-for="item in railModes"
            :key="item.label"
            type="button"
            :aria-current="item.tone === 'current' ? 'page' : undefined"
            :class="[
                'grid w-[52px] place-items-center rounded-[10px] text-xs font-bold',
                item.heightClassName,
                modeToneClassNames[item.tone]
            ]"
        >
            <IconGlyph :name="item.icon" class-name="h-5 w-5" />
            <span>{{ item.label }}</span>
        </button>
    </nav>
</template>
