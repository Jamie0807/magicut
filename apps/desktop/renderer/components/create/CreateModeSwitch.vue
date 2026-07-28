<script setup lang="ts">
import type { CreateModeOption } from '../../types/create';

defineProps<{
    modes: CreateModeOption[];
}>();
</script>

<template>
    <div
        class="absolute top-[34px] left-8 flex h-[58px] w-[305px] items-center gap-3 rounded-2xl border border-[#3C3B46] bg-[#22222A] p-1"
    >
        <span
            v-for="mode in modes"
            :key="mode.label"
            :class="[
                'grid h-[50px] place-items-center rounded-[13px] text-[20px] leading-none',
                mode.widthClassName,
                mode.tone === 'active'
                    ? 'bg-[#4A4A55] font-[850] text-white'
                    : 'cursor-not-allowed bg-[#22222A] text-[#898895]'
            ]"
        >
            {{ mode.label }}
        </span>
    </div>
</template>
