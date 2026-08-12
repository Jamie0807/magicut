<script setup lang="ts">
import type { AgentRunStageItem } from '../../mappers/agent-run-conversation';

defineProps<{
    stageItems: AgentRunStageItem[];
}>();

const statusLabel = (status: AgentRunStageItem['status']) => {
    if (status === 'completed') return '已完成';
    if (status === 'failed') return '失败';
    if (status === 'running') return '执行中';
    if (status === 'waiting') return '等待中';
    if (status === 'cancelled') return '已取消';

    return status;
};
</script>

<template>
    <aside
        data-agent-stage-nav="true"
        class="sticky top-[88px] mt-[88px] hidden h-fit w-[232px] rounded-[18px] border border-[#292D38] bg-[#151820E6] p-4 shadow-[0_18px_60px_rgba(0,0,0,0.32)] backdrop-blur-[18px] xl:block"
    >
        <p class="text-[12px] leading-none font-[850] text-[#747D8D]">
            执行目录
        </p>
        <ol class="mt-4 grid gap-[14px]">
            <li
                v-for="item in stageItems"
                :key="item.label"
                class="grid grid-cols-[10px_minmax(0,1fr)_42px] gap-3"
            >
                <span
                    class="mt-1 h-2.5 w-2.5 rounded-full"
                    :class="{
                        'bg-[#77F2B3]': item.status === 'completed',
                        'bg-[#FF6B7A]': item.status === 'failed',
                        'bg-[#8884FF]': item.status === 'running',
                        'bg-[#FFD166]': item.status === 'waiting',
                        'bg-[#8F96A3]': item.status === 'cancelled'
                    }"
                />
                <span class="min-w-0">
                    <span
                        class="block text-[13px] leading-[18px] font-[850] text-[#EEF2F8]"
                    >
                        {{ item.label }}
                    </span>
                    <span
                        v-if="item.detail"
                        class="mt-0.5 block text-[11px] leading-[16px] font-[650] text-[#828A98]"
                    >
                        {{ item.detail }}
                    </span>
                </span>
                <span
                    class="pt-px text-right text-[10px] leading-[14px] font-[850]"
                    :class="{
                        'text-[#77F2B3]': item.status === 'completed',
                        'text-[#FF6B7A]': item.status === 'failed',
                        'text-[#8884FF]': item.status === 'running',
                        'text-[#FFD166]': item.status === 'waiting',
                        'text-[#8F96A3]': item.status === 'cancelled'
                    }"
                >
                    {{ statusLabel(item.status) }}
                </span>
            </li>
        </ol>
    </aside>
</template>
