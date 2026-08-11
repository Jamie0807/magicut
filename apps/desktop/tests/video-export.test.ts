import { readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import {
    type MusicClip,
    sampleVideoProject,
    type SubtitleClip,
    type VideoClip,
    type VideoProject,
    type VoiceClip
} from '@magicut/video-project';

const createTimelineExportProject = (): VideoProject => {
    const project = structuredClone(sampleVideoProject);
    const baseVideoClip = project.tracks[0]?.clips[0] as VideoClip;
    const baseVoiceClip = project.tracks[1]?.clips[0] as VoiceClip;
    const baseSubtitleClip = project.tracks[2]?.clips[0] as SubtitleClip;
    const baseMusicClip = project.tracks[3]?.clips[0] as MusicClip;

    project.canvas.durationMs = 4_000;
    project.scenes = [
        {
            ...project.scenes[0],
            durationMs: 1_000,
            id: 'scene_001',
            index: 1
        },
        {
            ...project.scenes[0],
            durationMs: 3_000,
            id: 'scene_002',
            index: 2,
            title: '第二分镜'
        }
    ];
    project.assets.videos = [
        {
            ...project.assets.videos[0],
            durationMs: 6_000,
            id: 'video_asset_001',
            path: 'assets/videos/scene-01.mp4'
        },
        {
            ...project.assets.videos[0],
            durationMs: 6_000,
            id: 'video_asset_002',
            path: 'assets/videos/scene-02.mp4'
        }
    ];
    project.assets.voices = [
        {
            ...project.assets.voices[0],
            durationMs: 1_000,
            id: 'voice_asset_001',
            path: 'assets/voices/scene-01.mp3'
        },
        {
            ...project.assets.voices[0],
            durationMs: 1_000,
            id: 'voice_asset_002',
            path: 'assets/voices/scene-02.mp3'
        }
    ];
    project.assets.subtitles = [
        {
            ...project.assets.subtitles[0],
            id: 'subtitle_asset_001',
            text: '第一段字幕'
        },
        {
            ...project.assets.subtitles[0],
            id: 'subtitle_asset_002',
            text: '第二段字幕'
        }
    ];
    project.tracks = [
        {
            clips: [
                {
                    ...baseVideoClip,
                    assetId: 'video_asset_001',
                    endMs: 1_000,
                    id: 'video_clip_001',
                    kind: 'video',
                    sceneId: 'scene_001',
                    sourceEndMs: 1_000,
                    sourceStartMs: 0,
                    startMs: 0
                } satisfies VideoClip,
                {
                    ...baseVideoClip,
                    assetId: 'video_asset_002',
                    endMs: 4_000,
                    id: 'video_clip_002',
                    kind: 'video',
                    sceneId: 'scene_002',
                    sourceEndMs: 1_000,
                    sourceStartMs: 0,
                    startMs: 3_000
                } satisfies VideoClip
            ],
            id: 'track_video_001',
            kind: 'video',
            label: '视频'
        },
        {
            clips: [
                {
                    ...baseVoiceClip,
                    assetId: 'voice_asset_001',
                    endMs: 1_000,
                    id: 'voice_clip_001',
                    kind: 'voice',
                    sceneId: 'scene_001',
                    startMs: 0
                } satisfies VoiceClip,
                {
                    ...baseVoiceClip,
                    assetId: 'voice_asset_002',
                    endMs: 4_000,
                    id: 'voice_clip_002',
                    kind: 'voice',
                    sceneId: 'scene_002',
                    startMs: 3_000
                } satisfies VoiceClip
            ],
            id: 'track_voice_001',
            kind: 'voice',
            label: '配音'
        },
        {
            clips: [
                {
                    ...baseSubtitleClip,
                    endMs: 1_000,
                    id: 'subtitle_clip_001',
                    kind: 'subtitle',
                    sceneId: 'scene_001',
                    startMs: 0,
                    subtitleId: 'subtitle_asset_001',
                    text: '第一段字幕'
                } satisfies SubtitleClip,
                {
                    ...baseSubtitleClip,
                    endMs: 4_000,
                    id: 'subtitle_clip_002',
                    kind: 'subtitle',
                    sceneId: 'scene_002',
                    startMs: 3_000,
                    subtitleId: 'subtitle_asset_002',
                    text: '第二段字幕'
                } satisfies SubtitleClip
            ],
            id: 'track_subtitle_001',
            kind: 'subtitle',
            label: '字幕'
        },
        {
            clips: [
                {
                    ...baseMusicClip,
                    endMs: 4_000,
                    sourceEndMs: 4_000,
                    startMs: 0
                }
            ],
            id: 'track_music_001',
            kind: 'music',
            label: '音乐'
        }
    ];

    return project;
};

describe('video export', () => {
    it('resolves bundled ffmpeg binaries for development and packaged apps', async () => {
        const { resolveVideoExportBinaries } = await import(
            '../client/video-export-binaries'
        );

        expect(
            resolveVideoExportBinaries({
                appPath: '/repo/apps/desktop',
                isPackaged: false,
                platform: 'darwin',
                resourcesPath: '/Applications/Magicut.app/Contents/Resources'
            })
        ).toEqual({
            ffmpegPath: '/repo/apps/desktop/bin/darwin/ffmpeg',
            ffprobePath: '/repo/apps/desktop/bin/darwin/ffprobe'
        });

        expect(
            resolveVideoExportBinaries({
                appPath: 'C:/repo/apps/desktop',
                isPackaged: true,
                platform: 'win32',
                resourcesPath: 'C:/Program Files/Magicut/resources'
            })
        ).toEqual({
            ffmpegPath:
                'C:/Program Files/Magicut/resources/bin/win32/ffmpeg.exe',
            ffprobePath:
                'C:/Program Files/Magicut/resources/bin/win32/ffprobe.exe'
        });
    });

    it('builds an ffmpeg command that composites video, voice, subtitles, and bundled music', async () => {
        const { createVideoExportFfmpegCommand, resolveBundledMusicFilePath } =
            await import('../client/video-export-ffmpeg');
        const project = structuredClone(sampleVideoProject);
        const command = createVideoExportFfmpegCommand({
            bundledMusicPath: resolveBundledMusicFilePath({
                appPath: '/repo/apps/desktop',
                isPackaged: false,
                resourcesPath: '/Applications/Magicut.app/Contents/Resources',
                selectedTrackId: 'song_08'
            }),
            ffmpegPath: '/repo/apps/desktop/bin/darwin/ffmpeg',
            musicSettings: {
                enabled: true,
                selectedTrackId: 'song_08',
                volume: 0.35
            },
            outputPath: '/Users/jamie/Downloads/export.mp4',
            project,
            subtitleSettings: {
                fontSizePx: 24,
                isVisible: true,
                outlineColor: '#000000',
                presetLabel: '白字黑边',
                textColor: '#FFFFFF'
            },
            subtitleSrtPath: '/tmp/magicut-export/subtitles.srt'
        });

        expect(command.args).toEqual(
            expect.arrayContaining([
                '-i',
                'assets/videos/scene-01.mp4',
                '-i',
                'assets/voices/scene-01.mp3',
                '-stream_loop',
                '-1',
                '-i',
                '/repo/apps/desktop/renderer/assets/song/Paris 悬疑电影解说.m4a',
                '-map',
                '[vout]',
                '-map',
                '[aout]',
                '-c:v',
                'libx264',
                '-movflags',
                '+faststart',
                '/Users/jamie/Downloads/export.mp4'
            ])
        );
        expect(command.filterComplex).toContain('concat=n=1:v=1:a=0');
        expect(command.filterComplex).toContain('tpad=stop_mode=clone');
        expect(command.filterComplex).toContain('subtitles=');
        expect(command.filterComplex).toContain('FontName=PingFang SC');
        expect(command.filterComplex).toContain('FontSize=24');
        expect(command.filterComplex).toContain('Outline=1.5');
        expect(command.filterComplex).toContain('volume=0.35');
        expect(command.filterComplex).toContain('amix=inputs=2');
        expect(command.args).toContain('-t');
        expect(command.args).toContain('8');
    });

    it('preserves timeline gaps and clips voice/music to the project duration', async () => {
        const { createVideoExportFfmpegCommand } = await import(
            '../client/video-export-ffmpeg'
        );
        const project = createTimelineExportProject();
        const command = createVideoExportFfmpegCommand({
            bundledMusicPath:
                '/repo/apps/desktop/renderer/assets/song/Eutopia.m4a',
            ffmpegPath: '/repo/apps/desktop/bin/darwin/ffmpeg',
            musicSettings: {
                enabled: true,
                selectedTrackId: 'song_01',
                volume: 0.42
            },
            outputPath: '/Users/jamie/Downloads/export.mp4',
            project
        });

        expect(command.filterComplex).toContain(
            'color=c=black:s=1920x1080:r=30:d=2[vgap0]'
        );
        expect(command.filterComplex).toContain(
            '[v0][vgap0][v1]concat=n=3:v=1:a=0[vconcat]'
        );
        expect(command.filterComplex).toContain(
            'anullsrc=channel_layout=stereo:sample_rate=48000,atrim=duration=2,asetpts=PTS-STARTPTS[voicegap0]'
        );
        expect(command.filterComplex).toContain(
            '[voice0][voicegap0][voice1]concat=n=3:v=0:a=1[voiceTimeline]'
        );
        expect(command.filterComplex).toContain(
            'atrim=duration=4,asetpts=PTS-STARTPTS,volume=0.42'
        );
        expect(command.filterComplex).toContain(
            '[voiceTimeline][music0]amix=inputs=2:duration=longest:normalize=0,atrim=duration=4'
        );
    });

    it('writes scene-relative subtitle clips with global timestamps', async () => {
        const { writeVideoExportSubtitleSrt } = await import(
            '../client/video-export-ffmpeg'
        );
        const project = createTimelineExportProject();
        const subtitleTrack = project.tracks.find(
            (track) => track.kind === 'subtitle'
        );
        const outputPath = path.join(
            tmpdir(),
            `magicut-relative-subtitles-${Date.now()}.srt`
        );

        if (!subtitleTrack) throw new Error('missing subtitle track');

        project.scenes[0]!.durationMs = 3_000;
        project.scenes[1]!.durationMs = 1_000;
        subtitleTrack.clips = subtitleTrack.clips.map((clip) =>
            clip.id === 'subtitle_clip_002'
                ? {
                      ...clip,
                      endMs: 1_000,
                      startMs: 0
                  }
                : clip
        );

        await writeVideoExportSubtitleSrt({
            outputPath,
            project
        });

        const content = await readFile(outputPath, 'utf8');

        expect(content).toContain('00:00:03,000 --> 00:00:04,000');
        expect(content).toContain('第二段字幕');
    });

    it('exposes export through main ipc and preload contracts', async () => {
        const { registerVideoExportIpc, videoExportIpcChannels } = await import(
            '../client/video-export-ipc'
        );
        const preloadSource = await readFile(
            path.resolve(__dirname, '../client/preload.ts'),
            'utf8'
        );
        const envTypesSource = await readFile(
            path.resolve(__dirname, '../magicut.env.d.ts'),
            'utf8'
        );
        const handlers = new Map<string, (...args: never[]) => unknown>();
        const ipcMain = {
            handle: (
                channel: string,
                handler: (...args: never[]) => unknown
            ) => {
                handlers.set(channel, handler);
            }
        };

        registerVideoExportIpc({
            createRenderer: () => async () => ({
                data: {
                    outputPath: '/Users/jamie/Downloads/export.mp4'
                },
                success: true
            }),
            ipcMain,
            selectOutputPath: async () => ({
                data: {
                    outputPath: '/Users/jamie/Downloads/export.mp4'
                },
                success: true
            })
        });

        expect(videoExportIpcChannels.render).toBe('videoExport:render');
        expect(videoExportIpcChannels.progress).toBe('videoExport:progress');
        expect(videoExportIpcChannels.selectOutputPath).toBe(
            'videoExport:selectOutputPath'
        );
        expect(handlers.has(videoExportIpcChannels.render)).toBe(true);
        expect(handlers.has(videoExportIpcChannels.selectOutputPath)).toBe(
            true
        );
        expect(preloadSource).toContain('videoExportIpcChannels.render');
        expect(preloadSource).toContain('videoExportIpcChannels.progress');
        expect(preloadSource).toContain(
            'videoExportIpcChannels.selectOutputPath'
        );
        expect(preloadSource).toContain('onProgress:');
        expect(preloadSource).toContain('selectOutputPath:');
        expect(preloadSource).toContain('videoExport: {');
        expect(envTypesSource).toContain('videoExport: {');
        expect(envTypesSource).toContain('render: (');
        expect(envTypesSource).toContain('onProgress: (');
        expect(envTypesSource).toContain('selectOutputPath: (');
    });

    it('reports export progress while ffmpeg renders', async () => {
        const { createVideoExportRenderer } = await import(
            '../client/video-export-service'
        );
        const events: unknown[] = [];
        const render = createVideoExportRenderer({
            app: {
                getAppPath: () => path.resolve(__dirname, '..'),
                getPath: () => tmpdir(),
                isPackaged: false
            },
            dialog: {
                showSaveDialog: async () => ({
                    canceled: false,
                    filePath: path.join(tmpdir(), 'magicut-export.mp4')
                })
            },
            emitProgress: (event) => events.push(event),
            runFfmpeg: async ({ onProgress }) => {
                onProgress?.({ percent: 50, rawTimeMs: 2_000 });
            }
        });

        await render({
            outputPath: path.join(tmpdir(), 'magicut-export.mp4'),
            project: sampleVideoProject
        });

        expect(events).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    percent: 5,
                    phase: 'preparing'
                }),
                expect.objectContaining({
                    percent: 50,
                    phase: 'rendering'
                }),
                expect.objectContaining({
                    percent: 100,
                    phase: 'completed'
                })
            ])
        );
    });

    it('packages ffmpeg resources outside the asar archive', async () => {
        const forgeSource = await readFile(
            path.resolve(__dirname, '../forge.config.ts'),
            'utf8'
        );

        expect(forgeSource).toContain('extraResource');
        expect(forgeSource).toContain("'bin'");
        expect(forgeSource).toContain("'renderer/assets/song'");
        expect(forgeSource).toContain("['darwin', 'win32']");
        expect(forgeSource).toContain('prune: false');
    });
});
