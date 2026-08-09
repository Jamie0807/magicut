<script setup lang="ts">
import { computed } from 'vue';

import type {
    AgentConversationBlock,
    AgentConversationMessage
} from '@magicut/video-project';

import { cx } from '../../../utils/classNames';

type ProgressBlock = Extract<AgentConversationBlock, { type: 'progress' }>;
type TableBlock = Extract<AgentConversationBlock, { type: 'table' }>;

const props = defineProps<{
    conversation: AgentConversationMessage[];
}>();

const roleLabel = {
    assistant: '智能体',
    system: '流程',
    user: '我'
} satisfies Record<AgentConversationMessage['role'], string>;

const messageShellClassName = {
    assistant: 'pr-10',
    system: 'pr-10',
    user: 'pl-10'
} satisfies Record<AgentConversationMessage['role'], string>;

const messageBodyClassName = {
    assistant: 'py-1',
    system: 'py-1',
    user: 'rounded-[12px] border border-[#334155] bg-[#1E2633] p-3'
} satisfies Record<AgentConversationMessage['role'], string>;

const progressStatusClassName = {
    cancelled: 'bg-[#6F7784]',
    completed: 'bg-[#25D0B1]',
    failed: 'bg-[#F05F73]',
    running: 'bg-[#F6B84B]',
    waiting: 'bg-[#6F7784]'
} satisfies Record<ProgressBlock['items'][number]['status'], string>;

const progressStatusLabel = {
    cancelled: '已取消',
    completed: '已完成',
    failed: '已失败',
    running: '进行中',
    waiting: '等待中'
} satisfies Record<ProgressBlock['items'][number]['status'], string>;

const messages = computed(() =>
    [...props.conversation]
        .sort((first, second) => first.sequence - second.sequence)
        .filter(
            (message) =>
                message.content.trim().length > 0 ||
                (message.blocks?.length ?? 0) > 0
        )
);

const getMessageShellClassName = (message: AgentConversationMessage) =>
    cx(messageShellClassName[message.role], 'min-w-0');

const getMessageBodyClassName = (message: AgentConversationMessage) =>
    messageBodyClassName[message.role];

const getProgressStatusClassName = (
    status: ProgressBlock['items'][number]['status']
) => cx('mt-[5px] h-2 w-2 rounded-full', progressStatusClassName[status]);

const getProgressStatusLabel = (
    status: ProgressBlock['items'][number]['status']
) => progressStatusLabel[status];

const shouldRenderContent = (message: AgentConversationMessage) =>
    (message.blocks?.length ?? 0) === 0 && message.content.trim().length > 0;

const isProgressBlock = (
    block: AgentConversationBlock
): block is ProgressBlock => block.type === 'progress';

const isTableBlock = (block: AgentConversationBlock): block is TableBlock =>
    block.type === 'table';
</script>

<template>
    <section
        v-if="messages.length > 0"
        data-visual-conversation-feed="true"
        class="mx-2 mt-[18px] grid gap-2.5"
    >
        <div class="flex items-center justify-between">
            <h2 class="text-[13px] leading-none font-[850] text-[#F5F7FA]">
                创建过程
            </h2>
            <span
                class="font-['Geist_Mono'] text-[10px] leading-none font-[700] text-[#6F7784]"
            >
                {{ messages.length }} 条
            </span>
        </div>

        <div class="grid gap-2.5">
            <article
                v-for="message in messages"
                :key="`${message.sequence}-${message.role}`"
                :data-visual-conversation-message="message.role"
                :class="getMessageShellClassName(message)"
            >
                <div :class="getMessageBodyClassName(message)">
                    <div class="mb-2 flex items-center justify-between gap-2">
                        <span
                            class="text-[11px] leading-none font-[850] text-[#F5F7FA]"
                        >
                            {{ roleLabel[message.role] }}
                        </span>
                        <span
                            v-if="message.tone"
                            class="text-[10px] leading-none font-[700] text-[#737C8C]"
                        >
                            {{ message.tone }}
                        </span>
                    </div>

                    <div class="grid gap-2">
                        <p
                            v-if="shouldRenderContent(message)"
                            class="text-[12px] leading-[18px] font-[500] break-words whitespace-pre-wrap text-[#D5D8DE]"
                        >
                            {{ message.content }}
                        </p>

                        <template v-else>
                            <template
                                v-for="(block, blockIndex) in message.blocks"
                                :key="`${message.sequence}-${block.type}-${blockIndex}`"
                            >
                                <h3
                                    v-if="block.type === 'heading'"
                                    class="text-[12px] leading-[16px] font-[850] text-[#F5F7FA]"
                                >
                                    {{ block.text }}
                                </h3>

                                <p
                                    v-else-if="block.type === 'paragraph'"
                                    class="text-[12px] leading-[18px] font-[500] break-words whitespace-pre-wrap text-[#D5D8DE]"
                                >
                                    {{ block.text }}
                                </p>

                                <ul
                                    v-else-if="block.type === 'bullets'"
                                    class="grid gap-1"
                                >
                                    <li
                                        v-for="item in block.items"
                                        :key="item"
                                        class="flex gap-2 text-[11.5px] leading-[17px] font-[500] text-[#C9D0DA]"
                                    >
                                        <span
                                            class="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-[#737C8C]"
                                        />
                                        <span class="min-w-0 break-words">
                                            {{ item }}
                                        </span>
                                    </li>
                                </ul>

                                <div
                                    v-else-if="block.type === 'key-values'"
                                    class="grid gap-1.5"
                                >
                                    <div
                                        v-for="item in block.items"
                                        :key="item.key"
                                        class="flex min-w-0 gap-2 rounded-[7px] bg-[#25272B] px-2 py-1.5"
                                    >
                                        <span
                                            class="shrink-0 text-[10px] leading-[14px] font-[800] text-[#8A93A3]"
                                        >
                                            {{ item.key }}
                                        </span>
                                        <span
                                            class="min-w-0 text-[10.5px] leading-[14px] font-[650] break-words text-[#D5D8DE]"
                                        >
                                            {{ item.value }}
                                        </span>
                                    </div>
                                </div>

                                <div
                                    v-else-if="isProgressBlock(block)"
                                    class="grid gap-2"
                                >
                                    <div
                                        v-for="item in block.items"
                                        :key="item.label"
                                        class="grid grid-cols-[8px_minmax(0,1fr)] gap-2"
                                    >
                                        <span
                                            aria-hidden="true"
                                            :class="
                                                getProgressStatusClassName(
                                                    item.status
                                                )
                                            "
                                        />
                                        <span class="sr-only">
                                            状态：{{
                                                getProgressStatusLabel(
                                                    item.status
                                                )
                                            }}
                                        </span>
                                        <div class="min-w-0">
                                            <div
                                                class="truncate text-[12px] leading-[16px] font-[800] text-[#F5F7FA]"
                                            >
                                                {{ item.label }}
                                            </div>
                                            <div
                                                v-if="item.detail"
                                                class="mt-0.5 line-clamp-2 text-[11px] leading-[15px] font-[500] text-[#8A93A3]"
                                            >
                                                {{ item.detail }}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div
                                    v-else-if="isTableBlock(block)"
                                    class="grid gap-2"
                                >
                                    <div
                                        v-for="(row, rowIndex) in block.rows"
                                        :key="`${row[0] ?? 'row'}-${rowIndex}`"
                                        class="rounded-[10px] border border-[#30343C] bg-[#15171B] p-2.5"
                                    >
                                        <div
                                            class="truncate text-[12px] leading-[16px] font-[850] text-[#F5F7FA]"
                                        >
                                            {{
                                                row[0] ?? `分镜 ${rowIndex + 1}`
                                            }}
                                        </div>
                                        <div class="mt-2 grid gap-1.5">
                                            <template
                                                v-for="(
                                                    column, columnIndex
                                                ) in block.columns.slice(1)"
                                                :key="column"
                                            >
                                                <div
                                                    v-if="row[columnIndex + 1]"
                                                    class="grid gap-0.5"
                                                >
                                                    <span
                                                        class="text-[10px] leading-[14px] font-[700] text-[#6F7784]"
                                                    >
                                                        {{ column }}
                                                    </span>
                                                    <span
                                                        class="text-[11px] leading-[16px] font-[600] break-words whitespace-pre-wrap text-[#C9D0DA]"
                                                    >
                                                        {{
                                                            row[columnIndex + 1]
                                                        }}
                                                    </span>
                                                </div>
                                            </template>
                                        </div>
                                    </div>
                                </div>
                            </template>
                        </template>
                    </div>
                </div>
            </article>
        </div>
    </section>
</template>
