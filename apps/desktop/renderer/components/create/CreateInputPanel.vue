<script setup lang="ts">
import { shallowRef } from 'vue';

import type {
    CreateAgentSubmitInput,
    CreatePageContent
} from '../../types/create';
import IconGlyph from '../editor/IconGlyph.vue';

import CreateModeSwitch from './CreateModeSwitch.vue';
import VoiceSelect from './VoiceSelect.vue';

const props = defineProps<{
    content: CreatePageContent;
    disabled?: boolean;
    validationErrorMessage?: string;
}>();

const emit = defineEmits<{
    submit: [input: CreateAgentSubmitInput];
}>();

const manuscript = shallowRef('');
const sourceDirectorySelectionError = shallowRef<string | undefined>();
const sourceAssetDirectory = shallowRef('');
const isSelectingSourceDirectory = shallowRef(false);
const selectedVoice = shallowRef(props.content.voiceOptions[0]?.label ?? '');
const sourceDirectoryPlaceholder = '选择本地视频素材目录';

const handleSourceDirectorySelect = async () => {
    if (props.disabled || isSelectingSourceDirectory.value) return;
    if (
        typeof window === 'undefined' ||
        !window.magicutAPI?.fileDialog?.selectSourceDirectory
    ) {
        sourceDirectorySelectionError.value = '目录选择接口尚未就绪';
        return;
    }

    sourceDirectorySelectionError.value = undefined;
    isSelectingSourceDirectory.value = true;

    try {
        const result =
            await window.magicutAPI.fileDialog.selectSourceDirectory();

        if (result.success) {
            sourceAssetDirectory.value = result.data.directoryPath;
            return;
        }

        if (result.error.code !== 'SELECTION_CANCELLED') {
            sourceDirectorySelectionError.value = result.error.message;
        }
    } finally {
        isSelectingSourceDirectory.value = false;
    }
};

const handleSubmit = () => {
    const selectedVoiceOption =
        props.content.voiceOptions.find(
            (option) => option.label === selectedVoice.value
        ) ?? props.content.voiceOptions[0];

    emit('submit', {
        prompt: manuscript.value,
        selectedVoice: selectedVoice.value,
        selectedVoiceType: selectedVoiceOption?.voiceType ?? '',
        sourceAssetDirectory: sourceAssetDirectory.value
    });
};
</script>

<template>
    <section
        class="relative h-[390px] w-[1340px] max-w-full overflow-visible rounded-[30px] border-2 border-[#3A3945] bg-[#1C1B24DD] shadow-[0_24px_70px_rgba(0,0,0,0.4)]"
    >
        <div class="pointer-events-none absolute inset-0 bg-[#1C1B24]/72" />
        <form class="relative z-10 h-full" @submit.prevent="handleSubmit">
            <CreateModeSwitch :modes="content.modes" />
            <textarea
                v-model="manuscript"
                :aria-label="content.placeholder"
                class="absolute top-[122px] left-[34px] h-[110px] w-[calc(100%-68px)] max-w-[960px] resize-none border-none bg-transparent p-0 text-[22px] leading-[1.35] text-[#E5E3EC] outline-none placeholder:text-[#8E8E99]"
                :maxlength="content.maxLength"
                :placeholder="content.placeholder"
            />
            <p
                class="absolute top-[250px] left-[34px] font-['Geist'] text-[22px] text-[#9A99A4]"
            >
                {{ manuscript.length }} / {{ content.maxLength }}
            </p>
            <p
                v-if="validationErrorMessage || sourceDirectorySelectionError"
                role="alert"
                class="absolute top-[255px] left-[220px] max-w-[760px] truncate text-[15px] font-[750] text-[#FF8A8A]"
            >
                {{ validationErrorMessage ?? sourceDirectorySelectionError }}
            </p>
            <div
                data-create-input-actions="true"
                class="absolute top-[300px] left-[42px] grid h-[58px] w-[calc(100%-84px)] grid-cols-[278px_minmax(0,1fr)_156px] items-center gap-4"
            >
                <VoiceSelect
                    :label-prefix="content.voiceLabelPrefix"
                    :options="content.voiceOptions"
                    :value="selectedVoice"
                    @change="selectedVoice = $event"
                />
                <button
                    type="button"
                    data-source-directory-field="true"
                    :aria-label="
                        sourceAssetDirectory || sourceDirectoryPlaceholder
                    "
                    :disabled="disabled || isSelectingSourceDirectory"
                    class="flex h-[58px] min-w-0 items-center gap-3 rounded-[14px] border border-[#4A4656] bg-[#22232B] px-[14px] text-left transition-colors duration-200 hover:border-[#8A77A3] hover:bg-[#292A34] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8B6AF7] disabled:cursor-not-allowed disabled:opacity-55"
                    @click="handleSourceDirectorySelect"
                >
                    <span
                        class="shrink-0 text-[16px] font-[850] text-[#D8D5DF]"
                    >
                        本地素材目录
                    </span>
                    <span
                        class="min-w-0 flex-1 truncate text-[15px] font-[700]"
                        :class="
                            sourceAssetDirectory
                                ? 'text-white'
                                : 'text-[#777382]'
                        "
                    >
                        {{
                            isSelectingSourceDirectory
                                ? '正在选择...'
                                : sourceAssetDirectory ||
                                  sourceDirectoryPlaceholder
                        }}
                    </span>
                </button>
                <button
                    type="submit"
                    data-agent-start-button="true"
                    :disabled="disabled"
                    class="flex h-[58px] w-[156px] items-center justify-center gap-2 whitespace-nowrap rounded-[14px] bg-[linear-gradient(90deg,#B27B8D_0%,#8C3CA7_48%,#2D39A8_100%)] text-[18px] font-[850] text-[#E6D8FF] transition-opacity duration-200 disabled:cursor-not-allowed disabled:opacity-55"
                >
                    <IconGlyph name="sparkles" class-name="h-[21px] w-[21px]" />
                    <span>{{ content.actionLabel }}</span>
                </button>
            </div>
        </form>
    </section>
</template>
