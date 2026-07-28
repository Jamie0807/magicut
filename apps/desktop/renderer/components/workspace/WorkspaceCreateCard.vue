<script setup lang="ts">
import type { WorkspaceCreateCard as WorkspaceCreateCardData } from '../../types/workspace';
import IconGlyph from '../editor/IconGlyph.vue';

defineProps<{
    card: WorkspaceCreateCardData;
}>();

defineEmits<{
    create: [];
}>();
</script>

<template>
    <button
        type="button"
        :aria-label="card.title"
        class="group flex h-[250px] w-full cursor-pointer appearance-none flex-col items-center justify-center gap-[18px] rounded-[18px] border border-[#4A4D54]/80 bg-[#202123]/72 px-4 py-7 text-left shadow-[0_18px_48px_rgba(0,0,0,0.22)] transition-all duration-200 supports-[backdrop-filter]:backdrop-blur-[18px] hover:-translate-y-1 hover:border-white/20 hover:bg-[#25272B]/82"
        @click="$emit('create')"
    >
        <div class="relative h-[88px] w-[92px]">
            <div
                class="absolute top-0 left-[42px] h-12 w-12 rotate-[-10deg] rounded-[13px] bg-[linear-gradient(135deg,#C8FF63_0%,#F05F73_100%)]"
            />
            <div
                class="absolute top-6 left-1 grid h-[58px] w-[68px] place-items-center rounded-[14px] bg-[linear-gradient(135deg,#3C3D42_0%,#B682FF_100%)] shadow-[0_12px_24px_rgba(0,0,0,0.33)]"
            >
                <IconGlyph
                    name="list-video"
                    class-name="h-[30px] w-[30px] text-white/90"
                />
            </div>
        </div>
        <span
            class="grid h-[52px] w-full place-items-center rounded-[12px] bg-[#F1F2F4] px-3 text-center text-[18px] font-[900] text-[#111214] transition-transform duration-200 group-hover:scale-[1.01]"
        >
            {{ card.title }}
        </span>
    </button>
</template>
