<script setup lang="ts">
import { computed, shallowRef } from 'vue';

import { visualConfigPanel } from '../../../constants/config';
import type { ConfigPanelContext } from '../../../types/config';

import IconGlyph from '../../editor/IconGlyph.vue';
import ConfigTagPair from '../shared/ConfigTagPair.vue';

import VisualConversationFeed from './VisualConversationFeed.vue';

const props = defineProps<{
    context: ConfigPanelContext;
}>();

const conversation = computed(() => props.context.conversation ?? []);
const hasConversation = computed(() => conversation.value.length > 0);
const prompt = shallowRef('');
const selectedScene = computed(() => props.context.selectedScene);
const canSubmit = computed(
    () =>
        Boolean(selectedScene.value?.id) &&
        prompt.value.trim().length > 0 &&
        !props.context.isRegeneratingScene
);

const submit = () => {
    if (!canSubmit.value || !selectedScene.value) return;

    const nextPrompt = prompt.value.trim();

    prompt.value = '';
    void props.context.onRegenerateScene?.({
        prompt: nextPrompt,
        sceneId: selectedScene.value.id
    });
};

const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Enter' || event.shiftKey) return;

    event.preventDefault();
    submit();
};
</script>

<template>
    <aside
        class="flex h-full min-h-0 w-[320px] flex-col overflow-hidden bg-[#111214] p-[16px_10px]"
    >
        <div class="min-h-0 overflow-y-auto pb-3">
            <div
                class="mb-[18px] text-center font-['Geist'] text-[13px] font-semibold text-[#6F7784]"
            >
                {{ visualConfigPanel.timestamp }}
            </div>

            <section class="mx-2 rounded-[18px] bg-[#252628] p-[12px_14px]">
                <div class="mb-2 flex h-6 items-center justify-between">
                    <h2 class="text-[15px] font-[760]">
                        {{ visualConfigPanel.contextTitle }}
                    </h2>
                    <span class="text-[#A9AFBA]">⌄</span>
                </div>
                <p
                    class="text-[12.5px] leading-[1.35] font-semibold whitespace-pre-line text-[#D5D8DE]"
                >
                    {{ visualConfigPanel.contextSummary }}
                </p>
                <div class="my-3 h-px bg-white/10" />
                <div class="grid gap-1.5">
                    <ConfigTagPair
                        v-for="tag in visualConfigPanel.tags"
                        :key="tag.label"
                        v-bind="tag"
                    />
                </div>
            </section>

            <VisualConversationFeed
                v-if="hasConversation"
                :conversation="conversation"
            />
            <p
                v-else
                class="mx-2 mt-[33px] text-[12.2px] leading-[1.36] font-semibold whitespace-pre-line text-[#D6D8DD]"
            >
                {{ visualConfigPanel.analysis }}
            </p>
        </div>

        <section
            class="mt-auto h-[160px] w-full shrink-0 rounded-[14px] bg-[#1A1B1E] p-[10px_0_0] pb-[14px]"
        >
            <div
                class="flex h-[18px] w-full items-center justify-between px-3 text-xs font-bold text-[#A9AFBA]"
            >
                <span>{{ visualConfigPanel.quickAdjust.title }}</span>
                <IconGlyph name="chevron-up" class-name="h-[18px] w-[18px]" />
            </div>
            <div
                class="mt-2 flex h-[120px] w-full flex-col justify-between rounded-[10px] border border-[#34363B] bg-[#121316] p-[10px_12px_14px] focus-within:border-[#F05F73]/70"
            >
                <textarea
                    v-model="prompt"
                    aria-label="输入快捷调整"
                    class="h-[70px] w-full resize-none border-0 bg-transparent p-0 text-xs leading-[18px] font-semibold text-[#D5D8DE] outline-none placeholder:text-[#6F737C]"
                    :placeholder="visualConfigPanel.quickAdjust.placeholder"
                    @keydown="handleKeyDown"
                />
                <div
                    class="flex h-7 w-full items-center justify-between overflow-hidden pt-1"
                >
                    <div
                        v-if="selectedScene"
                        :data-selected-scene-id="selectedScene.id"
                        class="flex h-[22px] max-w-[132px] items-center justify-center gap-1.5 rounded-md bg-[#303136] px-2"
                    >
                        <IconGlyph
                            name="image"
                            class-name="h-[14px] w-[14px] text-[#A9AFBA]"
                        />
                        <span
                            class="truncate text-[11px] font-bold text-[#D5D8DE]"
                        >
                            {{ selectedScene.label }}
                        </span>
                        <button
                            type="button"
                            aria-label="移除关联分镜"
                            class="grid h-3 w-3 place-items-center text-[#A9AFBA]"
                            @click="props.context.onClearSelectedScene?.()"
                        >
                            <IconGlyph name="x" class-name="h-3 w-3" />
                        </button>
                    </div>
                    <span v-else aria-hidden="true" />
                    <button
                        type="button"
                        aria-label="发送快捷调整"
                        :disabled="!canSubmit"
                        class="grid h-[23px] w-[23px] shrink-0 place-items-center rounded-full bg-[#F05F73] text-white transition-opacity duration-150 disabled:cursor-not-allowed disabled:opacity-45"
                        @click="submit"
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
