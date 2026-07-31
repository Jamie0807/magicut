<script setup lang="ts">
import { nextTick, onUnmounted, shallowRef, watch } from 'vue';

import type { WorkspaceProject } from '../../types/workspace';
import IconGlyph from '../editor/IconGlyph.vue';

const props = withDefaults(
    defineProps<{
        errorMessage?: string;
        isDeleting?: boolean;
        project?: WorkspaceProject;
    }>(),
    {
        errorMessage: undefined,
        isDeleting: false,
        project: undefined
    }
);

const emit = defineEmits<{
    cancel: [];
    confirm: [];
}>();

const cancelButtonRef = shallowRef<HTMLButtonElement | null>(null);
const previousActiveElement = shallowRef<HTMLElement | null>(null);

const focusCancelButton = async () => {
    await nextTick();
    cancelButtonRef.value?.focus();
};

const restorePreviousFocus = () => {
    previousActiveElement.value?.focus();
    previousActiveElement.value = null;
};

const requestCancel = () => {
    if (props.isDeleting) return;

    emit('cancel');
};

const handleDialogKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape' || props.isDeleting) return;

    event.stopPropagation();
    requestCancel();
};

watch(
    () => props.project?.id,
    (projectId, previousProjectId) => {
        if (!projectId) {
            if (previousProjectId) restorePreviousFocus();
            return;
        }

        previousActiveElement.value =
            typeof document !== 'undefined' &&
            document.activeElement instanceof HTMLElement
                ? document.activeElement
                : null;
        void focusCancelButton();
    }
);

onUnmounted(() => {
    restorePreviousFocus();
});
</script>

<template>
    <div
        v-if="project"
        class="fixed inset-0 z-[80] flex items-center justify-center bg-[#05060A]/72 px-6 backdrop-blur-[18px]"
        @click="requestCancel"
    >
        <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="project-delete-title"
            aria-describedby="project-delete-description"
            class="w-full max-w-[420px] rounded-[22px] border border-white/12 bg-[#181A20]/95 p-6 text-[#F5F7FA] shadow-[0_28px_90px_rgba(0,0,0,0.46)]"
            @click.stop
            @keydown="handleDialogKeyDown"
        >
            <div class="flex items-start justify-between gap-4">
                <div
                    class="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#FF4D6D]/14 text-[#FF8A9B]"
                >
                    <IconGlyph name="trash-2" class-name="h-5 w-5" />
                </div>
                <button
                    type="button"
                    aria-label="关闭删除确认"
                    class="grid h-8 w-8 place-items-center rounded-full text-[#858B96] transition-colors duration-200 hover:bg-white/8 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B497CF]"
                    :disabled="isDeleting"
                    @click="requestCancel"
                >
                    <IconGlyph name="x" class-name="h-4 w-4" />
                </button>
            </div>

            <div class="mt-5">
                <h2
                    id="project-delete-title"
                    class="text-[20px] leading-tight font-[900] text-white"
                >
                    确认删除项目
                </h2>
                <p
                    id="project-delete-description"
                    class="mt-3 text-[13px] leading-[1.7] font-[650] text-[#AEB4BF]"
                >
                    删除后将从项目列表移除，且无法恢复。请确认是否删除
                    <span class="text-[#F5F7FA]">「{{ project.title }}」</span>
                    。
                </p>
            </div>

            <p
                v-if="errorMessage"
                role="alert"
                class="mt-4 rounded-[12px] border border-[#FF4D6D]/22 bg-[#FF4D6D]/10 px-3 py-2 text-[12px] leading-[1.6] font-[700] text-[#FF9BAD]"
            >
                {{ errorMessage }}
            </p>

            <div class="mt-6 flex items-center justify-end gap-3">
                <button
                    ref="cancelButtonRef"
                    type="button"
                    class="h-10 rounded-full border border-white/10 px-5 text-[13px] font-[800] text-[#CBD1DA] transition-colors duration-200 hover:border-white/18 hover:bg-white/8 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B497CF]"
                    :disabled="isDeleting"
                    @click="requestCancel"
                >
                    取消
                </button>
                <button
                    type="button"
                    class="inline-flex h-10 items-center gap-2 rounded-full bg-[#FF4D6D] px-5 text-[13px] font-[900] text-white shadow-[0_12px_30px_rgba(255,77,109,0.26)] transition-colors duration-200 hover:bg-[#FF6681] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFD1DA] disabled:cursor-not-allowed disabled:opacity-70"
                    :disabled="isDeleting"
                    @click="emit('confirm')"
                >
                    <IconGlyph name="trash-2" class-name="h-4 w-4" />
                    {{ isDeleting ? '删除中...' : '确认删除' }}
                </button>
            </div>
        </section>
    </div>
</template>
