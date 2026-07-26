<script setup lang="ts">
import type { ConfigTagPairData } from '../../../types/config';

defineProps<ConfigTagPairData>();
</script>

<template>
    <div class="flex gap-1.5">
        <span
            class="rounded-md bg-[#3A3B3E] px-2 py-1 text-[11.5px] font-[750] text-[#F5F7FA]"
        >
            {{ label }}
        </span>
        <span
            class="rounded-md bg-[#303133] px-2 py-1 text-[11.5px] font-[750] text-[#A9AFBA]"
        >
            {{ value }}
        </span>
    </div>
</template>
