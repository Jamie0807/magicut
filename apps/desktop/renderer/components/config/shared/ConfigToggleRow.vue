<script setup lang="ts">
defineProps<{
    label: string;
    enabled: boolean;
}>();
</script>

<template>
    <div class="flex items-center gap-2">
        <span class="text-[11px] font-[700] text-[#F5F7FA]">
            {{ label }}
        </span>
        <button
            type="button"
            :aria-label="label"
            :aria-pressed="enabled"
            :class="[
                'relative h-[28px] w-[48px] rounded-full transition-all duration-200',
                enabled ? 'bg-[#F05F73]' : 'bg-[#30343C]'
            ]"
        >
            <span
                :class="[
                    'absolute top-[3px] h-[22px] w-[22px] rounded-full bg-white transition-all duration-200',
                    enabled ? 'left-[23px]' : 'left-[3px]'
                ]"
            />
        </button>
    </div>
</template>
