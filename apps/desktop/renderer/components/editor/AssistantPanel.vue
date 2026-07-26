<script setup lang="ts">
import { assistantPanel, assistantTags } from '../../constants/editor-screen';

import IconGlyph from './IconGlyph.vue';
</script>

<template>
    <aside
        class="flex min-h-0 flex-col overflow-hidden bg-[#111214] p-[16px_10px]"
    >
        <div class="min-h-0 overflow-y-auto pb-3">
            <div
                class="mb-[18px] text-center font-['Geist'] text-[13px] font-semibold text-[#6F7784]"
            >
                {{ assistantPanel.timestamp }}
            </div>

            <section class="mx-2 rounded-[18px] bg-[#252628] p-[12px_14px]">
                <div class="mb-2 flex h-6 items-center justify-between">
                    <h2 class="text-[15px] font-[760]">
                        {{ assistantPanel.contextTitle }}
                    </h2>
                    <span class="text-[#A9AFBA]">⌄</span>
                </div>
                <p
                    class="text-[12.5px] leading-[1.35] font-semibold whitespace-pre-line text-[#D5D8DE]"
                >
                    {{ assistantPanel.contextSummary }}
                </p>
                <div class="my-3 h-px bg-white/10" />
                <div class="grid gap-1.5">
                    <div
                        v-for="tag in assistantTags"
                        :key="tag.label"
                        class="flex gap-1.5"
                    >
                        <span
                            class="rounded-md bg-[#3A3B3E] px-2 py-1 text-[11.5px] font-[750] text-[#F5F7FA]"
                        >
                            {{ tag.label }}
                        </span>
                        <span
                            class="rounded-md bg-[#303133] px-2 py-1 text-[11.5px] font-[750] text-[#A9AFBA]"
                        >
                            {{ tag.value }}
                        </span>
                    </div>
                </div>
            </section>

            <p
                class="mx-2 mt-[33px] text-[12.2px] leading-[1.36] font-semibold whitespace-pre-line text-[#D6D8DD]"
            >
                {{ assistantPanel.analysis }}
            </p>

            <button
                type="button"
                class="mx-auto mt-2 flex h-8 w-[118px] items-center justify-center gap-2 rounded-full bg-[#2B2D31] text-xs font-bold text-[#A9AFBA]"
            >
                <IconGlyph name="arrow-down" class-name="h-[15px] w-[15px]" />
                {{ assistantPanel.returnAction }}
            </button>
        </div>

        <section
            class="mt-auto h-[129px] w-full shrink-0 rounded-[14px] bg-[#1A1B1E] p-[10px_0_0]"
        >
            <div
                class="flex h-[18px] w-full items-center justify-between px-3 text-xs font-bold text-[#A9AFBA]"
            >
                <span>{{ assistantPanel.quickEditTitle }}</span>
                <IconGlyph name="chevron-up" class-name="h-[18px] w-[18px]" />
            </div>
            <div
                class="mt-2 flex h-[93px] w-full flex-col justify-between rounded-[10px] border border-[#34363B] p-[10px_12px_12px]"
            >
                <span class="text-xs font-semibold text-[#6F737C]">
                    {{ assistantPanel.quickEditPlaceholder }}
                </span>
                <div
                    class="flex h-6 w-full items-center justify-between overflow-hidden"
                >
                    <div
                        class="flex h-[22px] w-[78px] items-center justify-center gap-1.5 rounded-md bg-[#303136]"
                    >
                        <IconGlyph
                            name="image"
                            class-name="h-[14px] w-[14px] text-[#A9AFBA]"
                        />
                        <span class="text-[11px] font-bold text-[#D5D8DE]">
                            {{ assistantPanel.linkedShot }}
                        </span>
                        <button
                            type="button"
                            aria-label="移除关联分镜"
                            class="grid h-3 w-3 place-items-center text-[#A9AFBA]"
                        >
                            <IconGlyph name="x" class-name="h-3 w-3" />
                        </button>
                    </div>
                    <button
                        type="button"
                        aria-label="发送快捷调整"
                        class="grid h-[23px] w-[23px] place-items-center rounded-full bg-[#F05F73] text-white"
                    >
                        <IconGlyph
                            name="arrow-up"
                            class-name="h-[19px] w-[19px]"
                        />
                    </button>
                </div>
            </div>
        </section>
    </aside>
</template>
