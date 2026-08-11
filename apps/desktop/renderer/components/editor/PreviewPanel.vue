<script setup lang="ts">
import { computed, useTemplateRef, watch } from 'vue';

import previewImageUrl from '../../assets/editor-preview.png';
import { previewPanel } from '../../constants/editor-screen';
import type {
    EditorIconName,
    PreviewData,
    PreviewSegment,
    PreviewSubtitleCue,
    PreviewVoiceCue
} from '../../types/editor-screen';
import {
    getPreviewSegmentLocalTimeMs,
    isPreviewSegmentSourceExhausted
} from '../../utils/previewPlayback';
import IconGlyph from './IconGlyph.vue';

const previewTools: Array<{ label: string; icon: EditorIconName }> = [
    { label: '预览音量', icon: 'volume' },
    { label: '放大预览', icon: 'maximize' }
];

const props = withDefaults(
    defineProps<{
        currentTimeMs?: number;
        data?: PreviewData;
        isPlaying?: boolean;
        previewVolume?: number;
    }>(),
    {
        currentTimeMs: 0,
        data: () => ({
            alt: previewPanel.imageAlt,
            durationMs: 90_000,
            source: previewImageUrl,
            type: 'image'
        }),
        isPlaying: false,
        previewVolume: 0.82
    }
);

const emit = defineEmits<{
    togglePlayback: [];
}>();

const audioRef = useTemplateRef<HTMLAudioElement>('audioRef');
const videoRef = useTemplateRef<HTMLVideoElement>('videoRef');

const formatTwoDigits = (value: number) => String(value).padStart(2, '0');

const formatPreviewTimecode = ({
    currentTimeMs,
    durationMs
}: {
    currentTimeMs: number;
    durationMs: number;
}) => {
    const formatTime = (timeMs: number) => {
        const totalSeconds = Math.floor(timeMs / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        return `${formatTwoDigits(hours)}:${formatTwoDigits(minutes)}:${formatTwoDigits(seconds)}`;
    };

    return `${formatTime(currentTimeMs)} / ${formatTime(durationMs)}`;
};

const findActivePreviewSegment = ({
    currentTimeMs,
    segments
}: {
    currentTimeMs: number;
    segments: PreviewSegment[];
}) =>
    segments.find(
        (segment) =>
            currentTimeMs >= segment.startMs && currentTimeMs < segment.endMs
    ) ?? segments[segments.length - 1];

const findActiveSubtitleCue = ({
    currentTimeMs,
    segment
}: {
    currentTimeMs: number;
    segment?: PreviewSegment;
}): PreviewSubtitleCue | undefined =>
    segment?.subtitleCues.find(
        (cue) => currentTimeMs >= cue.startMs && currentTimeMs < cue.endMs
    );

const findActiveVoiceCue = ({
    currentTimeMs,
    segment
}: {
    currentTimeMs: number;
    segment?: PreviewSegment;
}): PreviewVoiceCue | undefined =>
    segment?.voiceCues?.find(
        (cue) => currentTimeMs >= cue.startMs && currentTimeMs < cue.endMs
    );

const syncMediaCurrentTime = ({
    element,
    force = false,
    timeMs
}: {
    element: HTMLMediaElement | null;
    force?: boolean;
    timeMs: number;
}) => {
    if (!element) return;

    const nextCurrentTime = timeMs / 1000;

    if (force || Math.abs(element.currentTime - nextCurrentTime) > 0.3) {
        element.currentTime = nextCurrentTime;
    }
};

const activeSegment = computed(() =>
    props.data.type === 'video'
        ? findActivePreviewSegment({
              currentTimeMs: props.currentTimeMs,
              segments: props.data.segments
          })
        : undefined
);
const activeSubtitle = computed(() =>
    findActiveSubtitleCue({
        currentTimeMs: props.currentTimeMs,
        segment: activeSegment.value
    })
);
const activeVoiceCue = computed(() =>
    findActiveVoiceCue({
        currentTimeMs: props.currentTimeMs,
        segment: activeSegment.value
    })
);
const activeVideoPlaybackRate = computed(
    () => activeSegment.value?.playbackRate ?? 1
);
const activeVoicePlaybackRate = computed(
    () => activeVoiceCue.value?.playbackRate ?? 1
);
const activeVoiceVolume = computed(
    () => activeVoiceCue.value?.volume ?? props.previewVolume
);
const mediaSource = computed(() =>
    props.data.type === 'video'
        ? (activeSegment.value?.source ?? props.data.source)
        : props.data.source
);
const posterSource = computed(() =>
    props.data.type === 'video'
        ? (activeSegment.value?.posterSource ?? props.data.posterSource)
        : undefined
);
const voiceSource = computed(
    () => activeVoiceCue.value?.source ?? activeSegment.value?.voiceSource
);
const voicePlaybackKey = computed(() =>
    voiceSource.value
        ? `${voiceSource.value}:${activeVoiceCue.value?.id ?? 'segment'}:${activeVoicePlaybackRate.value}`
        : undefined
);
const localTimeMs = computed(() =>
    getPreviewSegmentLocalTimeMs({
        currentTimeMs: props.currentTimeMs,
        segment: activeSegment.value
    })
);
const voiceLocalTimeMs = computed(() =>
    activeVoiceCue.value
        ? Math.max(0, props.currentTimeMs - activeVoiceCue.value.startMs)
        : localTimeMs.value
);
const isVideoSourceExhausted = computed(() =>
    isPreviewSegmentSourceExhausted({
        currentTimeMs: props.currentTimeMs,
        segment: activeSegment.value
    })
);
const timecode = computed(() =>
    formatPreviewTimecode({
        currentTimeMs: props.currentTimeMs,
        durationMs: props.data.durationMs
    })
);

const handleVideoLoadedMetadata = (event: Event) => {
    const element = event.currentTarget as HTMLMediaElement;

    element.playbackRate = activeVideoPlaybackRate.value;
    syncMediaCurrentTime({
        element,
        timeMs: localTimeMs.value
    });
};

const handleAudioLoadedMetadata = (event: Event) => {
    const element = event.currentTarget as HTMLMediaElement;

    element.playbackRate = activeVoicePlaybackRate.value;
    element.volume = activeVoiceVolume.value;
    syncMediaCurrentTime({
        element,
        timeMs: voiceLocalTimeMs.value
    });
};

watch(
    [
        activeVideoPlaybackRate,
        activeVoicePlaybackRate,
        activeVoiceVolume,
        localTimeMs,
        mediaSource,
        voiceLocalTimeMs,
        voiceSource
    ],
    () => {
        if (videoRef.value) {
            videoRef.value.playbackRate = activeVideoPlaybackRate.value;
        }

        if (audioRef.value) {
            audioRef.value.playbackRate = activeVoicePlaybackRate.value;
            audioRef.value.volume = activeVoiceVolume.value;
        }

        syncMediaCurrentTime({
            element: videoRef.value,
            timeMs: localTimeMs.value
        });
        syncMediaCurrentTime({
            element: audioRef.value,
            timeMs: voiceLocalTimeMs.value
        });
    },
    { flush: 'post' }
);

watch(
    () =>
        [
            props.isPlaying,
            isVideoSourceExhausted.value,
            localTimeMs.value,
            mediaSource.value,
            voiceSource.value
        ] as const,
    () => {
        const video = videoRef.value;
        const audio = audioRef.value;

        if (props.isPlaying && !isVideoSourceExhausted.value) {
            void video?.play().catch((): void => undefined);
            void audio?.play().catch((): void => undefined);
            return;
        }

        video?.pause();

        syncMediaCurrentTime({
            element: video,
            force: true,
            timeMs: localTimeMs.value
        });

        if (props.isPlaying) {
            void audio?.play().catch((): void => undefined);
            return;
        }

        audio?.pause();
    },
    { flush: 'post' }
);
</script>

<template>
    <section
        class="grid min-h-0 grid-rows-[minmax(0,1fr)_58px] gap-2 border-r border-[#2A2F38] bg-[#101116] p-[16px_16px_8px]"
        aria-label="视频预览"
    >
        <div
            class="relative mx-auto h-full max-h-[567px] min-h-[300px] w-full max-w-[1162px] self-end overflow-hidden rounded-xl bg-[radial-gradient(circle_at_50%_42%,#1A2430_0%,#080B10_58%,#050609_100%)] shadow-[0_4px_12px_rgba(0,0,0,0.35)]"
        >
            <template v-if="data.type === 'video'">
                <video
                    ref="videoRef"
                    :key="mediaSource"
                    data-preview-source="project-video"
                    :data-preview-video-playback-rate="activeVideoPlaybackRate"
                    :src="mediaSource"
                    :poster="posterSource"
                    :aria-label="activeSegment?.alt ?? data.alt"
                    class="absolute inset-0 h-full w-full object-cover"
                    muted
                    playsinline
                    preload="metadata"
                    @loadedmetadata="handleVideoLoadedMetadata"
                />
                <audio
                    v-if="voiceSource"
                    ref="audioRef"
                    :key="voicePlaybackKey"
                    :data-preview-voice-key="voicePlaybackKey"
                    :data-preview-voice-playback-rate="activeVoicePlaybackRate"
                    :data-preview-voice-volume="activeVoiceVolume"
                    :src="voiceSource"
                    preload="metadata"
                    @loadedmetadata="handleAudioLoadedMetadata"
                />
                <p
                    v-if="activeSubtitle"
                    data-preview-subtitle="true"
                    class="absolute bottom-[50px] left-1/2 max-w-[86%] -translate-x-1/2 rounded bg-black/45 px-3 py-1 text-center text-[18px] leading-[1.45] font-semibold text-white shadow-[0_4px_12px_rgba(0,0,0,0.35)]"
                >
                    {{ activeSubtitle.text }}
                </p>
            </template>
            <img
                v-else
                data-preview-source="fallback-image"
                :src="mediaSource"
                :alt="data.alt"
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
                    {{ timecode }}
                </span>
                <button
                    type="button"
                    :aria-label="isPlaying ? '暂停预览' : '播放预览'"
                    class="grid h-10 w-10 place-items-center rounded-full bg-[#F05F73] text-white"
                    @click="emit('togglePlayback')"
                >
                    <IconGlyph
                        :name="isPlaying ? 'pause' : 'play'"
                        class-name="h-6 w-6"
                    />
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
