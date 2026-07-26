<script setup lang="ts">
withDefaults(
    defineProps<{
        className?: string;
        contentClassName?: string;
        footerClassName?: string;
    }>(),
    {
        className: undefined,
        contentClassName: undefined,
        footerClassName: undefined
    }
);
</script>

<template>
    <aside
        :class="[
            'flex h-full min-h-0 flex-col overflow-hidden bg-[#111214]',
            className
        ]"
    >
        <div :class="['min-h-0 flex-1', contentClassName]">
            <slot />
        </div>
        <div v-if="$slots.footer" :class="['shrink-0', footerClassName]">
            <slot name="footer" />
        </div>
    </aside>
</template>
