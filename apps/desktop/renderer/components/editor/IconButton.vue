<script setup lang="ts">
import type { EditorIconName } from '../../types/editor-screen';

import IconGlyph from './IconGlyph.vue';

type IconButtonVariant =
    | 'default'
    | 'accent'
    | 'history'
    | 'timeline'
    | 'timelineActive';

const variantClassNames: Record<IconButtonVariant, string> = {
    default:
        'border-[#2A2F38] bg-[#1D2026] text-[#A9AFBA] hover:border-[#F05F73] hover:text-white',
    accent: 'border-[#F05F73] bg-[#F05F73] text-white',
    history: 'border-[#2A2F38] bg-[#1A1D22] text-[#A9AFBA]',
    timeline: 'border-[#2A2F38] bg-[#1D2026] text-[#A9AFBA]',
    timelineActive: 'border-[#2A2F38] bg-[#1D2026] text-white'
};

const props = withDefaults(
    defineProps<{
        label: string;
        icon: EditorIconName;
        variant?: IconButtonVariant;
        className?: string;
        iconClassName?: string;
    }>(),
    {
        variant: 'default',
        className: '',
        iconClassName: 'h-4 w-4'
    }
);
</script>

<template>
    <button
        type="button"
        :aria-label="props.label"
        :class="[
            'grid h-8 w-8 place-items-center rounded-lg border transition-colors',
            variantClassNames[props.variant],
            props.className
        ]"
    >
        <IconGlyph :name="props.icon" :class-name="props.iconClassName" />
    </button>
</template>
