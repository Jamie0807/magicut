<script setup lang="ts">
import type { EditorIconName } from '../../../types/editor-screen';

import IconGlyph from '../../editor/IconGlyph.vue';

withDefaults(
    defineProps<{
        disabled?: boolean;
        icon: EditorIconName;
        label: string;
    }>(),
    {
        disabled: false
    }
);
const emit = defineEmits<{
    click: [];
}>();
</script>

<template>
    <button
        type="button"
        :disabled="disabled"
        :class="[
            'flex h-[42px] w-full items-center justify-center gap-2 rounded-[10px] text-[13px] font-[850] text-white',
            disabled
                ? 'cursor-not-allowed bg-[#5F6068] text-white/60'
                : 'bg-[#F05F73]'
        ]"
        @click="emit('click')"
    >
        <IconGlyph :name="icon" class-name="h-[15px] w-[15px]" />
        {{ label }}
    </button>
</template>
