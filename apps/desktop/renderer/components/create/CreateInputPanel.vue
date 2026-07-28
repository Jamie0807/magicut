<script setup lang="ts">
import { shallowRef } from 'vue';

import type { CreatePageContent } from '../../types/create';
import IconGlyph from '../editor/IconGlyph.vue';

import CreateModeSwitch from './CreateModeSwitch.vue';
import VoiceSelect from './VoiceSelect.vue';

const props = defineProps<{
    content: CreatePageContent;
}>();

const manuscript = shallowRef('');
const selectedVoice = shallowRef(props.content.voiceOptions[0]?.label ?? '');
</script>

<template>
    <section
        class="relative h-[390px] w-[1340px] max-w-full overflow-visible rounded-[30px] border-2 border-[#3A3945] bg-[#1C1B24DD] shadow-[0_24px_70px_rgba(0,0,0,0.4)]"
    >
        <div class="pointer-events-none absolute inset-0 bg-[#1C1B24]/72" />
        <div class="relative z-10 h-full">
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
            <button
                type="button"
                class="absolute top-[313px] right-[32px] flex h-[45px] w-[106px] items-center justify-center gap-2 rounded-[14px] bg-[linear-gradient(90deg,#B27B8D_0%,#8C3CA7_48%,#2D39A8_100%)] text-[18px] text-[#B8A6D9]"
            >
                <IconGlyph name="sparkles" class-name="h-[21px] w-[21px]" />
                <span>{{ content.actionLabel }}</span>
            </button>
        </div>
    </section>
</template>
