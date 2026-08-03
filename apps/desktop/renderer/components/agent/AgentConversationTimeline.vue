<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';

import type {
    AgentConversationBlock,
    AgentConversationMessage
} from '@magicut/video-project';

import type { AgentConversationViewModel } from '../../mappers/agent-run-conversation';

const props = defineProps<{
    viewModel: AgentConversationViewModel;
}>();

const emit = defineEmits<{
    approve: [];
    cancel: [];
}>();

const messageKind = (message: AgentConversationMessage) => {
    if (message.role === 'user') {
        return message.sourceEventType === 'user.reply'
            ? 'user-reply'
            : 'user-request';
    }

    if (message.sourceEventType === 'run.progress') return 'execution-plan';
    if (message.sourceEventType === 'run.completed') return 'video-overview';
    if (message.sourceEventType?.startsWith('model.stream')) {
        return 'assistant-report';
    }
    if (message.sourceEventType?.startsWith('node.')) {
        return 'operation-status';
    }

    return 'assistant-message';
};

const messageClassName = (message: AgentConversationMessage) => [
    'rounded-[18px] border px-5 py-4 shadow-[0_14px_44px_rgba(0,0,0,0.22)]',
    message.role === 'user'
        ? 'ml-auto w-[760px] border-[#363C48] bg-[#242833] text-[#F5F7FA]'
        : 'mr-auto w-[760px] border-[#292E3A] bg-[#151820] text-[#EEF2F8]',
    message.tone === 'failed' ? 'border-[#70414D] bg-[#2A1720]' : '',
    message.tone === 'waiting' ? 'border-[#6B5B80]' : ''
];

const statusLabel = (status: string) => {
    if (status === 'completed') return '已完成';
    if (status === 'failed') return '失败';
    if (status === 'running') return '执行中';
    if (status === 'waiting') return '等待中';
    if (status === 'cancelled') return '已取消';

    return status;
};

const progressBlocks = computed(() =>
    props.viewModel.messages.flatMap(
        (message) =>
            message.blocks?.filter(
                (
                    block
                ): block is Extract<
                    AgentConversationBlock,
                    { type: 'progress' }
                > => block.type === 'progress'
            ) ?? []
    )
);
</script>

<template>
    <ol class="grid gap-5" data-create-run-chat-body="true">
        <li
            v-for="message in viewModel.messages"
            :key="`${message.sequence}-${message.sourceEventType ?? message.role}`"
            :data-message-kind="messageKind(message)"
            :class="messageClassName(message)"
        >
            <div class="grid gap-3">
                <template v-for="block in message.blocks" :key="block.type">
                    <h3
                        v-if="block.type === 'heading'"
                        class="text-[16px] leading-[22px] font-[900] text-white"
                    >
                        {{ block.text }}
                    </h3>
                    <p
                        v-else-if="block.type === 'paragraph'"
                        class="whitespace-pre-line text-[14px] leading-[24px] font-[650] text-[#D7DCE6]"
                    >
                        {{ block.text }}
                    </p>
                    <ul
                        v-else-if="block.type === 'bullets'"
                        class="grid gap-1.5 text-[13px] leading-[20px] font-[700] text-[#C9D0DC]"
                    >
                        <li
                            v-for="item in block.items"
                            :key="item"
                            class="flex gap-2"
                        >
                            <span
                                class="mt-2 h-1.5 w-1.5 rounded-full bg-[#8B6AF7]"
                            />
                            <span>{{ item }}</span>
                        </li>
                    </ul>
                    <dl
                        v-else-if="block.type === 'key-values'"
                        class="grid grid-cols-3 gap-2"
                    >
                        <div
                            v-for="item in block.items"
                            :key="item.key"
                            class="rounded-[12px] border border-[#303644] bg-[#0F1219] px-3 py-2"
                        >
                            <dt
                                class="text-[11px] leading-none font-[800] text-[#798294]"
                            >
                                {{ item.key }}
                            </dt>
                            <dd
                                class="mt-1 truncate text-[13px] leading-[18px] font-[850] text-[#F4F7FB]"
                            >
                                {{ item.value }}
                            </dd>
                        </div>
                    </dl>
                    <div
                        v-else-if="block.type === 'table'"
                        class="overflow-hidden rounded-[14px] border border-[#343A48]"
                    >
                        <table class="w-full border-collapse text-left">
                            <thead class="bg-[#202530] text-[#AAB3C1]">
                                <tr>
                                    <th
                                        v-for="column in block.columns"
                                        :key="column"
                                        class="px-3 py-2 text-[12px] font-[850]"
                                    >
                                        {{ column }}
                                    </th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-[#2E3442]">
                                <tr
                                    v-for="(row, rowIndex) in block.rows"
                                    :key="rowIndex"
                                >
                                    <td
                                        v-for="(cell, cellIndex) in row"
                                        :key="`${rowIndex}-${cellIndex}`"
                                        class="px-3 py-2 text-[12px] leading-[18px] font-[700] text-[#EEF2F8]"
                                    >
                                        {{ cell }}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <ol
                        v-else-if="block.type === 'progress'"
                        class="grid gap-2"
                    >
                        <li
                            v-for="item in block.items"
                            :key="item.label"
                            class="grid grid-cols-[118px_minmax(0,1fr)_64px] items-center gap-3 rounded-[12px] border border-[#303644] bg-[#0F1219] px-3 py-2"
                        >
                            <span
                                class="text-[12px] leading-[16px] font-[900] text-[#F2F5FA]"
                            >
                                {{ item.label }}
                            </span>
                            <span
                                class="truncate text-[12px] leading-[16px] font-[650] text-[#8C96A8]"
                            >
                                {{ item.detail }}
                            </span>
                            <span
                                class="text-right text-[11px] leading-[16px] font-[850]"
                                :class="{
                                    'text-[#77F2B3]':
                                        item.status === 'completed',
                                    'text-[#FF6B7A]': item.status === 'failed',
                                    'text-[#8884FF]': item.status === 'running',
                                    'text-[#FFD166]': item.status === 'waiting',
                                    'text-[#8F96A3]':
                                        item.status === 'cancelled'
                                }"
                            >
                                {{ statusLabel(item.status) }}
                            </span>
                        </li>
                    </ol>
                </template>
                <p
                    v-if="message.content"
                    class="whitespace-pre-line text-[14px] leading-[24px] font-[700] text-[#E8ECF5]"
                    :data-typewriter-active="
                        message.sourceEventType === 'model.stream.delta'
                    "
                >
                    {{ message.content }}
                </p>
                <div
                    v-if="
                        message.sourceEventType === 'model.stream.started' &&
                        !message.content
                    "
                    class="agent-typing-placeholder h-3 w-24 animate-pulse rounded-full bg-[#394050]"
                />
                <div
                    v-if="
                        message.sourceEventType === 'node.started' &&
                        !message.content
                    "
                    class="agent-loading-placeholder h-3 w-32 animate-pulse rounded-full bg-[#394050]"
                />
            </div>
        </li>
        <li
            v-if="
                viewModel.canApprove ||
                viewModel.canCancel ||
                viewModel.editorHref
            "
            class="mr-auto flex w-[760px] items-center gap-3"
        >
            <button
                v-if="viewModel.canApprove"
                type="button"
                class="h-11 rounded-[13px] bg-[#F5F7FA] px-5 text-[14px] font-[900] text-[#10131A] transition-transform duration-200 hover:-translate-y-0.5"
                @click="emit('approve')"
            >
                确认分镜
            </button>
            <button
                v-if="viewModel.canCancel"
                type="button"
                class="h-11 rounded-[13px] border border-[#495061] px-5 text-[14px] font-[850] text-[#CBD2DE] transition-colors duration-200 hover:bg-[#FFFFFF12]"
                @click="emit('cancel')"
            >
                取消任务
            </button>
            <RouterLink
                v-if="viewModel.editorHref"
                :to="viewModel.editorHref"
                class="grid h-11 place-items-center rounded-[13px] bg-[#8B6AF7] px-5 text-[14px] font-[900] text-white transition-colors duration-200 hover:bg-[#9C7DFF]"
            >
                打开编辑器
            </RouterLink>
        </li>
        <li
            v-if="viewModel.messages.length === 0"
            class="mr-auto w-[760px] rounded-[18px] border border-[#292E3A] bg-[#151820] px-5 py-4 text-[14px] font-[800] text-[#8F98A8]"
        >
            等待智能体执行事件
        </li>
    </ol>
    <span class="sr-only">{{ progressBlocks.length }}</span>
</template>
