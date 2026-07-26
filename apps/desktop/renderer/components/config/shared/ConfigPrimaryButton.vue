<script setup lang="ts">
import type { EditorIconName } from '../../../types/editor-screen';

import IconGlyph from '../../editor/IconGlyph.vue';

defineProps<{
    label: string;
    icon: EditorIconName;
}>();
</script>

<template>
    <button
        type="button"
        class="flex h-[42px] w-full items-center justify-center gap-2 rounded-[10px] bg-[#F05F73] text-[13px] font-[850] text-white"
    >
        <IconGlyph :name="icon" class-name="h-[15px] w-[15px]" />
        {{ label }}
    </button>
</template>
