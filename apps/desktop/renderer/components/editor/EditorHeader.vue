<script setup lang="ts">
import { shallowRef, watch } from 'vue';

import { editorHeader } from '../../constants/editor-screen';

import EditorHomeLink from './EditorHomeLink.vue';
import IconGlyph from './IconGlyph.vue';

const props = withDefaults(
    defineProps<{
        status?: string;
        title?: string;
    }>(),
    {
        status: editorHeader.status,
        title: editorHeader.title
    }
);

const emit = defineEmits<{
    titleChange: [title: string];
}>();

const draftTitle = shallowRef(props.title);

const resetDraftTitle = () => {
    draftTitle.value = props.title;
};

const commitDraftTitle = () => {
    const title = draftTitle.value.trim();

    if (!title || title === props.title) {
        resetDraftTitle();
        return;
    }

    emit('titleChange', title);
};

const handleTitleKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
        resetDraftTitle();
        (event.currentTarget as HTMLInputElement | null)?.blur();
    }
};

watch(
    () => props.title,
    (title) => {
        draftTitle.value = title;
    }
);
</script>

<template>
    <header
        class="flex h-20 items-start justify-between border-b border-[#2A2F38] bg-[#111318] px-5 [app-region:drag]"
    >
        <div class="flex w-[230px] items-center gap-3 pt-[30px]">
            <EditorHomeLink
                :href="editorHeader.homeHref"
                :label="editorHeader.homeLabel"
            />
            <div class="grid gap-0.5">
                <div class="text-[15px] font-bold">
                    {{ editorHeader.productName }}
                </div>
                <div class="font-['Geist'] text-[11px] text-[#6F7784]">
                    {{ editorHeader.productDescription }}
                </div>
            </div>
        </div>

        <form
            class="h-10 w-[440px] pt-[18px] text-center"
            @submit.prevent="commitDraftTitle"
        >
            <input
                v-model="draftTitle"
                aria-label="项目标题"
                class="w-full border-0 bg-transparent text-center text-xl leading-5 font-[750] text-[#F5F7FA] outline-none [app-region:no-drag] placeholder:text-[#6F7784] focus-visible:ring-0"
                @blur="commitDraftTitle"
                @keydown="handleTitleKeydown"
            />
            <p class="mt-1 font-['Geist'] text-[11px] text-[#6F7784]">
                {{ status }}
            </p>
        </form>

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
