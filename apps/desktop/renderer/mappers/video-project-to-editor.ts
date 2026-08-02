import type {
    MusicClip,
    SubtitleClip,
    TimelineClip as ProjectTimelineClip,
    TimelineTrack as ProjectTimelineTrack,
    TimelineTrackKind,
    VideoClip,
    VideoProject,
    VoiceClip
} from '@magicut/video-project';

import { createMediaAssetUrl } from '../../shared/media-protocol';
import {
    storyboardItems,
    storyboardSummary,
    timelineClipsByTrack,
    timelineLayout,
    timelinePanel,
    timelineTicks,
    timelineTracks
} from '../constants/editor-screen';
import type {
    EditorScreenData,
    PreviewData,
    StoryboardData,
    StoryboardItem,
    TimelineClip,
    TimelineData,
    TimelineTrack
} from '../types/editor-screen';

const TIMELINE_PIXELS_PER_SECOND = 19.2;
const TICK_INTERVAL_MS = 10_000;

const clipColorClassNames = {
    music: 'bg-[#263A66] border-[#5E7BFF]/50',
    subtitle: 'bg-[#6B471E] border-white/10',
    video: timelineClipsByTrack.video.map((clip) => clip.colorClassName),
    voice: 'bg-[#245A34] border-white/10'
};

const defaultStoryboardData: StoryboardData = {
    items: storyboardItems,
    summary: storyboardSummary
};

const defaultTimelineData: TimelineData = {
    clipsByTrack: timelineClipsByTrack,
    layout: timelineLayout,
    panel: timelinePanel,
    playhead: {
        currentTimeMs: 0,
        progress: 0
    },
    ticks: timelineTicks,
    tracks: timelineTracks
};

const defaultPreviewData: PreviewData = {
    alt: '当前口播短片的视频预览画面',
    durationMs: 90_000,
    source: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==',
    type: 'image'
};

const sortProjectClips = <Clip extends ProjectTimelineClip>(clips: Clip[]) =>
    [...clips].sort((left, right) => left.startMs - right.startMs);

const formatTwoDigits = (value: number) => String(value).padStart(2, '0');

const formatTimelineTime = (timeMs: number) => {
    const totalSeconds = Math.floor(timeMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${formatTwoDigits(minutes)}:${formatTwoDigits(seconds)}`;
};

const formatTimelineTimeWithHours = (timeMs: number) => {
    const totalSeconds = Math.floor(timeMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${formatTwoDigits(hours)}:${formatTwoDigits(minutes)}:${formatTwoDigits(seconds)}`;
};

const formatDurationSeconds = (durationMs: number) => durationMs / 1000;

const toTimelineWidth = (durationMs: number) =>
    Math.max(
        1,
        Math.round(
            formatDurationSeconds(durationMs) * TIMELINE_PIXELS_PER_SECOND
        )
    );

export const createTimelinePlayhead = ({
    currentTimeMs,
    durationMs
}: {
    currentTimeMs: number;
    durationMs: number;
}): TimelineData['playhead'] => {
    if (durationMs <= 0) {
        return {
            currentTimeMs: 0,
            progress: 0
        };
    }

    const nextCurrentTimeMs = Math.min(Math.max(currentTimeMs, 0), durationMs);

    return {
        currentTimeMs: nextCurrentTimeMs,
        progress: nextCurrentTimeMs / durationMs
    };
};

const hasStoryboardTiming = (
    item: StoryboardItem
): item is StoryboardItem & { endMs: number; startMs: number } =>
    typeof item.startMs === 'number' && typeof item.endMs === 'number';

export const createPlaybackStoryboard = ({
    currentTimeMs,
    storyboard
}: {
    currentTimeMs: number;
    storyboard: StoryboardData;
}): StoryboardData => {
    const timedItems = storyboard.items.filter(hasStoryboardTiming);

    if (timedItems.length === 0) return storyboard;

    const activeItem =
        timedItems.find(
            (item) =>
                currentTimeMs >= item.startMs && currentTimeMs < item.endMs
        ) ?? timedItems[timedItems.length - 1];

    return {
        items: storyboard.items.map((item) => ({
            ...item,
            tone: item === activeItem ? 'current' : 'default'
        })),
        summary: {
            ...storyboard.summary,
            meta: storyboard.summary.meta.replace(
                /当前 .+$/,
                `当前 ${activeItem.time}`
            )
        }
    };
};

const getTrack = (
    tracks: ProjectTimelineTrack[],
    kind: TimelineTrackKind
): ProjectTimelineTrack | undefined =>
    tracks.find((track) => track.kind === kind);

const createTicks = (durationMs: number) => {
    const tickCount = Math.max(1, Math.ceil(durationMs / TICK_INTERVAL_MS));

    return Array.from({ length: tickCount }, (_, index) =>
        formatTimelineTime(index * TICK_INTERVAL_MS)
    );
};

const clipsOverlap = (
    first: Pick<ProjectTimelineClip, 'endMs' | 'startMs'>,
    second: Pick<ProjectTimelineClip, 'endMs' | 'startMs'>
) => first.startMs < second.endMs && second.startMs < first.endMs;

const createTrackMeta = ({
    kind,
    project,
    track
}: {
    kind: TimelineTrackKind;
    project: VideoProject;
    track?: ProjectTimelineTrack;
}) => {
    const clipCount = track?.clips.length ?? 0;

    if (kind === 'video') {
        return `${clipCount} 个分镜`;
    }

    if (kind === 'voice') {
        return `${clipCount} 段旁白`;
    }

    if (kind === 'subtitle') {
        return `${clipCount} 段字幕`;
    }

    const firstMusicClip = track?.clips.find(
        (clip): clip is MusicClip => clip.kind === 'music'
    );
    const musicTitle = project.assets.music.find(
        (asset) => asset.id === firstMusicClip?.assetId
    )?.title;

    return `${musicTitle ?? '背景音乐'} · ${formatTimelineTime(project.canvas.durationMs)}`;
};

const createTracks = (project: VideoProject): TimelineTrack[] => {
    const tracksByKind = {
        music: getTrack(project.tracks, 'music'),
        subtitle: getTrack(project.tracks, 'subtitle'),
        video: getTrack(project.tracks, 'video'),
        voice: getTrack(project.tracks, 'voice')
    };

    return timelineTracks.map((track) => ({
        ...track,
        meta: createTrackMeta({
            kind: track.id,
            project,
            track: tracksByKind[track.id]
        })
    }));
};

const getSceneNumber = ({
    project,
    sceneId
}: {
    project: VideoProject;
    sceneId?: string;
}) => {
    const scene = project.scenes.find((item) => item.id === sceneId);
    const index = scene?.index ?? 0;

    return formatTwoDigits(index || 1);
};

const mapVideoClip = ({
    clip,
    index,
    project
}: {
    clip: VideoClip;
    index: number;
    project: VideoProject;
}): TimelineClip => ({
    colorClassName:
        clipColorClassNames.video[index % clipColorClassNames.video.length] ??
        'bg-[#1F6158] border-[#25D0B1]',
    durationSeconds: formatDurationSeconds(clip.endMs - clip.startMs),
    kind: 'video',
    label: `分镜${getSceneNumber({ project, sceneId: clip.sceneId })}`,
    showThumbnails: true,
    widthPx: toTimelineWidth(clip.endMs - clip.startMs)
});

const mapVoiceClip = ({
    clip,
    hasMultipleSceneVoices,
    project,
    sceneVoiceIndex
}: {
    clip: VoiceClip;
    hasMultipleSceneVoices: boolean;
    project: VideoProject;
    sceneVoiceIndex: number;
}): TimelineClip => {
    const sceneNumber = getSceneNumber({ project, sceneId: clip.sceneId });

    return {
        bars: 12,
        colorClassName: clipColorClassNames.voice,
        durationSeconds: formatDurationSeconds(clip.endMs - clip.startMs),
        kind: 'voice',
        label: hasMultipleSceneVoices
            ? `旁白${sceneNumber}-${formatTwoDigits(sceneVoiceIndex + 1)}`
            : `旁白${sceneNumber}`,
        widthPx: toTimelineWidth(clip.endMs - clip.startMs)
    };
};

const mapSubtitleClip = ({
    clip,
    project,
    sceneSubtitleIndex
}: {
    clip: SubtitleClip;
    project: VideoProject;
    sceneSubtitleIndex: number;
}): TimelineClip => ({
    caption: clip.text,
    colorClassName: clipColorClassNames.subtitle,
    durationSeconds: formatDurationSeconds(clip.endMs - clip.startMs),
    kind: 'subtitle',
    label: `字幕${getSceneNumber({ project, sceneId: clip.sceneId })}-${formatTwoDigits(
        sceneSubtitleIndex + 1
    )}`,
    widthPx: toTimelineWidth(clip.endMs - clip.startMs)
});

const mapMusicClip = ({
    clip,
    project
}: {
    clip: MusicClip;
    project: VideoProject;
}): TimelineClip => {
    const asset = project.assets.music.find((item) => item.id === clip.assetId);

    return {
        bars: 32,
        colorClassName: clipColorClassNames.music,
        durationSeconds: formatDurationSeconds(clip.endMs - clip.startMs),
        kind: 'music',
        label: `${asset?.title ?? '背景音乐'} · 全片背景音乐`,
        widthPx: toTimelineWidth(clip.endMs - clip.startMs)
    };
};

const createClipsByTrack = (
    project: VideoProject
): TimelineData['clipsByTrack'] => {
    const videoTrack = getTrack(project.tracks, 'video');
    const voiceTrack = getTrack(project.tracks, 'voice');
    const subtitleTrack = getTrack(project.tracks, 'subtitle');
    const musicTrack = getTrack(project.tracks, 'music');
    const subtitleCountsByScene = new Map<string, number>();
    const voiceCountsByScene = new Map<string, number>();
    const sortedVoiceClips = sortProjectClips(
        (voiceTrack?.clips ?? []).filter(
            (clip): clip is VoiceClip => clip.kind === 'voice'
        )
    );
    const voiceTotalsByScene = new Map<string, number>();

    sortedVoiceClips.forEach((clip) => {
        const sceneId = clip.sceneId ?? clip.id;
        voiceTotalsByScene.set(
            sceneId,
            (voiceTotalsByScene.get(sceneId) ?? 0) + 1
        );
    });

    return {
        music: sortProjectClips(
            (musicTrack?.clips ?? []).filter(
                (clip): clip is MusicClip => clip.kind === 'music'
            )
        ).map((clip) => mapMusicClip({ clip, project })),
        subtitle: sortProjectClips(
            (subtitleTrack?.clips ?? []).filter(
                (clip): clip is SubtitleClip => clip.kind === 'subtitle'
            )
        ).map((clip) => {
            const sceneId = clip.sceneId ?? clip.id;
            const sceneSubtitleIndex = subtitleCountsByScene.get(sceneId) ?? 0;
            subtitleCountsByScene.set(sceneId, sceneSubtitleIndex + 1);

            return mapSubtitleClip({
                clip,
                project,
                sceneSubtitleIndex
            });
        }),
        video: sortProjectClips(
            (videoTrack?.clips ?? []).filter(
                (clip): clip is VideoClip => clip.kind === 'video'
            )
        ).map((clip, index) => mapVideoClip({ clip, index, project })),
        voice: sortedVoiceClips.map((clip) => {
            const sceneId = clip.sceneId ?? clip.id;
            const sceneVoiceIndex = voiceCountsByScene.get(sceneId) ?? 0;
            voiceCountsByScene.set(sceneId, sceneVoiceIndex + 1);

            return mapVoiceClip({
                clip,
                hasMultipleSceneVoices:
                    (voiceTotalsByScene.get(sceneId) ?? 0) > 1,
                project,
                sceneVoiceIndex
            });
        })
    };
};

const createStoryboard = (project: VideoProject): StoryboardData => {
    const subtitlesById = new Map(
        project.assets.subtitles.map((subtitle) => [subtitle.id, subtitle])
    );
    const scenes = [...project.scenes].sort(
        (left, right) => left.index - right.index
    );
    const firstScene = scenes[0];

    return {
        items: scenes.map((scene, index) => {
            const startMs = scenes
                .slice(0, index)
                .reduce((sum, item) => sum + item.durationMs, 0);
            const endMs = startMs + scene.durationMs;
            const body =
                scene.subtitleIds
                    .map((subtitleId) => subtitlesById.get(subtitleId)?.text)
                    .filter(Boolean)
                    .join('\n') || scene.script;

            return {
                body,
                endMs,
                startMs,
                time: `${formatTimelineTime(startMs)}-${formatTimelineTime(endMs)}`,
                title: `分镜 ${formatTwoDigits(scene.index)}`,
                tone: index === 0 ? 'current' : 'default'
            };
        }),
        summary: {
            meta: `${scenes.length} 段分镜 · ${formatTimelineTime(
                project.canvas.durationMs
            )} · 当前 00:00-${formatTimelineTime(firstScene?.durationMs ?? 0)}`,
            title: storyboardSummary.title
        }
    };
};

const createTimeline = (project: VideoProject): TimelineData => {
    const contentWidthPx = toTimelineWidth(project.canvas.durationMs);

    return {
        clipsByTrack: createClipsByTrack(project),
        layout: {
            ...timelineLayout,
            contentMinWidthClassName: `min-w-[max(100%,${contentWidthPx}px)] w-[${contentWidthPx}px]`,
            contentWidthPx,
            tickWidthPx: toTimelineWidth(TICK_INTERVAL_MS)
        },
        panel: {
            ...timelinePanel,
            timecode: `00:00:00 / ${formatTimelineTimeWithHours(
                project.canvas.durationMs
            )}`
        },
        playhead: createTimelinePlayhead({
            currentTimeMs: 0,
            durationMs: project.canvas.durationMs
        }),
        ticks: createTicks(project.canvas.durationMs),
        tracks: createTracks(project)
    };
};

const createPreview = (project: VideoProject): PreviewData => {
    const videoTrack = getTrack(project.tracks, 'video');
    const voiceTrack = getTrack(project.tracks, 'voice');
    const subtitleTrack = getTrack(project.tracks, 'subtitle');
    const videoClips = sortProjectClips(
        (videoTrack?.clips ?? []).filter(
            (clip): clip is VideoClip => clip.kind === 'video'
        )
    );
    const voiceClips = sortProjectClips(
        (voiceTrack?.clips ?? []).filter(
            (clip): clip is VoiceClip => clip.kind === 'voice'
        )
    );
    const subtitleClips = sortProjectClips(
        (subtitleTrack?.clips ?? []).filter(
            (clip): clip is SubtitleClip => clip.kind === 'subtitle'
        )
    );
    const scenesById = new Map(
        project.scenes.map((scene) => [scene.id, scene])
    );
    const subtitlesById = new Map(
        project.assets.subtitles.map((subtitle) => [subtitle.id, subtitle])
    );
    const projectId = project.project.id;
    const segments = videoClips.flatMap((clip) => {
        const videoAsset = project.assets.videos.find(
            (asset) => asset.id === clip.assetId
        );

        if (!videoAsset) return [];

        const scene = clip.sceneId ? scenesById.get(clip.sceneId) : undefined;
        const thumbnailId = videoAsset.thumbnailIds[0];
        const matchingThumbnail = project.assets.thumbnails.find(
            (thumbnail) => thumbnail.id === thumbnailId
        );
        const matchingVoiceClips = voiceClips.filter((voiceClip) => {
            if (clip.sceneId && voiceClip.sceneId) {
                return clip.sceneId === voiceClip.sceneId;
            }

            return clipsOverlap(clip, voiceClip);
        });
        const voiceCues = matchingVoiceClips.map((voiceClip) => ({
            endMs: voiceClip.endMs,
            id: voiceClip.id,
            source: createMediaAssetUrl({
                assetId: voiceClip.assetId,
                kind: 'voice',
                projectId
            }),
            startMs: voiceClip.startMs
        }));
        const subtitleCues = subtitleClips
            .filter((subtitleClip) => {
                if (clip.sceneId && subtitleClip.sceneId) {
                    return clip.sceneId === subtitleClip.sceneId;
                }

                return clipsOverlap(clip, subtitleClip);
            })
            .map((subtitleClip) => ({
                endMs: subtitleClip.endMs,
                id: subtitleClip.id,
                startMs: subtitleClip.startMs,
                text:
                    subtitlesById.get(subtitleClip.subtitleId)?.text ??
                    subtitleClip.text
            }));

        return [
            {
                alt: `${scene?.title ?? project.project.title} 画面`,
                endMs: clip.endMs,
                id: clip.id,
                posterSource: matchingThumbnail
                    ? createMediaAssetUrl({
                          assetId: matchingThumbnail.id,
                          kind: 'thumbnail',
                          projectId
                      })
                    : undefined,
                source: createMediaAssetUrl({
                    assetId: videoAsset.id,
                    kind: 'video',
                    projectId
                }),
                sourceEndMs: clip.sourceEndMs,
                sourceStartMs: clip.sourceStartMs,
                startMs: clip.startMs,
                subtitleCues,
                voiceCues,
                voiceSource: voiceCues[0]?.source
            }
        ];
    });
    const firstSegment = segments[0];

    if (!firstSegment) {
        return {
            ...defaultPreviewData,
            durationMs: project.canvas.durationMs
        };
    }

    return {
        alt: firstSegment.alt,
        durationMs: project.canvas.durationMs,
        posterSource: firstSegment.posterSource,
        segments,
        source: firstSegment.source,
        type: 'video'
    };
};

export const videoProjectToEditor = (
    project: VideoProject
): EditorScreenData => ({
    preview: createPreview(project),
    storyboard: createStoryboard(project),
    timeline: createTimeline(project)
});

export const createEditorScreenData = (
    project?: VideoProject
): EditorScreenData => {
    if (!project) {
        return {
            preview: defaultPreviewData,
            storyboard: defaultStoryboardData,
            timeline: defaultTimelineData
        };
    }

    return videoProjectToEditor(project);
};
