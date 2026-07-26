<script setup lang="ts">
import previewImageUrl from '../../assets/editor-preview.png';
import { previewPanel } from '../../constants/editor-screen';
import type { EditorIconName } from '../../types/editor-screen';

import IconGlyph from './IconGlyph.vue';

const previewTools: Array<{ label: string; icon: EditorIconName }> = [
    { label: '预览音量', icon: 'volume' },
    { label: '放大预览', icon: 'maximize' }
];
</script>

<template>
    <section
        class="grid min-h-0 grid-rows-[minmax(0,1fr)_58px] gap-2 border-r border-[#2A2F38] bg-[#101116] p-[16px_16px_8px]"
        aria-label="视频预览"
    >
        <div
            class="relative mx-auto h-full max-h-[567px] min-h-[300px] w-full max-w-[1162px] self-end overflow-hidden rounded-xl bg-[radial-gradient(circle_at_50%_42%,#1A2430_0%,#080B10_58%,#050609_100%)] shadow-[0_4px_12px_rgba(0,0,0,0.35)]"
        >
            <img
                :src="previewImageUrl"
                :alt="previewPanel.imageAlt"
                class="absolute inset-0 h-full w-full object-cover"
            />
        </div>

        <div class="mx-auto w-full max-w-[1162px]">
            <div
                class="grid h-[58px] w-full grid-cols-[1fr_40px_1fr] items-end"
            >
                <span
                    class="font-['Geist_Mono'] text-sm font-semibold text-[#A9AFBA]"
                >
                    {{ previewPanel.timecode }}
                </span>
                <button
                    type="button"
                    aria-label="播放预览"
                    class="grid h-10 w-10 place-items-center rounded-full bg-[#F05F73] text-white"
                >
                    <IconGlyph name="play" class-name="h-6 w-6" />
                </button>
                <div
                    class="flex h-10 w-[88px] items-center justify-end gap-3 justify-self-end"
                >
                    <button
                        v-for="tool in previewTools"
                        :key="tool.label"
                        type="button"
                        :aria-label="tool.label"
                        class="grid h-9 w-9 place-items-center rounded-full bg-[#1A1D22] text-[#A9AFBA]"
                    >
                        <IconGlyph
                            :name="tool.icon"
                            class-name="h-[18px] w-[18px]"
                        />
                    </button>
                </div>
            </div>
        </div>
    </section>
</template>
