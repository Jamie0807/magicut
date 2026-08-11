<script setup lang="ts">
import type { MusicTrack } from '../../../types/config';

import MusicCover from './MusicCover.vue';

defineProps<{
    track: MusicTrack;
}>();
const emit = defineEmits<{
    select: [track: MusicTrack];
}>();
</script>

<template>
    <button
        type="button"
        :aria-pressed="track.active"
        :data-music-source-url="track.sourceUrl"
        :data-music-track-id="track.id"
        :class="[
            'flex h-[40px] w-full items-center gap-2.5 rounded-[10px] px-0 text-left transition-all duration-200 hover:-translate-y-[1px] cursor-pointer',
            track.active
                ? 'bg-[#1E2126] hover:bg-[#24282F]'
                : 'bg-transparent hover:bg-[#24282F]'
        ]"
        @click="emit('select', track)"
    >
        <MusicCover
            :src="track.coverImageUrl"
            :alt="track.title"
            class-name="h-[38px] w-[38px]"
        />
        <div class="min-w-0 flex-1">
            <div class="flex items-center gap-1.5">
                <span class="truncate text-[12px] font-[800] text-[#F5F7FA]">
                    {{ track.title }}
                </span>
                <span
                    v-if="track.statusLabel"
                    class="flex h-[18px] items-center rounded-[4px] bg-[#3A3B3E] px-1.5 text-[9px] font-[700] text-[#D5D8DE]"
                >
                    {{ track.statusLabel }}
                </span>
            </div>
            <div class="truncate text-[10px] font-semibold text-[#A9AFBA]">
                {{ track.meta }}
            </div>
        </div>
    </button>
</template>
