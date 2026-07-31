import { readFileSync } from 'node:fs';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path, { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('create agent flow', () => {
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
});
