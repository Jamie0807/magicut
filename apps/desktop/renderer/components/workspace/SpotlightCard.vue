<script setup lang="ts">
import { computed, shallowRef } from 'vue';

const props = withDefaults(
    defineProps<{
        className?: string;
        spotlightColor?: string;
    }>(),
    {
        className: 'rounded-3xl border border-neutral-800 bg-neutral-900 p-8',
        spotlightColor: 'rgba(255, 255, 255, 0.25)'
    }
);

const pointerX = shallowRef(0);
const pointerY = shallowRef(0);
const glowOpacity = shallowRef(0);

const glowStyle = computed(() => ({
    opacity: glowOpacity.value,
    background: `radial-gradient(circle at ${pointerX.value}px ${pointerY.value}px, ${props.spotlightColor}, transparent 80%)`
}));

function handlePointerMove(event: MouseEvent) {
    const currentTarget = event.currentTarget;

    if (!(currentTarget instanceof HTMLElement)) {
        return;
    }

    const rect = currentTarget.getBoundingClientRect();
    pointerX.value = event.clientX - rect.left;
    pointerY.value = event.clientY - rect.top;
}
</script>

<template>
    <div
        :class="['spotlight-card relative overflow-hidden', className]"
        @mousemove="handlePointerMove"
        @mouseenter="glowOpacity = 0.6"
        @mouseleave="glowOpacity = 0"
        @focusin="glowOpacity = 0.6"
        @focusout="glowOpacity = 0"
    >
        <div
            class="spotlight-card-glow pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 ease-in-out"
            :style="glowStyle"
        />
        <slot />
    </div>
</template>
