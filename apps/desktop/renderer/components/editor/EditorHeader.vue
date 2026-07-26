<script setup lang="ts">
import { editorHeader } from '../../constants/editor-screen';

import IconGlyph from './IconGlyph.vue';
</script>

<template>
    <header
        class="flex h-20 items-start justify-between border-b border-[#2A2F38] bg-[#111318] px-5 [app-region:drag]"
    >
        <div class="flex w-[230px] items-center gap-3 pt-[30px]">
            <div
                class="grid h-[30px] w-[30px] place-items-center rounded-lg bg-[#F05F73] text-xs font-black text-white"
            >
                剪
            </div>
            <div class="grid gap-0.5">
                <div class="text-[15px] font-bold">
                    {{ editorHeader.productName }}
                </div>
                <div class="font-['Geist'] text-[11px] text-[#6F7784]">
                    {{ editorHeader.productDescription }}
                </div>
            </div>
        </div>

        <div class="h-10 w-[440px] pt-[18px] text-center">
            <h1 class="text-xl leading-5 font-[750]">
                {{ editorHeader.title }}
            </h1>
            <p class="mt-1 font-['Geist'] text-[11px] text-[#6F7784]">
                {{ editorHeader.status }}
            </p>
        </div>

        <div class="flex w-28 justify-end pt-[30px]">
            <button
                type="button"
                class="flex h-9 items-center gap-2 rounded-lg bg-[#F05F73] px-4 text-[13px] font-[750] text-white shadow-[0_10px_22px_rgba(240,95,115,0.22)] [app-region:no-drag]"
            >
                <IconGlyph name="download" />
                {{ editorHeader.primaryAction }}
            </button>
        </div>
    </header>
</template>
