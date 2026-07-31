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
}>();

const emit = defineEmits<{
    submit: [input: CreateAgentSubmitInput];
}>();

const manuscript = shallowRef('');
const sourceAssetDirectory = shallowRef('');
const selectedVoice = shallowRef(props.content.voiceOptions[0]?.label ?? '');

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
            <VoiceSelect
                :label-prefix="content.voiceLabelPrefix"
                :options="content.voiceOptions"
                :value="selectedVoice"
                @change="selectedVoice = $event"
            />
            <label
                class="absolute top-[300px] left-[340px] flex h-[58px] w-[520px] items-center gap-3 rounded-[14px] border border-[#4A4656] bg-[#22232B] px-[14px] transition-colors duration-200 focus-within:border-[#8B6AF7]"
            >
                <span class="shrink-0 text-[16px] font-[850] text-[#D8D5DF]">
                    本地素材目录
                </span>
                <input
                    v-model="sourceAssetDirectory"
                    aria-label="本地素材目录"
                    class="min-w-0 flex-1 bg-transparent text-[15px] font-[700] text-white outline-none placeholder:text-[#777382]"
                    :disabled="disabled"
                    placeholder="粘贴本地视频素材目录"
                />
            </label>
            <button
                type="submit"
                data-agent-start-button="true"
                :disabled="disabled"
                class="absolute top-[313px] right-[32px] flex h-[45px] w-[106px] items-center justify-center gap-2 rounded-[14px] bg-[linear-gradient(90deg,#B27B8D_0%,#8C3CA7_48%,#2D39A8_100%)] text-[18px] text-[#B8A6D9]"
            >
                <IconGlyph name="sparkles" class-name="h-[21px] w-[21px]" />
                <span>{{ content.actionLabel }}</span>
            </button>
        </form>
    </section>
</template>
