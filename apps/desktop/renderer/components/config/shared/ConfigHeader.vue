<script setup lang="ts">
withDefaults(
    defineProps<{
        title: string;
        subtitle?: string;
        className?: string;
        titleClassName?: string;
        subtitleClassName?: string;
    }>(),
    {
        subtitle: undefined,
        className: undefined,
        titleClassName: 'text-[14px] leading-none font-[800]',
        subtitleClassName:
            "font-['Geist'] text-[11px] leading-none font-semibold text-[#6F7784]"
    }
);
</script>

<template>
    <div :class="['grid gap-1', className]">
        <h2 :class="['text-[#F5F7FA]', titleClassName]">
            {{ title }}
        </h2>
        <p v-if="subtitle" :class="subtitleClassName">
            {{ subtitle }}
        </p>
    </div>
</template>
