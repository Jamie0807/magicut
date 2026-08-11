import { readFileSync } from 'node:fs';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path, { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { sampleVideoProject, type VideoProject } from '@magicut/video-project';

describe('create agent flow', () => {
    it('creates spoken fallback scripts instead of storyboard planning labels', async () => {
        const { createDesktopVideoAgentTools } = await import(
            '../client/video-agent-tools'
        );
        const tools = createDesktopVideoAgentTools({ store: {} as never });
        const scenes = await tools.planScenes({
            assets: [
                {
                    assetId: 'video_asset_001',
                    description: '产品界面录屏',
                    durationMs: 5000
                }
            ],
            brief: {
                audience: '短视频创作者',
                keyMessages: ['智能剪辑'],
                summary: '介绍 Magicut 智能剪辑',
                title: 'Magicut',
                tone: '清晰自然',
                visualStyle: '产品录屏'
            },
            input: {
                prompt: '帮我介绍 Magicut 智能剪辑',
                runId: 'run_fallback_script',
                sourceAssetDirectory: '/tmp/magicut-assets'
            }
        });
        const scriptText = scenes
            .flatMap((scene) => scene.subtitleLines)
            .join('\n');

        expect(scriptText).not.toMatch(
            /开场明确主题|展示核心内容|收束行动引导|[：:]/
        );
        expect(
            scenes.every(
                (scene) => scene.script === scene.subtitleLines.join('\n')
            )
        ).toBe(true);
    });

    it('does not send empty or punctuation-only text to TTS', async () => {
        const { createDesktopVideoAgentTools } = await import(
            '../client/video-agent-tools'
        );
        const ttsCalls: string[] = [];
        const tools = createDesktopVideoAgentTools({
            getSelectedVoiceType: () => 'zh_female_wenroushunv_uranus_bigtts',
            modelProvider: {
                describeFrames: async () => [] as never[],
                embedTexts: async () => [] as never[],
                generateCreativeBrief: async () => ({
                    audience: '短视频创作者',
                    keyMessages: ['智能剪辑'],
                    summary: '介绍 Magicut 智能剪辑',
                    title: 'Magicut',
                    tone: '清晰自然',
                    visualStyle: '产品录屏'
                }),
                planScenes: async () => [
                    {
                        durationMs: 5000,
                        goal: '建立主题',
                        id: 'scene_001',
                        index: 1,
                        script: '开场：',
                        subtitleLines: ['字幕：', '……'],
                        title: '开场',
                        visualIntent: '产品界面'
                    }
                ],
                rankAssetMatches: async () => []
            },
            store: {} as never,
            ttsProvider: {
                synthesizeSpeech: async ({ outputPath, text }) => {
                    ttsCalls.push(text);

                    return {
                        byteLength: 1,
                        durationMs: 1200,
                        format: 'mp3',
                        path: outputPath
                    };
                }
            },
            voiceOutputDirectory: '/tmp/magicut-voices'
        });
        const scenes = await tools.planScenes({
            assets: [
                {
                    assetId: 'video_asset_001',
                    description: '产品界面录屏',
                    durationMs: 5000
                }
            ],
            brief: {
                audience: '短视频创作者',
                keyMessages: ['智能剪辑'],
                summary: '介绍 Magicut 智能剪辑',
                title: 'Magicut',
                tone: '清晰自然',
                visualStyle: '产品录屏'
            },
            input: {
                prompt: '介绍 Magicut 智能剪辑',
                runId: 'run_no_readable_text',
                sourceAssetDirectory: '/tmp/magicut-assets'
            }
        });

        await tools.synthesizeVoice({
            brief: {
                audience: '短视频创作者',
                keyMessages: ['智能剪辑'],
                summary: '介绍 Magicut 智能剪辑',
                title: 'Magicut',
                tone: '清晰自然',
                visualStyle: '产品录屏'
            },
            input: {
                prompt: '介绍 Magicut 智能剪辑',
                runId: 'run_no_readable_text',
                sourceAssetDirectory: '/tmp/magicut-assets'
            },
            scenes
        });

        expect(ttsCalls.length).toBeGreaterThan(0);
        expect(ttsCalls.every((text) => /[\p{L}\p{N}]/u.test(text))).toBe(true);
        expect(ttsCalls.join('\n')).not.toMatch(/^[\s\p{P}\p{S}]+$/u);
    });

    it('keeps a long spoken subtitle line intact when no natural boundary exists', async () => {
        const { createDesktopVideoAgentTools } = await import(
            '../client/video-agent-tools'
        );
        const longSpokenLine =
            '这是一段没有标点但需要保持完整不要被机械截断的口播字幕文本';
        const tools = createDesktopVideoAgentTools({
            modelProvider: {
                describeFrames: async () => [] as never[],
                embedTexts: async () => [] as never[],
                generateCreativeBrief: async () => ({
                    audience: '短视频创作者',
                    keyMessages: ['自然断句'],
                    summary: '字幕不能硬切',
                    title: '自然断句',
                    tone: '自然',
                    visualStyle: '产品录屏'
                }),
                planScenes: async () => [
                    {
                        durationMs: 5000,
                        goal: '验证自然字幕',
                        id: 'scene_001',
                        index: 1,
                        script: longSpokenLine,
                        subtitleLines: [longSpokenLine],
                        title: '自然字幕',
                        visualIntent: '产品界面'
                    }
                ],
                rankAssetMatches: async () => []
            },
            store: {} as never
        });

        const scenes = await tools.planScenes({
            assets: [
                {
                    assetId: 'video_asset_001',
                    description: '产品界面录屏',
                    durationMs: 5000
                }
            ],
            brief: {
                audience: '短视频创作者',
                keyMessages: ['自然断句'],
                summary: '字幕不能硬切',
                title: '自然断句',
                tone: '自然',
                visualStyle: '产品录屏'
            },
            input: {
                prompt: '验证字幕自然断句',
                runId: 'run_natural_subtitle_line',
                sourceAssetDirectory: '/tmp/magicut-assets'
            }
        });

        expect(scenes[0]?.subtitleLines).toEqual([longSpokenLine]);
        expect(scenes[0]?.script).toBe(longSpokenLine);
    });

    it('lets the model choose the scene count instead of forcing a fixed target', async () => {
        const { createDesktopVideoAgentTools } = await import(
            '../client/video-agent-tools'
        );
        const planSceneInputs: unknown[] = [];
        const tools = createDesktopVideoAgentTools({
            modelProvider: {
                describeFrames: async () => [] as never[],
                embedTexts: async () => [] as never[],
                generateCreativeBrief: async () => ({
                    audience: '短视频创作者',
                    keyMessages: ['动态分镜'],
                    summary: '根据内容决定分镜',
                    title: '动态分镜',
                    tone: '自然',
                    visualStyle: '产品录屏'
                }),
                planScenes: async (input) => {
                    planSceneInputs.push(input);

                    return [
                        {
                            durationMs: 5000,
                            goal: '验证动态分镜',
                            id: 'scene_001',
                            index: 1,
                            script: '根据内容决定分镜数量',
                            subtitleLines: ['根据内容决定分镜数量'],
                            title: '动态分镜',
                            visualIntent: '产品界面'
                        }
                    ];
                },
                rankAssetMatches: async () => []
            },
            store: {} as never
        });

        await tools.planScenes({
            assets: [
                {
                    assetId: 'video_asset_001',
                    description: '产品界面录屏',
                    durationMs: 5000
                },
                {
                    assetId: 'video_asset_002',
                    description: '素材特写',
                    durationMs: 5000
                }
            ],
            brief: {
                audience: '短视频创作者',
                keyMessages: ['动态分镜'],
                summary: '根据内容决定分镜',
                title: '动态分镜',
                tone: '自然',
                visualStyle: '产品录屏'
            },
            input: {
                prompt: '根据内容规划分镜',
                runId: 'run_dynamic_scene_count',
                sourceAssetDirectory: '/tmp/magicut-assets'
            }
        });

        expect(planSceneInputs[0]).toMatchObject({
            brief: expect.objectContaining({
                summary: '根据内容决定分镜'
            })
        });
        expect(planSceneInputs[0]).not.toHaveProperty('targetSceneCount');
    });

    it('wires the agent progress panel and local asset directory input into the create tab', () => {
        const inputPanelSource = readFileSync(
            resolve(
                __dirname,
                '../renderer/components/create/CreateInputPanel.vue'
            ),
            'utf8'
        );
        const mainContentSource = readFileSync(
            resolve(
                __dirname,
                '../renderer/components/create/CreateMainContent.vue'
            ),
            'utf8'
        );

        expect(mainContentSource).toContain('CreateAgentProgress');
        expect(inputPanelSource).toContain('本地素材目录');
        expect(inputPanelSource).toContain('粘贴本地视频素材目录');
        expect(inputPanelSource).toContain('data-agent-start-button');
    });

    it('maps sequenced agent events into readable Chinese progress states', async () => {
        const { createAgentProgressViewModel } = await import(
            '../renderer/components/create/createAgentProgressViewModel'
        );

        const viewModel = createAgentProgressViewModel([
            {
                createdAt: '2026-06-23T01:00:03.000Z',
                projectId: 'project_from_agent',
                runId: 'run_001',
                sequence: 4,
                type: 'run.completed'
            },
            {
                createdAt: '2026-06-23T01:00:01.000Z',
                nodeName: 'asset_scan',
                runId: 'run_001',
                sequence: 2,
                type: 'node.started'
            },
            {
                approval: {
                    payload: {},
                    type: 'scene-plan'
                },
                createdAt: '2026-06-23T01:00:02.000Z',
                runId: 'run_001',
                sequence: 3,
                type: 'approval.required'
            },
            {
                createdAt: '2026-06-23T01:00:00.000Z',
                input: {
                    prompt: '做一个产品发布视频',
                    selectedVoice: '温婉学姐',
                    sourceAssetDirectory: '/Users/jamie/Videos/magicut'
                },
                runId: 'run_001',
                sequence: 1,
                type: 'run.started'
            }
        ]);

        expect(viewModel.entries.map((entry) => entry.sequence)).toEqual([
            1, 2, 3, 4
        ]);
        expect(viewModel.entries.map((entry) => entry.label)).toContain(
            '正在分析素材'
        );
        expect(viewModel.entries.map((entry) => entry.label)).toContain(
            '等待分镜确认'
        );
        expect(viewModel.status).toBe('completed');
        expect(viewModel.title).toBe('已完成');
        expect(viewModel.editorHref).toBe('/editor/project_from_agent');
    });

    it('coalesces repeated lifecycle events into one visible progress stage', async () => {
        const { createAgentProgressViewModel } = await import(
            '../renderer/components/create/createAgentProgressViewModel'
        );

        const viewModel = createAgentProgressViewModel([
            {
                createdAt: '2026-06-23T01:00:00.000Z',
                input: {
                    prompt: '做一个产品发布视频',
                    selectedVoice: '温婉学姐',
                    sourceAssetDirectory: '/Users/jamie/Videos/magicut'
                },
                runId: 'run_001',
                sequence: 1,
                type: 'run.started'
            },
            {
                createdAt: '2026-06-23T01:00:01.000Z',
                nodeName: 'scene_approval',
                runId: 'run_001',
                sequence: 2,
                type: 'node.started'
            },
            {
                approval: {
                    payload: {},
                    type: 'scene-plan'
                },
                createdAt: '2026-06-23T01:00:02.000Z',
                runId: 'run_001',
                sequence: 3,
                type: 'approval.required'
            },
            {
                createdAt: '2026-06-23T01:00:03.000Z',
                nodeName: 'scene_approval',
                runId: 'run_001',
                sequence: 4,
                type: 'node.completed'
            },
            {
                createdAt: '2026-06-23T01:00:04.000Z',
                nodeName: 'asset_matcher',
                runId: 'run_001',
                sequence: 5,
                type: 'node.started'
            },
            {
                createdAt: '2026-06-23T01:00:05.000Z',
                nodeName: 'project_save',
                runId: 'run_001',
                sequence: 6,
                type: 'node.started'
            },
            {
                createdAt: '2026-06-23T01:00:06.000Z',
                nodeName: 'project_save',
                runId: 'run_001',
                sequence: 7,
                type: 'node.completed'
            },
            {
                createdAt: '2026-06-23T01:00:07.000Z',
                projectId: 'project_from_agent',
                runId: 'run_001',
                sequence: 8,
                type: 'run.completed'
            }
        ]);

        expect(viewModel.entries.map((entry) => entry.label)).toEqual([
            '已开始智能创作',
            '等待分镜确认',
            '正在匹配素材',
            '正在保存工程',
            '已完成'
        ]);
    });

    it('registers video agent IPC handlers and emits renderer events in sequence', async () => {
        const {
            createDemoVideoAgentController,
            registerVideoAgentIpc,
            videoAgentIpcChannels
        } = await import('../client/video-agent-ipc');
        const sentEvents: unknown[] = [];
        const sender = {
            send: (channel: string, event: unknown) => {
                sentEvents.push({ channel, event });
            }
        };
        const handlers = new Map<
            string,
            (event: { sender: typeof sender }, input: unknown) => unknown
        >();
        const ipcMain = {
            handle: (
                channel: string,
                handler: (
                    event: { sender: typeof sender },
                    input: unknown
                ) => unknown
            ) => {
                handlers.set(channel, handler);
            }
        };

        registerVideoAgentIpc({
            controller: createDemoVideoAgentController({
                createRunId: () => 'run_test',
                now: () => '2026-06-23T01:00:00.000Z'
            }),
            ipcMain
        });

        const missingDirectory = await handlers.get(
            videoAgentIpcChannels.start
        )?.(
            { sender },
            {
                prompt: '做一个课程宣传视频',
                selectedVoice: '温婉学姐',
                sourceAssetDirectory: ''
            }
        );

        expect(missingDirectory).toMatchObject({
            error: {
                code: 'VALIDATION_FAILED',
                message: '请选择本地素材目录'
            },
            success: false
        });

        const started = await handlers.get(videoAgentIpcChannels.start)?.(
            { sender },
            {
                prompt: '做一个课程宣传视频',
                selectedVoice: '温婉学姐',
                sourceAssetDirectory: '/Users/jamie/Videos/magicut'
            }
        );

        expect(started).toMatchObject({
            data: {
                runId: 'run_test'
            },
            success: true
        });
        expect(sentEvents).toContainEqual(
            expect.objectContaining({
                channel: videoAgentIpcChannels.event,
                event: expect.objectContaining({
                    sequence: 1,
                    type: 'run.started'
                })
            })
        );
        expect(sentEvents).toContainEqual(
            expect.objectContaining({
                channel: videoAgentIpcChannels.event,
                event: expect.objectContaining({
                    sequence: 7,
                    type: 'approval.required'
                })
            })
        );

        const approved = await handlers.get(videoAgentIpcChannels.approve)?.(
            { sender },
            {
                approved: true,
                runId: 'run_test'
            }
        );

        expect(approved).toMatchObject({
            data: {
                runId: 'run_test'
            },
            success: true
        });
        expect(sentEvents).toContainEqual(
            expect.objectContaining({
                channel: videoAgentIpcChannels.event,
                event: expect.objectContaining({
                    projectId: 'project_run_test',
                    type: 'run.completed'
                })
            })
        );

        const cancelled = await handlers.get(videoAgentIpcChannels.cancel)?.(
            { sender },
            {
                runId: 'run_test'
            }
        );

        expect(cancelled).toMatchObject({
            data: {
                runId: 'run_test'
            },
            success: true
        });
        expect(sentEvents).toContainEqual(
            expect.objectContaining({
                channel: videoAgentIpcChannels.event,
                event: expect.objectContaining({
                    type: 'run.cancelled'
                })
            })
        );
    });

    it('runs the real LangGraph controller and saves a loadable VideoProject', async () => {
        const assetDirectory = await mkdtemp(
            path.join(tmpdir(), 'magicut-assets-')
        );
        const projectsDirectory = await mkdtemp(
            path.join(tmpdir(), 'magicut-projects-')
        );

        try {
            await mkdir(assetDirectory, { recursive: true });
            await writeFile(path.join(assetDirectory, 'scene-01.mp4'), '');

            const { createVideoProjectStore } = await import(
                '../client/video-project-store'
            );
            const { createLangGraphVideoAgentController } = await import(
                '../client/video-agent-ipc'
            );
            const modelCalls: string[] = [];
            const ttsCalls: string[] = [];
            const modelProvider = {
                describeFrames: async () => [] as never[],
                embedTexts: async () => [] as never[],
                generateCreativeBrief: async () => {
                    modelCalls.push('generateCreativeBrief');

                    return {
                        audience: '短视频创作者',
                        keyMessages: ['智能分镜', '真实模型链路'],
                        summary: 'Magicut 产品发布视频',
                        title: 'Magicut 产品发布',
                        tone: '专业轻快',
                        visualStyle: '清爽科技感'
                    };
                },
                planScenes: async () => {
                    modelCalls.push('planScenes');

                    return [
                        {
                            durationMs: 3200,
                            goal: '展示产品开场',
                            id: 'scene_001',
                            index: 1,
                            script: 'Magicut 让视频创作更快',
                            subtitleLines: ['Magicut 让视频创作更快'],
                            title: '开场',
                            visualIntent: '产品界面'
                        }
                    ];
                },
                rankAssetMatches: async () => {
                    modelCalls.push('rankAssetMatches');

                    return [
                        {
                            rankedAssetIds: [
                                {
                                    assetId:
                                        'video_asset_run_desktop_langgraph_001',
                                    reason: '产品界面素材匹配',
                                    score: 0.92
                                }
                            ],
                            sceneId: 'scene_001'
                        }
                    ];
                }
            };
            const ttsProvider = {
                synthesizeSpeech: async ({
                    outputPath,
                    text,
                    voice
                }: {
                    outputPath: string;
                    text: string;
                    voice: string;
                }) => {
                    ttsCalls.push(`${voice}:${text}`);
                    await writeFile(outputPath, new Uint8Array([1, 2, 3]));

                    return {
                        byteLength: 3,
                        durationMs: 3200,
                        format: 'mp3' as const,
                        path: outputPath
                    };
                }
            };
            const store = createVideoProjectStore({ projectsDirectory });
            const controller = createLangGraphVideoAgentController({
                createRunId: () => 'run_desktop_langgraph',
                modelProvider,
                now: () => '2026-06-23T01:00:00.000Z',
                store,
                ttsProvider,
                voiceOutputDirectory: path.join(projectsDirectory, 'voices')
            });
            const events: unknown[] = [];

            const started = await controller.start(
                {
                    prompt: '做一个 Magicut 智能视频编辑器产品发布视频',
                    selectedVoice: '新闻播报',
                    selectedVoiceType: 'zh_male_cixingjieshuonan_uranus_bigtts',
                    sourceAssetDirectory: assetDirectory
                },
                (event) => events.push(event)
            );

            expect(started).toMatchObject({
                data: {
                    runId: 'run_desktop_langgraph'
                },
                success: true
            });
            expect(events).toContainEqual(
                expect.objectContaining({
                    input: expect.objectContaining({
                        selectedVoice: '新闻播报',
                        sourceAssetDirectory: assetDirectory
                    }),
                    type: 'run.started'
                })
            );
            expect(events).toContainEqual(
                expect.objectContaining({
                    approval: expect.objectContaining({
                        type: 'scene-plan'
                    }),
                    type: 'approval.required'
                })
            );
            expect(modelCalls).toEqual(['generateCreativeBrief', 'planScenes']);

            const approved = await controller.approve(
                {
                    approved: true,
                    runId: 'run_desktop_langgraph'
                },
                (event) => events.push(event)
            );

            if (approved.success === false) {
                throw new Error(approved.error.message);
            }

            expect(approved).toMatchObject({
                data: {
                    runId: 'run_desktop_langgraph'
                },
                success: true
            });
            expect(modelCalls).toEqual([
                'generateCreativeBrief',
                'planScenes',
                'rankAssetMatches'
            ]);
            expect(ttsCalls).toEqual([
                'zh_male_cixingjieshuonan_uranus_bigtts:Magicut 让视频创作更快'
            ]);

            const completed = events.find(
                (event) =>
                    typeof event === 'object' &&
                    event !== null &&
                    'type' in event &&
                    event.type === 'run.completed'
            );

            expect(completed).toMatchObject({
                projectId: 'project_run_desktop_langgraph',
                type: 'run.completed'
            });

            const loaded = await store.readProjectById({
                projectId: 'project_run_desktop_langgraph'
            });

            expect(loaded).toMatchObject({
                data: {
                    ai: {
                        runId: 'run_desktop_langgraph'
                    },
                    tracks: expect.arrayContaining([
                        expect.objectContaining({ kind: 'video' }),
                        expect.objectContaining({ kind: 'voice' }),
                        expect.objectContaining({ kind: 'subtitle' }),
                        expect.objectContaining({ kind: 'music' })
                    ])
                },
                success: true
            });
        } finally {
            await rm(assetDirectory, { force: true, recursive: true });
            await rm(projectsDirectory, { force: true, recursive: true });
        }
    });

    it('uses subtitle lines as the TTS source and derives scene timing from voice duration', async () => {
        const assetDirectory = await mkdtemp(
            path.join(tmpdir(), 'magicut-assets-')
        );
        const projectsDirectory = await mkdtemp(
            path.join(tmpdir(), 'magicut-projects-')
        );

        try {
            await mkdir(assetDirectory, { recursive: true });
            await writeFile(path.join(assetDirectory, 'scene-01.mp4'), '');

            const { createVideoProjectStore } = await import(
                '../client/video-project-store'
            );
            const { createLangGraphVideoAgentController } = await import(
                '../client/video-agent-ipc'
            );
            const ttsCalls: string[] = [];
            const ttsDurationsByText = new Map([
                ['第一句字幕就是第一段配音', 1400],
                ['第二句字幕就是第二段配音', 2300]
            ]);
            const modelProvider = {
                describeFrames: async () => [] as never[],
                embedTexts: async () => [] as never[],
                generateCreativeBrief: async () => ({
                    audience: '短视频创作者',
                    keyMessages: ['字幕驱动配音'],
                    summary: '字幕和配音需要严格同步',
                    title: '字幕配音同步',
                    tone: '清晰',
                    visualStyle: '产品录屏'
                }),
                planScenes: async () => [
                    {
                        durationMs: 9999,
                        goal: '验证分镜时长不再由模型预估决定',
                        id: 'scene_001',
                        index: 1,
                        script: '这段脚本不应该直接送给 TTS',
                        subtitleLines: [
                            '第一句字幕就是第一段配音',
                            '第二句字幕就是第二段配音'
                        ],
                        title: '同步验证',
                        visualIntent: '单个视频对应一个分镜'
                    }
                ],
                rankAssetMatches: async () => [
                    {
                        rankedAssetIds: [
                            {
                                assetId: 'video_asset_run_voice_timing_001',
                                reason: '匹配单分镜视频',
                                score: 0.95
                            }
                        ],
                        sceneId: 'scene_001'
                    }
                ]
            };
            const ttsProvider = {
                synthesizeSpeech: async ({
                    outputPath,
                    text,
                    voice
                }: {
                    outputPath: string;
                    text: string;
                    voice: string;
                }) => {
                    ttsCalls.push(`${voice}:${text}`);
                    await writeFile(outputPath, new Uint8Array([1, 2, 3]));

                    return {
                        byteLength: 3,
                        durationMs: ttsDurationsByText.get(text) ?? 1000,
                        format: 'mp3' as const,
                        path: outputPath
                    };
                }
            };
            const store = createVideoProjectStore({ projectsDirectory });
            const controller = createLangGraphVideoAgentController({
                createRunId: () => 'run_voice_timing',
                modelProvider,
                now: () => '2026-06-23T01:00:00.000Z',
                store,
                ttsProvider,
                voiceOutputDirectory: path.join(projectsDirectory, 'voices')
            });

            await controller.start(
                {
                    prompt: '做一个字幕配音同步验证视频',
                    selectedVoice: '温婉学姐',
                    selectedVoiceType: 'zh_female_wenroushunv_uranus_bigtts',
                    sourceAssetDirectory: assetDirectory
                },
                () => undefined
            );
            const approved = await controller.approve(
                {
                    approved: true,
                    runId: 'run_voice_timing'
                },
                () => undefined
            );

            if (approved.success === false) {
                throw new Error(approved.error.message);
            }

            expect(ttsCalls).toEqual([
                'zh_female_wenroushunv_uranus_bigtts:第一句字幕就是第一段配音',
                'zh_female_wenroushunv_uranus_bigtts:第二句字幕就是第二段配音'
            ]);

            const loaded = await store.readProjectById({
                projectId: 'project_run_voice_timing'
            });

            if (loaded.success === false) {
                throw new Error(loaded.error.message);
            }

            const project = loaded.data;
            const videoTrack = project.tracks.find(
                (track) => track.kind === 'video'
            );
            const voiceTrack = project.tracks.find(
                (track) => track.kind === 'voice'
            );
            const subtitleTrack = project.tracks.find(
                (track) => track.kind === 'subtitle'
            );

            expect(project.canvas.durationMs).toBe(3700);
            expect(project.scenes[0]).toMatchObject({
                durationMs: 3700,
                script: '第一句字幕就是第一段配音\n第二句字幕就是第二段配音'
            });
            expect(videoTrack?.clips).toMatchObject([
                {
                    endMs: 3700,
                    kind: 'video',
                    sceneId: 'scene_001',
                    startMs: 0
                }
            ]);
            expect(voiceTrack?.clips).toMatchObject([
                {
                    endMs: 1400,
                    kind: 'voice',
                    sceneId: 'scene_001',
                    startMs: 0
                },
                {
                    endMs: 3700,
                    kind: 'voice',
                    sceneId: 'scene_001',
                    startMs: 1400
                }
            ]);
            expect(subtitleTrack?.clips).toMatchObject([
                {
                    endMs: 1400,
                    kind: 'subtitle',
                    sceneId: 'scene_001',
                    startMs: 0,
                    text: '第一句字幕就是第一段配音'
                },
                {
                    endMs: 3700,
                    kind: 'subtitle',
                    sceneId: 'scene_001',
                    startMs: 1400,
                    text: '第二句字幕就是第二段配音'
                }
            ]);
        } finally {
            await rm(assetDirectory, { force: true, recursive: true });
            await rm(projectsDirectory, { force: true, recursive: true });
        }
    });

    it('keeps sandboxed preload free from main-only IPC modules', () => {
        const preloadSource = readFileSync(
            resolve(__dirname, '../client/preload.ts'),
            'utf8'
        );
        const videoAgentIpcSource = readFileSync(
            resolve(__dirname, '../client/video-agent-ipc.ts'),
            'utf8'
        );
        const videoProjectIpcSource = readFileSync(
            resolve(__dirname, '../client/video-project-ipc.ts'),
            'utf8'
        );

        expect(preloadSource).not.toContain('./video-agent-ipc');
        expect(preloadSource).not.toContain('./video-project-ipc');
        expect(preloadSource).toContain('../shared/video-agent-channels');
        expect(preloadSource).toContain('../shared/video-project-channels');
        expect(videoAgentIpcSource).toContain('node:crypto');
        expect(videoProjectIpcSource).toContain('node:path');
    });

    it('loads VideoProject by project id in the editor route', () => {
        const routerSource = readFileSync(
            resolve(__dirname, '../renderer/router/index.ts'),
            'utf8'
        );
        const editorRouteSource = readFileSync(
            resolve(__dirname, '../renderer/pages/EditorProjectRoute.vue'),
            'utf8'
        );
        const preloadSource = readFileSync(
            resolve(__dirname, '../client/preload.ts'),
            'utf8'
        );

        expect(routerSource).toContain('EditorProjectRoute');
        expect(editorRouteSource).toContain('useRoute');
        expect(editorRouteSource).toContain('readById');
        expect(editorRouteSource).toContain('<EditorScreen :project="project"');
        expect(preloadSource).toContain('readById');
    });

    it('does not automatically leave the create page when the agent completes', () => {
        const workspaceSource = readFileSync(
            resolve(__dirname, '../renderer/pages/HomePage.vue'),
            'utf8'
        );
        const progressSource = readFileSync(
            resolve(
                __dirname,
                '../renderer/components/create/CreateAgentProgress.vue'
            ),
            'utf8'
        );

        expect(workspaceSource).not.toContain('window.history.pushState');
        expect(workspaceSource).not.toContain("new PopStateEvent('popstate')");
        expect(progressSource).toContain('打开编辑器');
    });

    it('deduplicates repeated TTS failures in the agent progress panel', async () => {
        const { createAgentProgressViewModel } = await import(
            '../renderer/components/create/createAgentProgressViewModel'
        );
        const error =
            'TTS conversion failed: {"error":"resource ID is mismatched with speaker related resource"}';
        const viewModel = createAgentProgressViewModel([
            {
                createdAt: '2026-06-23T01:00:00.000Z',
                nodeName: 'tts',
                runId: 'run_001',
                sequence: 1,
                type: 'node.started'
            },
            {
                createdAt: '2026-06-23T01:00:01.000Z',
                error,
                nodeName: 'tts',
                runId: 'run_001',
                sequence: 2,
                type: 'node.failed'
            },
            {
                createdAt: '2026-06-23T01:00:02.000Z',
                error,
                runId: 'run_001',
                sequence: 3,
                type: 'run.failed'
            },
            {
                createdAt: '2026-06-23T01:00:03.000Z',
                error,
                runId: 'local_001',
                sequence: 4,
                type: 'run.failed'
            }
        ]);

        expect(viewModel.status).toBe('failed');
        expect(viewModel.entries.map((entry) => entry.label)).toEqual([
            '正在生成配音',
            '生成配音失败'
        ]);
        expect(
            viewModel.entries.filter((entry) => entry.detail === error)
        ).toHaveLength(1);
    });

    it('shows cancelled runs as a terminal progress state', async () => {
        const { createAgentProgressViewModel } = await import(
            '../renderer/components/create/createAgentProgressViewModel'
        );
        const viewModel = createAgentProgressViewModel([
            {
                createdAt: '2026-06-23T01:00:00.000Z',
                input: {
                    prompt: '做一个产品发布视频',
                    selectedVoice: '温婉学姐',
                    sourceAssetDirectory: '/Users/jamie/Videos/magicut'
                },
                runId: 'run_001',
                sequence: 1,
                type: 'run.started'
            },
            {
                createdAt: '2026-06-23T01:00:01.000Z',
                reason: '用户取消任务',
                runId: 'run_001',
                sequence: 2,
                type: 'run.cancelled'
            }
        ]);

        expect(viewModel.status).toBe('cancelled');
        expect(viewModel.title).toBe('已取消');
        expect(viewModel.canRetry).toBe(true);
        expect(viewModel.canCancel).toBe(false);
        expect(viewModel.entries.map((entry) => entry.label)).toEqual([
            '已开始智能创作',
            '已取消'
        ]);
    });

    it('regenerates every voice clip without changing scripts or matched assets', async () => {
        const projectsDirectory = await mkdtemp(
            path.join(tmpdir(), 'magicut-projects-')
        );

        try {
            const { createVideoProjectStore } = await import(
                '../client/video-project-store'
            );
            const { createLangGraphVideoAgentController } = await import(
                '../client/video-agent-ipc'
            );
            const store = createVideoProjectStore({ projectsDirectory });
            const project: VideoProject = structuredClone(sampleVideoProject);
            const saved = await store.createProject({ project });

            if (saved.success === false) {
                throw new Error(saved.error.message);
            }

            const ttsCalls: {
                text: string;
                voice: string;
            }[] = [];
            const controller = createLangGraphVideoAgentController({
                createRunId: () => 'voice_regen_test',
                modelProvider: {
                    describeFrames: async () => [] as never[],
                    embedTexts: async () => [] as never[],
                    generateCreativeBrief: async () => {
                        throw new Error('model should not be called');
                    },
                    planScenes: async () => {
                        throw new Error('model should not be called');
                    },
                    rankAssetMatches: async () => {
                        throw new Error('model should not be called');
                    }
                },
                now: () => '2026-06-23T10:00:00.000Z',
                store,
                ttsProvider: {
                    synthesizeSpeech: async ({ outputPath, text, voice }) => {
                        ttsCalls.push({ text, voice });
                        await writeFile(outputPath, new Uint8Array([7, 8, 9]));

                        return {
                            byteLength: 3,
                            durationMs: 6000,
                            format: 'mp3' as const,
                            path: outputPath
                        };
                    }
                },
                voiceOutputDirectory: path.join(projectsDirectory, 'voices')
            });
            const events: unknown[] = [];
            const result = await controller.regenerateVoices(
                {
                    projectId: 'project_sample_001',
                    selectedVoice: '活力讲解',
                    selectedVoiceType: 'zh_male_huolixiaoge_uranus_bigtts',
                    voiceSpeed: 1.5,
                    voiceVolume: 0.42
                },
                (event) => events.push(event)
            );

            if (result.success === false) {
                throw new Error(result.error.message);
            }

            const loaded = await store.readProjectById({
                projectId: 'project_sample_001'
            });

            if (loaded.success === false) {
                throw new Error(loaded.error.message);
            }

            const nextProject = loaded.data;
            const videoTrack = nextProject.tracks.find(
                (track) => track.kind === 'video'
            );
            const voiceTrack = nextProject.tracks.find(
                (track) => track.kind === 'voice'
            );
            const subtitleTrack = nextProject.tracks.find(
                (track) => track.kind === 'subtitle'
            );
            const musicTrack = nextProject.tracks.find(
                (track) => track.kind === 'music'
            );

            expect(result).toMatchObject({
                data: {
                    projectId: 'project_sample_001',
                    runId: 'voice_regen_test'
                },
                success: true
            });
            expect(ttsCalls).toEqual([
                {
                    text: '开场提出问题，把学习焦虑拉到观众面前。',
                    voice: 'zh_male_huolixiaoge_uranus_bigtts'
                }
            ]);
            expect(nextProject.assets.voices).toEqual([
                expect.objectContaining({
                    durationMs: 6000,
                    id: 'voice_asset_scene_001_voice_regen_voice_regen_test_001',
                    voice: 'zh_male_huolixiaoge_uranus_bigtts'
                })
            ]);
            expect(nextProject.scenes[0]).toMatchObject({
                durationMs: 4000,
                matchedVideoAssetIds: ['video_asset_001'],
                script: project.scenes[0]?.script,
                voiceAssetId:
                    'voice_asset_scene_001_voice_regen_voice_regen_test_001'
            });
            expect(voiceTrack?.clips).toMatchObject([
                {
                    assetId:
                        'voice_asset_scene_001_voice_regen_voice_regen_test_001',
                    endMs: 4000,
                    kind: 'voice',
                    sceneId: 'scene_001',
                    speed: 1.5,
                    startMs: 0,
                    volume: 0.42,
                    voicePreset: '活力讲解'
                }
            ]);
            expect(subtitleTrack?.clips).toMatchObject([
                {
                    endMs: 4000,
                    kind: 'subtitle',
                    sceneId: 'scene_001',
                    startMs: 0,
                    text: '开场提出问题，把学习焦虑拉到观众面前。'
                }
            ]);
            expect(videoTrack?.clips[0]).toMatchObject({
                assetId: 'video_asset_001',
                endMs: 4000,
                sceneId: 'scene_001',
                sourceEndMs: 6000,
                speed: 1.5,
                startMs: 0
            });
            expect(musicTrack?.clips[0]).toMatchObject({
                endMs: 4000,
                sourceEndMs: 4000,
                startMs: 0
            });
            expect(nextProject.canvas.durationMs).toBe(4000);
            expect(events).toContainEqual(
                expect.objectContaining({
                    nodeName: 'voice_regeneration',
                    type: 'node.started'
                })
            );
            expect(events).toContainEqual(
                expect.objectContaining({
                    projectId: 'project_sample_001',
                    type: 'run.completed'
                })
            );
        } finally {
            await rm(projectsDirectory, { force: true, recursive: true });
        }
    });
});
