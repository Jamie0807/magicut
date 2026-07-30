import { describe, expect, it } from 'vitest';
import { createSSRApp, h } from 'vue';

import {
    type MusicClip,
    sampleVideoProject,
    type SubtitleClip,
    type VideoClip,
    type VideoProject,
    type VoiceClip
} from '@magicut/video-project';
import { renderToString } from '@vue/server-renderer';

import TimelinePanel from '../renderer/components/editor/TimelinePanel.vue';
import {
    createEditorScreenData,
    videoProjectToEditor
} from '../renderer/mappers/video-project-to-editor';

const sceneDurationsMs = [
    8000, 12000, 6000, 15000, 9000, 10000, 14000, 7000, 9000
];

const createNineSceneProject = (): VideoProject => {
    const project: VideoProject = structuredClone(sampleVideoProject);
    let cursorMs = 0;

    project.project.id = 'project_9_scenes';
    project.project.title = 'Nine-scene Magicut project';
    project.canvas.durationMs = sceneDurationsMs.reduce(
        (total, durationMs) => total + durationMs,
        0
    );
    project.assets.videos = [];
    project.assets.voices = [];
    project.assets.subtitles = [];
    project.assets.music = [
        {
            durationMs: project.canvas.durationMs,
            id: 'music_asset_001',
            path: 'assets/music/eutopia.mp3',
            title: 'Eutopia'
        }
    ];
    project.assets.thumbnails = [];
    project.scenes = [];

    const videoClips: VideoClip[] = [];
    const voiceClips: VoiceClip[] = [];
    const subtitleClips: SubtitleClip[] = [];
    const musicClips: MusicClip[] = [
        {
            assetId: 'music_asset_001',
            endMs: project.canvas.durationMs,
            fadeInMs: 1200,
            fadeOutMs: 1800,
            id: 'music_clip_001',
            kind: 'music',
            sourceEndMs: project.canvas.durationMs,
            sourceStartMs: 0,
            startMs: 0,
            volume: 0.28
        }
    ];

    sceneDurationsMs.forEach((durationMs, index) => {
        const sceneNumber = String(index + 1).padStart(2, '0');
        const sceneId = `scene_${sceneNumber}`;
        const videoAssetId = `video_asset_${sceneNumber}`;
        const voiceAssetId = `voice_asset_${sceneNumber}`;
        const subtitleAssetIds = [
            `subtitle_asset_${sceneNumber}_01`,
            `subtitle_asset_${sceneNumber}_02`
        ];
        const startMs = cursorMs;
        const endMs = cursorMs + durationMs;
        const midpointMs = startMs + Math.floor(durationMs / 2);

        project.assets.videos.push({
            durationMs,
            fps: 30,
            height: 1080,
            id: videoAssetId,
            path: `assets/videos/scene-${sceneNumber}.mp4`,
            thumbnailIds: [],
            width: 1920
        });
        project.assets.voices.push({
            durationMs,
            id: voiceAssetId,
            path: `assets/voices/scene-${sceneNumber}.mp3`,
            provider: 'volcengine-seed-tts',
            voice: 'zh_female_gaolengyujie_uranus_bigtts'
        });
        subtitleAssetIds.forEach((subtitleId, subtitleIndex) => {
            project.assets.subtitles.push({
                id: subtitleId,
                styleId: 'subtitle_style_default',
                text: `字幕 ${sceneNumber}-${String(subtitleIndex + 1).padStart(2, '0')}`
            });
        });
        project.scenes.push({
            durationMs,
            goal: `Scene ${sceneNumber} goal`,
            id: sceneId,
            index: index + 1,
            matchedVideoAssetIds: [videoAssetId],
            notes: '',
            script: `Scene ${index + 1} narration`,
            subtitleIds: subtitleAssetIds,
            title: `Scene ${sceneNumber}`,
            visualIntent: `Scene ${sceneNumber} visual`,
            voiceAssetId
        });
        videoClips.push({
            assetId: videoAssetId,
            crop: {
                height: 1080,
                width: 1920,
                x: 0,
                y: 0
            },
            endMs,
            id: `video_clip_${sceneNumber}`,
            kind: 'video',
            sceneId,
            sourceEndMs: durationMs,
            sourceStartMs: 0,
            startMs,
            transform: {
                rotation: 0,
                scale: 1,
                x: 0,
                y: 0
            }
        });
        voiceClips.push({
            assetId: voiceAssetId,
            endMs,
            id: `voice_clip_${sceneNumber}`,
            kind: 'voice',
            sceneId,
            startMs,
            voicePreset: 'zh_female_gaolengyujie_uranus_bigtts'
        });
        subtitleClips.push(
            {
                endMs: midpointMs,
                id: `subtitle_clip_${sceneNumber}_01`,
                kind: 'subtitle',
                sceneId,
                startMs,
                styleId: 'subtitle_style_default',
                subtitleId: subtitleAssetIds[0],
                text: `字幕 ${sceneNumber}-01`
            },
            {
                endMs,
                id: `subtitle_clip_${sceneNumber}_02`,
                kind: 'subtitle',
                sceneId,
                startMs: midpointMs,
                styleId: 'subtitle_style_default',
                subtitleId: subtitleAssetIds[1],
                text: `字幕 ${sceneNumber}-02`
            }
        );
        cursorMs = endMs;
    });

    project.tracks = [
        {
            clips: videoClips,
            id: 'track_video_001',
            kind: 'video',
            label: '视频'
        },
        {
            clips: voiceClips,
            id: 'track_voice_001',
            kind: 'voice',
            label: '配音'
        },
        {
            clips: subtitleClips,
            id: 'track_subtitle_001',
            kind: 'subtitle',
            label: '字幕'
        },
        {
            clips: musicClips,
            id: 'track_music_001',
            kind: 'music',
            label: '音乐'
        }
    ];

    return project;
};

describe('videoProjectToEditor', () => {
    it('maps a VideoProject into scene storyboard and four timeline tracks', () => {
        const data = videoProjectToEditor(createNineSceneProject());

        expect(data.storyboard.items).toHaveLength(9);
        expect(data.storyboard.summary.meta).toBe(
            '9 段分镜 · 01:30 · 当前 00:00-00:08'
        );
        expect(data.timeline.tracks.map((track) => track.id)).toEqual([
            'video',
            'voice',
            'subtitle',
            'music'
        ]);
        expect(data.timeline.clipsByTrack.video).toHaveLength(9);
        expect(data.timeline.clipsByTrack.voice).toHaveLength(9);
        expect(data.timeline.clipsByTrack.subtitle).toHaveLength(18);
        expect(data.timeline.clipsByTrack.music).toHaveLength(1);
        expect(data.timeline.clipsByTrack.video[0]).toMatchObject({
            durationSeconds: 8,
            label: '分镜01',
            widthPx: 154
        });
        expect(data.timeline.clipsByTrack.video[3]).toMatchObject({
            durationSeconds: 15,
            label: '分镜04',
            widthPx: 288
        });
        expect(data.timeline.layout.contentMinWidthClassName).toBe(
            'min-w-[1728px] w-[1728px]'
        );
        expect(data.timeline.ticks).toEqual([
            '00:00',
            '00:10',
            '00:20',
            '00:30',
            '00:40',
            '00:50',
            '01:00',
            '01:10',
            '01:20'
        ]);
    });

    it('renders mapped timeline clips through the existing timeline component', async () => {
        const data = videoProjectToEditor(createNineSceneProject());
        const html = await renderToString(
            createSSRApp({
                render: () => h(TimelinePanel, { data: data.timeline })
            })
        );

        expect(html).toContain('data-timeline-track="video"');
        expect(html).toContain('data-timeline-track="voice"');
        expect(html).toContain('data-timeline-track="subtitle"');
        expect(html).toContain('data-timeline-track="music"');
        expect(html.match(/data-timeline-clip-kind="video"/g)).toHaveLength(9);
        expect(html.match(/data-timeline-clip-kind="voice"/g)).toHaveLength(9);
        expect(html.match(/data-timeline-clip-kind="subtitle"/g)).toHaveLength(
            18
        );
        expect(html).toContain('data-width-px="154"');
        expect(html).toContain('data-width-px="288"');
        expect(html).toContain('Eutopia · 全片背景音乐');
    });

    it('falls back to the existing static editor data when no project is loaded', () => {
        const data = createEditorScreenData();

        expect(data.storyboard.items).toHaveLength(9);
        expect(data.timeline.clipsByTrack.video).toHaveLength(9);
        expect(data.timeline.clipsByTrack.music[0]?.label).toBe(
            'Eutopia · 全片背景音乐'
        );
    });
});
