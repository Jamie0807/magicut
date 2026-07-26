<script setup lang="ts">
withDefaults(
    defineProps<{
        className?: string;
    }>(),
    {
        className: undefined
    }
);
</script>

<template>
    <section
        :class="[
            'rounded-[14px] border border-[#30343C] bg-[#1A1C20] p-[14px]',
            className
        ]"
    >
        <slot />
    </section>
</template>
