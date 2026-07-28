<script setup lang="ts">
import { computed } from 'vue';
import type { CSSProperties } from 'vue';

const props = withDefaults(
    defineProps<{
        bandHeight?: number;
        bandSpread?: number;
        brightness?: number;
        className?: string;
        color1?: string;
        color2?: string;
        scale?: number;
        speed?: number;
    }>(),
    {
        bandHeight: 0.5,
        bandSpread: 1,
        brightness: 1,
        className: '',
        color1: '#f7f7f7',
        color2: '#e100ff',
        scale: 1.5,
        speed: 0.6
    }
);

const auroraStyle = computed<CSSProperties>(() => ({
    '--soft-aurora-band-height': `${props.bandHeight * 100}%`,
    '--soft-aurora-band-spread': `${Math.max(0.6, props.bandSpread)}`,
    '--soft-aurora-brightness': `${props.brightness}`,
    '--soft-aurora-color-1': props.color1,
    '--soft-aurora-color-2': props.color2,
    '--soft-aurora-duration': `${Math.max(5, 14 / Math.max(props.speed, 0.1))}s`,
    '--soft-aurora-scale': `${props.scale}`
}));
</script>

<template>
    <div
        class="soft-aurora-container relative h-full w-full overflow-hidden"
        :class="className"
        :style="auroraStyle"
    >
        <div class="soft-aurora-band soft-aurora-band-primary" />
        <div class="soft-aurora-band soft-aurora-band-secondary" />
        <div class="soft-aurora-noise" />
    </div>
</template>

<style scoped>
.soft-aurora-container {
    opacity: var(--soft-aurora-brightness);
    transform: scale(var(--soft-aurora-scale));
}

.soft-aurora-band {
    position: absolute;
    left: -16%;
    width: 132%;
    height: calc(52% * var(--soft-aurora-band-spread));
    border-radius: 999px;
    filter: blur(48px);
    mix-blend-mode: screen;
    transform-origin: center;
}

.soft-aurora-band-primary {
    top: var(--soft-aurora-band-height);
    background:
        radial-gradient(
            ellipse at 34% 50%,
            var(--soft-aurora-color-1) 0%,
            transparent 48%
        ),
        linear-gradient(
            90deg,
            transparent 0%,
            var(--soft-aurora-color-2) 46%,
            transparent 100%
        );
    animation: soft-aurora-flow var(--soft-aurora-duration) ease-in-out infinite
        alternate;
}

.soft-aurora-band-secondary {
    top: calc(var(--soft-aurora-band-height) + 12%);
    background:
        radial-gradient(
            ellipse at 64% 42%,
            var(--soft-aurora-color-2) 0%,
            transparent 44%
        ),
        linear-gradient(
            95deg,
            transparent 0%,
            var(--soft-aurora-color-1) 52%,
            transparent 100%
        );
    opacity: 0.62;
    animation: soft-aurora-drift calc(var(--soft-aurora-duration) * 1.18)
        ease-in-out infinite alternate;
}

.soft-aurora-noise {
    position: absolute;
    inset: 0;
    background-image: radial-gradient(
        circle at 1px 1px,
        rgb(255 255 255 / 10%) 1px,
        transparent 0
    );
    background-size: 18px 18px;
    opacity: 0.18;
}

@keyframes soft-aurora-flow {
    from {
        transform: translate3d(-5%, -8%, 0) rotate(2deg);
    }

    to {
        transform: translate3d(6%, 5%, 0) rotate(-3deg);
    }
}

@keyframes soft-aurora-drift {
    from {
        transform: translate3d(7%, 6%, 0) rotate(-4deg);
    }

    to {
        transform: translate3d(-8%, -4%, 0) rotate(3deg);
    }
}
</style>
