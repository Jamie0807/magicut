<script setup lang="ts">
import type { MusicCategoryChip as MusicCategoryChipData } from '../../../types/config';

defineProps<{
    category: MusicCategoryChipData;
}>();
</script>

<template>
    <button
        type="button"
        :aria-pressed="category.active"
        :class="[
            'shrink-0 whitespace-nowrap rounded-[8px] border px-2 text-[11.5px] font-[800] transition-all duration-200 hover:-translate-y-[1px] cursor-pointer',
            category.active
                ? 'border-[#F05F73] bg-[#F05F7326] text-[#F05F73] hover:bg-[#F05F7333]'
                : 'border-[#242529] bg-[#242529] text-[#D5D8DE] hover:bg-[#30343A]'
        ]"
    >
        {{ category.label }}
    </button>
</template>
