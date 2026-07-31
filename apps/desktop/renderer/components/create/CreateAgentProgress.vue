<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';

import type { DesktopAgentRunEvent } from '../../../shared/video-agent';

import { createAgentProgressViewModel } from './createAgentProgressViewModel';

const props = defineProps<{
    events: DesktopAgentRunEvent[];
}>();

const emit = defineEmits<{
    approve: [];
    cancel: [];
    retry: [];
}>();

const viewModel = computed(() => createAgentProgressViewModel(props.events));
const visibleEntries = computed(() => viewModel.value.entries.slice(-4));
</script>

<template>
    <aside
        aria-live="polite"
        class="create-agent-progress overflow-hidden rounded-[18px] border border-[#3B3948] bg-[#171821CC] px-4 py-3 shadow-[0_18px_48px_rgba(0,0,0,0.26)] backdrop-blur-[18px]"
    >
        <div class="flex items-center justify-between gap-4">
            <div class="min-w-0">
                <p class="text-[13px] leading-none font-[750] text-[#9A99A4]">
                    智能体执行过程
                </p>
                <h3
                    class="mt-1 truncate text-[18px] leading-tight font-[850] text-[#F4F2FA]"
                >
                    {{ viewModel.title }}
                </h3>
            </div>
            <div class="flex shrink-0 items-center gap-2">
                <button
                    v-if="viewModel.canApprove"
                    type="button"
                    class="h-9 rounded-[11px] bg-[#FFFFFFE8] px-3 text-[13px] font-[850] text-[#181820] transition-colors duration-200 hover:bg-white"
                    @click="emit('approve')"
                >
                    确认分镜
                </button>
                <button
                    v-if="viewModel.canRetry"
                    type="button"
                    class="h-9 rounded-[11px] border border-[#6B5B80] px-3 text-[13px] font-[850] text-[#E7E2F3] transition-colors duration-200 hover:bg-[#FFFFFF14]"
                    @click="emit('retry')"
                >
                    重试
                </button>
                <button
                    v-if="viewModel.canCancel"
                    type="button"
                    class="h-9 rounded-[11px] border border-[#4A4656] px-3 text-[13px] font-[800] text-[#AFAAB9] transition-colors duration-200 hover:bg-[#FFFFFF0F] hover:text-white"
                    @click="emit('cancel')"
                >
                    取消
                </button>
                <RouterLink
                    v-if="viewModel.editorHref"
                    :to="viewModel.editorHref"
                    class="grid h-9 place-items-center rounded-[11px] bg-[#8B6AF7] px-3 text-[13px] font-[850] text-white transition-colors duration-200 hover:bg-[#9C7DFF]"
                >
                    打开编辑器
                </RouterLink>
            </div>
        </div>
        <ol class="mt-3 grid gap-1.5">
            <li
                v-for="entry in visibleEntries"
                :key="entry.sequence"
                class="flex min-w-0 items-center gap-2 text-[12px] leading-[1.35]"
            >
                <span
                    class="h-1.5 w-1.5 shrink-0 rounded-full"
                    :class="{
                        'bg-[#76F7B7]': entry.tone === 'completed',
                        'bg-[#FF6B6B]': entry.tone === 'failed',
                        'bg-[#AFAAB9]': entry.tone === 'cancelled',
                        'bg-[#FFD166]': entry.tone === 'waiting',
                        'bg-[#8B6AF7]': entry.tone === 'running'
                    }"
                />
                <span class="shrink-0 font-[800] text-[#EAE7F2]">
                    {{ entry.label }}
                </span>
                <span v-if="entry.detail" class="truncate text-[#8F8B9C]">
                    {{ entry.detail }}
                </span>
            </li>
            <li
                v-if="visibleEntries.length === 0"
                class="text-[12px] font-[700] text-[#8F8B9C]"
            >
                等待创建指令
            </li>
        </ol>
    </aside>
</template>
