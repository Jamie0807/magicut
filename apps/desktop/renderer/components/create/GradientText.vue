<script setup lang="ts">
import { computed } from 'vue';
import type { CSSProperties } from 'vue';

type GradientDirection = 'horizontal' | 'vertical' | 'diagonal';

const gradientDirectionToAngle: Record<GradientDirection, string> = {
    horizontal: 'to right',
    vertical: 'to bottom',
    diagonal: 'to bottom right'
};

const props = withDefaults(
    defineProps<{
        animationSpeed?: number;
        className?: string;
        colors: string[];
        direction?: GradientDirection;
    }>(),
    {
        animationSpeed: 8,
        className: '',
        direction: 'horizontal'
    }
);

const gradientStyle = computed<CSSProperties>(() => {
    const firstColor = props.colors[0] ?? '#FFFFFF';
    const gradientColors = [...props.colors, firstColor].join(', ');
    const backgroundSize =
        props.direction === 'vertical' ? '100% 300%' : '300% 100%';

    return {
        '--gradient-text-duration': `${props.animationSpeed}s`,
        backgroundImage: `linear-gradient(${gradientDirectionToAngle[props.direction]}, ${gradientColors})`,
        backgroundRepeat: 'repeat',
        backgroundSize
    };
});
</script>

<template>
    <span
        class="gradient-text-motion inline-block"
        :class="className"
        :style="gradientStyle"
    >
        <slot />
    </span>
</template>
