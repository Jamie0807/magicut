<script setup lang="ts">
withDefaults(
    defineProps<{
        src: string;
        alt: string;
        className?: string;
    }>(),
    {
        className: 'h-[56px] w-[56px]'
    }
);
</script>

<template>
    <div :class="['overflow-hidden rounded-[10px] bg-[#1A1D22]', className]">
        <img :src="src" :alt="alt" class="h-full w-full object-cover" />
    </div>
</template>
