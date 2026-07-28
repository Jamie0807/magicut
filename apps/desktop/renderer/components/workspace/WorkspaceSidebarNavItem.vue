<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';

import type { WorkspaceNavItem, WorkspaceView } from '../../types/workspace';
import IconGlyph from '../editor/IconGlyph.vue';

const props = defineProps<{
    item: WorkspaceNavItem;
}>();

const emit = defineEmits<{
    select: [view: WorkspaceView];
}>();

const isActive = computed(() => props.item.tone === 'active');
const itemClass = computed(() => [
    'relative block w-[98px] rounded-[46px] transition-all duration-200',
    isActive.value
        ? 'h-[108px] overflow-hidden bg-[radial-gradient(ellipse_at_28%_18%,#FFFFFF42_0%,#FFFFFF00_72%),linear-gradient(165deg,#582CFF_0%,#BF40FF_48%,#FF4DA6_100%)] shadow-[0_10px_28px_rgba(191,64,255,0.4),0_0_16px_rgba(255,77,166,0.3)]'
        : 'h-[92px] bg-transparent opacity-[0.78] hover:bg-white/4 hover:opacity-100'
]);

const selectView = () => {
    if (props.item.view) {
        emit('select', props.item.view);
    }
};
</script>

<template>
    <button
        v-if="item.view"
        type="button"
        :aria-current="isActive ? 'page' : undefined"
        :class="[
            itemClass,
            'cursor-pointer appearance-none border-0 p-0 text-left'
        ]"
        @click="selectView"
    >
        <span
            v-if="isActive"
            class="pointer-events-none absolute top-[8px] left-[13px] h-[60px] w-[72px] rounded-full bg-[radial-gradient(circle_at_45%_45%,#FFFFFF5C_0%,#FF4DA622_44%,#FFFFFF00_100%)] opacity-[0.72] blur-[8px]"
        />
        <span
            :class="[
                'absolute grid place-items-center rounded-full border',
                isActive
                    ? 'top-[18px] left-[26px] h-[46px] w-[46px] border-[#FFFFFF40] bg-[#FFFFFF24] text-white shadow-[0_0_18px_rgba(255,255,255,0.2)]'
                    : 'top-[14px] left-[28px] h-[42px] w-[42px] border-[#FFFFFF12] bg-[#151824CC] text-[#8D94A6] transition-all duration-200'
            ]"
        >
            <IconGlyph
                :name="item.icon"
                :class-name="
                    isActive ? 'h-[22px] w-[22px]' : 'h-[20px] w-[20px]'
                "
            />
        </span>
        <span
            class="absolute left-0 w-[98px] text-center font-['Geist'] text-[12px] leading-none"
            :class="
                isActive
                    ? 'top-[75px] font-[800] text-white'
                    : 'top-[65px] font-[650] text-[#8D94A6]'
            "
        >
            {{ item.label }}
        </span>
    </button>

    <RouterLink
        v-else-if="item.href"
        :to="item.href"
        :aria-current="isActive ? 'page' : undefined"
        :class="itemClass"
    >
        <span
            v-if="isActive"
            class="pointer-events-none absolute top-[8px] left-[13px] h-[60px] w-[72px] rounded-full bg-[radial-gradient(circle_at_45%_45%,#FFFFFF5C_0%,#FF4DA622_44%,#FFFFFF00_100%)] opacity-[0.72] blur-[8px]"
        />
        <span
            :class="[
                'absolute grid place-items-center rounded-full border',
                isActive
                    ? 'top-[18px] left-[26px] h-[46px] w-[46px] border-[#FFFFFF40] bg-[#FFFFFF24] text-white shadow-[0_0_18px_rgba(255,255,255,0.2)]'
                    : 'top-[14px] left-[28px] h-[42px] w-[42px] border-[#FFFFFF12] bg-[#151824CC] text-[#8D94A6] transition-all duration-200'
            ]"
        >
            <IconGlyph
                :name="item.icon"
                :class-name="
                    isActive ? 'h-[22px] w-[22px]' : 'h-[20px] w-[20px]'
                "
            />
        </span>
        <span
            class="absolute left-0 w-[98px] text-center font-['Geist'] text-[12px] leading-none"
            :class="
                isActive
                    ? 'top-[75px] font-[800] text-white'
                    : 'top-[65px] font-[650] text-[#8D94A6]'
            "
        >
            {{ item.label }}
        </span>
    </RouterLink>

    <div v-else :class="itemClass">
        <span
            class="absolute top-[14px] left-[28px] grid h-[42px] w-[42px] place-items-center rounded-[21px] border border-[#FFFFFF12] bg-[#151824CC] text-[#8D94A6]"
        >
            <IconGlyph :name="item.icon" class-name="h-[20px] w-[20px]" />
        </span>
        <span
            class="absolute top-[65px] left-0 w-[98px] text-center font-['Geist'] text-[12px] leading-none font-[650] text-[#8D94A6]"
        >
            {{ item.label }}
        </span>
    </div>
</template>
