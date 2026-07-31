<script setup lang="ts">
import { RouterLink } from 'vue-router';

import type { WorkspaceProject } from '../../types/workspace';
import IconGlyph from '../editor/IconGlyph.vue';

import SpotlightCard from './SpotlightCard.vue';

defineProps<{
    project: WorkspaceProject;
}>();

const emit = defineEmits<{
    deleteRequest: [project: WorkspaceProject];
}>();
</script>

<template>
    <SpotlightCard
        class-name="h-[250px] rounded-[18px] bg-[#202123] p-0 transition-transform duration-200 hover:-translate-y-1"
        spotlight-color="rgba(255, 255, 255, 0.22)"
    >
        <RouterLink
            :to="project.href"
            :aria-label="`打开项目：${project.title}`"
            data-client-route="true"
            class="group relative z-10 flex h-full flex-col overflow-hidden rounded-[18px]"
        >
            <div class="relative h-[130px] w-full overflow-hidden">
                <img
                    :src="project.coverImageUrl"
                    :alt="project.title"
                    class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                />
                <div
                    class="pointer-events-none absolute bottom-0 left-0 h-[42px] w-full bg-[linear-gradient(180deg,#11121400_0%,#111214AA_100%)]"
                />
                <span
                    class="absolute top-3 right-[18px] grid h-[26px] w-8 place-items-center rounded-full bg-[#00000055] text-white/80 transition-colors duration-200 group-hover:bg-[#00000070] group-hover:text-white"
                >
                    <IconGlyph name="ellipsis" class-name="h-4 w-4" />
                </span>
            </div>
            <article class="flex h-[120px] flex-col gap-[10px] px-5 py-[18px]">
                <h3
                    class="line-clamp-2 text-[17px] leading-[1.25] font-[900] text-[#F4F5F7]"
                >
                    {{ project.title }}
                </h3>
                <div class="flex h-6 items-center justify-between gap-3">
                    <span
                        class="truncate text-[12px] leading-none font-[750] text-[#9AA0AA]"
                    >
                        {{ project.createdAt }}
                    </span>
                    <span class="h-6 w-[34px]" aria-hidden="true" />
                </div>
            </article>
        </RouterLink>
        <button
            type="button"
            aria-label="删除项目"
            class="absolute right-5 bottom-[18px] z-20 grid h-6 w-[34px] place-items-center rounded-full text-[#8A8F98] transition-colors duration-200 hover:bg-[#FF4D6D]/15 hover:text-[#FF8A9B] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B497CF]"
            @click.prevent.stop="emit('deleteRequest', project)"
        >
            <IconGlyph name="trash-2" class-name="h-5 w-5" />
        </button>
    </SpotlightCard>
</template>
