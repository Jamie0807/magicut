import { mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';

import type {
    AssetAnalysis,
    AssetMatchResult,
    CreativeBrief,
    ModelProvider,
    PlannedScene,
    TtsProvider,
    VideoAgentTools,
    VideoCreationInput,
    VoiceSynthesisResult
} from '@magicut/video-agent';
import {
    validateVideoProject,
    type VideoProject
} from '@magicut/video-project';

import { defaultVideoAgentVoice } from '../shared/video-agent-voices';

import type { VideoProjectStore } from './video-project-store';

const supportedVideoExtensions = new Set(['.m4v', '.mov', '.mp4', '.webm']);

type FileSystemEntry = {
    isFile: () => boolean;
    name: string;
};

const createSafeId = (value: string) => {
    const normalized = value.trim().replace(/[^a-zA-Z0-9_-]/g, '_');

    return normalized || 'item';
};

const padIndex = (index: number) => String(index).padStart(3, '0');

const splitSentences = (text: string) => {
    return text
        .split(/[。！？!?；;\n]+/)
        .map((line) => line.trim())
        .filter(Boolean);
};

const takeTitle = (text: string) => {
    const compact = text.trim().replace(/\s+/g, '');

    if (!compact) return 'Magicut 智能视频';

    return compact.slice(0, 18);
};

const createSubtitleLines = (text: string) => {
    const compact = text.trim();

    if (compact.length <= 22) return [compact];

    const lines: string[] = [];

    for (let index = 0; index < compact.length; index += 22) {
        lines.push(compact.slice(index, index + 22));
    }

    return lines;
};

const createSceneScripts = (input: VideoCreationInput) => {
    const sentences = splitSentences(input.prompt);

    if (sentences.length >= 2) return sentences.slice(0, 9);

    const summary = input.prompt.trim();

    return [
        `开场明确主题：${summary}`,
        `展示核心内容：${summary}`,
        `收束行动引导：${summary}`
    ];
};

const createBrief = ({
    assets,
    input
}: {
    assets: AssetAnalysis[];
    input: VideoCreationInput;
}): CreativeBrief => ({
    audience: '短视频创作者',
    keyMessages: [
        '智能分镜',
        assets.length > 0 ? '本地素材匹配' : '视频结构规划',
        '自动生成可编辑时间线'
    ],
    summary: input.prompt.trim(),
    title: takeTitle(input.prompt),
    tone: '专业轻快',
    visualStyle: '清爽科技感'
});

const createProjectScenes = ({
    matches,
    scenes,
    subtitleIdsBySceneId,
    voices
}: {
    matches: AssetMatchResult[];
    scenes: PlannedScene[];
    subtitleIdsBySceneId: Map<string, string[]>;
    voices: VoiceSynthesisResult[];
}): VideoProject['scenes'] => {
    const voiceAssetIdBySceneId = new Map(
        voices.map((voice) => [voice.sceneId, voice.assetId])
    );
    const matchedVideoAssetIdsBySceneId = new Map(
        matches.map((match) => [
            match.sceneId,
            match.rankedAssetIds.map((asset) => asset.assetId)
        ])
    );

    return scenes.map((scene) => ({
        durationMs: scene.durationMs,
        goal: scene.goal,
        id: scene.id,
        index: scene.index,
        matchedVideoAssetIds: matchedVideoAssetIdsBySceneId.get(scene.id) ?? [],
        notes: '由本地 LangGraph runner 生成',
        script: scene.script,
        subtitleIds: subtitleIdsBySceneId.get(scene.id) ?? [],
        title: scene.title,
        visualIntent: scene.visualIntent,
        voiceAssetId:
            voiceAssetIdBySceneId.get(scene.id) ?? `voice_asset_${scene.id}`
    }));
};

export const createDesktopVideoAgentTools = ({
    getSelectedVoice,
    getSelectedVoiceType,
    modelProvider,
    now = () => new Date().toISOString(),
    store,
    ttsProvider,
    voiceOutputDirectory
}: {
    getSelectedVoice?: (runId: string) => string | undefined;
    getSelectedVoiceType?: (runId: string) => string | undefined;
    modelProvider?: ModelProvider;
    now?: () => string;
    store: VideoProjectStore;
    ttsProvider?: TtsProvider;
    voiceOutputDirectory?: string;
}): VideoAgentTools => {
    const assetPaths = new Map<string, string>();
    const resolveTtsSpeaker = (runId: string) =>
        getSelectedVoiceType?.(runId) ?? defaultVideoAgentVoice.voiceType;

    return {
        analyzeAssets: async ({ assets }) => assets,
        assembleTimeline: async ({
            assets,
            brief,
            input,
            matches,
            scenes,
            voices
        }) => {
            const safeRunId = createSafeId(input.runId);
            const createdAt = now();
            const totalDurationMs = scenes.reduce(
                (total, scene) => total + scene.durationMs,
                0
            );
            const assetById = new Map(
                assets.map((asset) => [asset.assetId, asset])
            );
            const usedVideoAssetIds = new Set(
                matches.flatMap((match) =>
                    match.rankedAssetIds.map((asset) => asset.assetId)
                )
            );
            const fallbackAssetIds =
                usedVideoAssetIds.size > 0
                    ? [...usedVideoAssetIds]
                    : assets.map((asset) => asset.assetId);
            const videoAssets = fallbackAssetIds.map((assetId, index) => {
                const asset = assetById.get(assetId);

                return {
                    durationMs: asset?.durationMs ?? 6000,
                    fps: 30,
                    height: 1080,
                    id: assetId,
                    path:
                        assetPaths.get(assetId) ??
                        path.join(input.sourceAssetDirectory, `${assetId}.mp4`),
                    thumbnailIds: [`thumbnail_asset_${padIndex(index + 1)}`],
                    width: 1920
                };
            });
            const thumbnails = videoAssets.map((asset) => ({
                id: asset.thumbnailIds[0] ?? `thumbnail_${asset.id}`,
                path: `assets/thumbnails/${asset.id}.jpg`,
                sourceVideoAssetId: asset.id
            }));
            const subtitleIdsBySceneId = new Map<string, string[]>();
            const subtitleAssets = scenes.flatMap((scene) => {
                const ids: string[] = [];
                const subtitles = scene.subtitleLines.map((line, index) => {
                    const id = `subtitle_asset_${scene.id}_${padIndex(
                        index + 1
                    )}`;
                    ids.push(id);

                    return {
                        id,
                        styleId: 'subtitle_style_default',
                        text: line
                    };
                });

                subtitleIdsBySceneId.set(scene.id, ids);

                return subtitles;
            });
            const projectScenes = createProjectScenes({
                matches,
                scenes,
                subtitleIdsBySceneId,
                voices
            });
            let cursorMs = 0;
            const videoClips = scenes.map((scene, index) => {
                const match = matches.find((item) => item.sceneId === scene.id);
                const assetId =
                    match?.rankedAssetIds[0]?.assetId ??
                    videoAssets[index % videoAssets.length]?.id;
                const sourceDurationMs =
                    assetById.get(assetId ?? '')?.durationMs ??
                    scene.durationMs;
                const startMs = cursorMs;
                const endMs = startMs + scene.durationMs;
                cursorMs = endMs;

                return {
                    assetId: assetId ?? videoAssets[0]!.id,
                    crop: {
                        height: 1080,
                        width: 1920,
                        x: 0,
                        y: 0
                    },
                    endMs,
                    id: `video_clip_${padIndex(index + 1)}`,
                    kind: 'video' as const,
                    sceneId: scene.id,
                    sourceEndMs: Math.max(
                        1,
                        Math.min(sourceDurationMs, scene.durationMs)
                    ),
                    sourceStartMs: 0,
                    startMs,
                    transform: {
                        rotation: 0,
                        scale: 1,
                        x: 0,
                        y: 0
                    }
                };
            });
            cursorMs = 0;
            const voiceClips = scenes.map((scene, index) => {
                const voice = voices.find((item) => item.sceneId === scene.id);
                const startMs = cursorMs;
                const endMs = startMs + scene.durationMs;
                cursorMs = endMs;

                return {
                    assetId: voice?.assetId ?? `voice_asset_${scene.id}`,
                    endMs,
                    id: `voice_clip_${padIndex(index + 1)}`,
                    kind: 'voice' as const,
                    sceneId: scene.id,
                    startMs,
                    voicePreset: getSelectedVoice?.(input.runId) ?? '温婉学姐'
                };
            });
            cursorMs = 0;
            const subtitleClips = scenes.flatMap((scene) => {
                const subtitleIds = subtitleIdsBySceneId.get(scene.id) ?? [];
                const lineDurationMs = Math.max(
                    500,
                    Math.floor(scene.durationMs / subtitleIds.length)
                );
                const sceneStartMs = cursorMs;
                const sceneEndMs = sceneStartMs + scene.durationMs;
                cursorMs = sceneEndMs;

                return subtitleIds.map((subtitleId, index) => ({
                    endMs:
                        index === subtitleIds.length - 1
                            ? sceneEndMs
                            : sceneStartMs + lineDurationMs * (index + 1),
                    id: `subtitle_clip_${scene.id}_${padIndex(index + 1)}`,
                    kind: 'subtitle' as const,
                    sceneId: scene.id,
                    startMs: sceneStartMs + lineDurationMs * index,
                    styleId: 'subtitle_style_default',
                    subtitleId,
                    text:
                        subtitleAssets.find((item) => item.id === subtitleId)
                            ?.text ?? scene.script
                }));
            });
            const musicAssetId = `music_asset_${safeRunId}`;

            return {
                ai: {
                    graphVersion: 'video-creation-agent@0.1.0',
                    provider: 'desktop-langgraph-local-tools',
                    runId: input.runId
                },
                assets: {
                    music: [
                        {
                            durationMs: Math.max(totalDurationMs, 1),
                            id: musicAssetId,
                            path: 'assets/music/internal-preview.mp3',
                            title: 'Internal Preview'
                        }
                    ],
                    subtitles: subtitleAssets,
                    thumbnails,
                    videos: videoAssets,
                    voices: voices.map((voice) => ({
                        durationMs: voice.durationMs,
                        id: voice.assetId,
                        path: voice.path,
                        provider: 'desktop-local-tts',
                        voice: resolveTtsSpeaker(input.runId)
                    }))
                },
                canvas: {
                    durationMs: totalDurationMs,
                    fps: 30,
                    height: 1080,
                    safeArea: {
                        height: 888,
                        width: 1728,
                        x: 96,
                        y: 96
                    },
                    width: 1920
                },
                project: {
                    createdAt,
                    id: `project_${safeRunId}`,
                    sourcePrompt: input.prompt,
                    title: brief.title,
                    updatedAt: createdAt
                },
                render: {
                    format: 'mp4',
                    quality: 'preview'
                },
                scenes: projectScenes,
                schemaVersion: '1.0.0',
                tracks: [
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
                        clips: [
                            {
                                assetId: musicAssetId,
                                endMs: totalDurationMs,
                                fadeInMs: 1200,
                                fadeOutMs: 1800,
                                id: 'music_clip_001',
                                kind: 'music',
                                sourceEndMs: totalDurationMs,
                                sourceStartMs: 0,
                                startMs: 0,
                                volume: 0.28
                            }
                        ],
                        id: 'track_music_001',
                        kind: 'music',
                        label: '音乐'
                    }
                ]
            } satisfies VideoProject;
        },
        generateCreativeBrief: async ({ assets, input }) =>
            modelProvider
                ? modelProvider.generateCreativeBrief({
                      prompt: input.prompt,
                      sourceAssetSummaries: assets.map(
                          (asset) => asset.description
                      )
                  })
                : createBrief({ assets, input }),
        matchAssets: async ({ assets, scenes }) =>
            modelProvider
                ? modelProvider.rankAssetMatches({
                      candidates: assets,
                      scenes
                  })
                : scenes.map((scene, index) => {
                      const asset = assets[index % assets.length]!;

                      return {
                          rankedAssetIds: [
                              {
                                  assetId: asset.assetId,
                                  reason: `按分镜顺序匹配 ${asset.description}`,
                                  score: 0.82
                              }
                          ],
                          sceneId: scene.id
                      };
                  }),
        planScenes: async ({ assets, brief, input }) => {
            if (modelProvider) {
                return modelProvider.planScenes({
                    brief,
                    targetSceneCount: Math.min(Math.max(assets.length, 3), 9)
                });
            }

            const scripts = createSceneScripts(input);

            return scripts.map((script, index) => {
                const sceneIndex = index + 1;
                const id = `scene_${padIndex(sceneIndex)}`;

                return {
                    durationMs:
                        assets[index % Math.max(assets.length, 1)]
                            ?.durationMs ?? 6000,
                    goal:
                        sceneIndex === 1
                            ? '建立主题和观看期待'
                            : '推进视频叙事信息',
                    id,
                    index: sceneIndex,
                    script,
                    subtitleLines: createSubtitleLines(script),
                    title:
                        sceneIndex === 1
                            ? '开场'
                            : `分镜 ${padIndex(sceneIndex)}`,
                    visualIntent: '匹配本地视频素材并保持节奏清晰'
                };
            });
        },
        saveProject: async ({ project }) => {
            const saved = await store.createProject({ project });

            if (saved.success === false) {
                throw new Error(saved.error.message);
            }

            return {
                path: saved.data.filePath,
                project: saved.data.project
            };
        },
        scanAssets: async ({ input }) => {
            let entries: FileSystemEntry[];

            try {
                entries = await readdir(input.sourceAssetDirectory, {
                    withFileTypes: true
                });
            } catch (error) {
                const message =
                    error instanceof Error ? error.message : String(error);

                throw new Error(`无法读取本地素材目录：${message}`);
            }

            const videoEntries = entries
                .filter((entry) => entry.isFile())
                .filter((entry) =>
                    supportedVideoExtensions.has(
                        path.extname(entry.name).toLowerCase()
                    )
                )
                .sort((first, second) => first.name.localeCompare(second.name));

            if (videoEntries.length === 0) {
                throw new Error('本地素材目录中没有找到可用视频文件');
            }

            const safeRunId = createSafeId(input.runId);

            return videoEntries.slice(0, 24).map((entry, index) => {
                const assetId = `video_asset_${safeRunId}_${padIndex(
                    index + 1
                )}`;

                assetPaths.set(
                    assetId,
                    path.join(input.sourceAssetDirectory, entry.name)
                );

                return {
                    assetId,
                    description: `本地视频素材 ${entry.name}`,
                    durationMs: 5000 + (index % 5) * 1500
                };
            });
        },
        synthesizeVoice: async ({ input, scenes }) => {
            const voice = resolveTtsSpeaker(input.runId);

            if (!ttsProvider) {
                return scenes.map((scene, index) => ({
                    assetId: `voice_asset_${scene.id}`,
                    durationMs: scene.durationMs,
                    path: `assets/voices/${input.runId}-${padIndex(index + 1)}.mp3`,
                    sceneId: scene.id
                }));
            }

            return Promise.all(
                scenes.map(async (scene) => {
                    const outputPath = path.join(
                        voiceOutputDirectory ?? input.sourceAssetDirectory,
                        `${createSafeId(input.runId)}-${createSafeId(scene.id)}.mp3`
                    );
                    await mkdir(path.dirname(outputPath), { recursive: true });
                    const result = await ttsProvider.synthesizeSpeech({
                        outputPath,
                        text: scene.script,
                        voice
                    });

                    return {
                        assetId: `voice_asset_${scene.id}`,
                        durationMs: result.durationMs,
                        path: result.path,
                        sceneId: scene.id
                    };
                })
            );
        },
        validateProject: async ({ project }) => {
            const result = validateVideoProject(project);

            if (result.success === false) {
                return {
                    error: result.issues.join('\n'),
                    success: false
                };
            }

            return { success: true };
        }
    };
};
