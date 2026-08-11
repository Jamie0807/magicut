<script setup lang="ts">
import { computed, shallowRef, useId, useTemplateRef, watch } from 'vue';

import type { CreateVoiceOption } from '../../types/create';
import IconGlyph from '../editor/IconGlyph.vue';

const props = withDefaults(
    defineProps<{
        defaultOpen?: boolean;
        labelPrefix: string;
        options: CreateVoiceOption[];
        value: string;
    }>(),
    {
        defaultOpen: false
    }
);

const emit = defineEmits<{
    change: [value: string];
}>();

const isOpen = shallowRef(props.defaultOpen);
const containerRef = useTemplateRef<HTMLElement>('container');
const listboxId = useId();

const selectedOption = computed(
    () =>
        props.options.find((option) => option.label === props.value) ??
        props.options[0]
);

const isSelected = (option: CreateVoiceOption) =>
    option.label === selectedOption.value?.label;

const selectVoice = (value: string) => {
    emit('change', value);
    isOpen.value = false;
};

watch(isOpen, (open, _previous, onCleanup) => {
    if (!open || typeof document === 'undefined') return;

    const handlePointerDown = (event: PointerEvent) => {
        if (
            event.target instanceof Node &&
            !containerRef.value?.contains(event.target)
        ) {
            isOpen.value = false;
        }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
            isOpen.value = false;
        }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    onCleanup(() => {
        document.removeEventListener('pointerdown', handlePointerDown);
        document.removeEventListener('keydown', handleKeyDown);
    });
});
</script>

<template>
    <div ref="container" class="relative">
        <button
            type="button"
            :aria-controls="listboxId"
            :aria-expanded="isOpen"
            aria-haspopup="listbox"
            :aria-label="labelPrefix"
            class="create-voice-select-trigger flex h-[58px] w-[278px] items-center justify-between gap-2.5 rounded-[14px] border border-[#6B5B80] bg-[#26262E] px-[14px] text-left text-[18px] transition-all duration-200 hover:border-[#8A77A3] hover:bg-[#2C2B35] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8B6AF7]"
            @click="isOpen = !isOpen"
        >
            <span class="flex min-w-0 items-center gap-2">
                <span class="shrink-0 font-[800] text-[#D8D5DF]">
                    {{ labelPrefix }}
                </span>
                <span class="truncate font-[850] text-white">
                    {{ selectedOption?.label }}
                </span>
            </span>
            <IconGlyph
                :name="isOpen ? 'chevron-up' : 'chevron-down'"
                class-name="h-4 w-4 shrink-0 text-[#B8B2C6]"
            />
        </button>

        <div
            v-if="isOpen"
            :id="listboxId"
            role="listbox"
            :aria-label="labelPrefix"
            class="absolute top-[68px] left-0 z-30 grid h-[202px] w-[278px] gap-[6px] rounded-[16px] border border-[#3B3948] bg-[#1E1E27F2] p-2 shadow-[0_18px_42px_rgba(0,0,0,0.38)] backdrop-blur-[18px]"
        >
            <button
                v-for="option in options"
                :key="option.label"
                type="button"
                role="option"
                :aria-selected="isSelected(option)"
                :class="[
                    'flex h-[42px] w-full items-center justify-between gap-2.5 rounded-[11px] px-3 text-left transition-all duration-200',
                    isSelected(option)
                        ? 'bg-[linear-gradient(90deg,#8B6AF7_0%,#BF40FF_55%,#F05F73_100%)] text-white shadow-[0_8px_18px_rgba(139,106,247,0.22)]'
                        : 'bg-[#252530] text-[#E6E4EC] hover:bg-[#30303B]'
                ]"
                @click="selectVoice(option.label)"
            >
                <span class="grid min-w-0 gap-[3px]">
                    <span
                        :class="[
                            'truncate text-[14px] font-[850]',
                            !isSelected(option) && 'font-[800]'
                        ]"
                    >
                        {{ option.label }}
                    </span>
                    <span
                        :class="[
                            'truncate text-[10px] font-[650]',
                            isSelected(option)
                                ? 'text-white/70'
                                : 'text-[#8E8B99]'
                        ]"
                    >
                        {{ option.description }}
                    </span>
                </span>
                <IconGlyph
                    v-if="isSelected(option)"
                    name="check"
                    class-name="h-4 w-4 shrink-0 text-white"
                />
                <span v-else class="h-4 w-4 shrink-0" />
            </button>
        </div>
    </div>
</template>
