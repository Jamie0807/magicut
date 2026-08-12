import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { Component } from 'vue';
import { createSSRApp, h } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';

import { renderToString } from '@vue/server-renderer';

import AgentConversationTimeline from '../renderer/components/agent/AgentConversationTimeline.vue';
import AgentRunStageNav from '../renderer/components/agent/AgentRunStageNav.vue';
import {
    type AgentRunConversationEvent,
    createAgentConversationViewModel
} from '../renderer/mappers/agent-run-conversation';
import CreateRunScreen from '../renderer/pages/CreateRunScreen.vue';
import { appRoutes } from '../renderer/router';
import type { DesktopAgentRunEvent } from '../shared/video-agent';

const baseEvent = {
    createdAt: '2026-06-23T10:00:00.000Z',
    runId: 'run-message-001'
};

const runStartedEvent: DesktopAgentRunEvent = {
    ...baseEvent,
    input: {
        prompt: '生成一条介绍 Magicut 智能剪辑的视频',
        selectedVoice: '温婉学姐',
        selectedVoiceType: 'zh_female_wenroushunv_uranus_bigtts',
        sourceAssetDirectory: '/Users/jamie/Movies/magicut'
    },
    sequence: 1,
    type: 'run.started'
};

const renderComponent = async (
    component: Component,
    props?: Record<string, unknown>
) => {
    const app = createSSRApp({
        render: () => h(component, props)
    });
    const router = createRouter({
        history: createMemoryHistory(),
        routes: appRoutes
    });

    app.use(router);
    await router.push('/create/runs/run-message-001');
    await router.isReady();

    return renderToString(app);
};

describe('create run message page', () => {
    it('registers /create/runs/:runId and renders the message page shell', async () => {
        expect(
            appRoutes.some((route) => route.path === '/create/runs/:runId')
        ).toBe(true);

        const app = createSSRApp(CreateRunScreen, {
            runId: 'run-message-001'
        });
        const router = createRouter({
            history: createMemoryHistory(),
            routes: appRoutes
        });

        app.use(router);
        await router.push('/create/runs/run-message-001');
        await router.isReady();

        const html = await renderToString(app);

        expect(html).toContain('data-create-run-message-page="true"');
        expect(html).toContain('data-window-drag-region="true"');
        expect(html).toContain('data-create-run-chat-shell="true"');
        expect(html).toContain('data-create-run-chat-body="true"');
        expect(html).toContain('data-agent-stage-nav="true"');
        expect(html).toContain('data-create-run-layout="true"');
        expect(html).toContain('grid-cols-[minmax(0,1080px)_232px]');
        expect(html).not.toContain('CreateAgentProgress');
    });

    it('keeps the run page content aligned with a usable dark internal scrollbar', () => {
        const pageSource = readFileSync(
            resolve(__dirname, '../renderer/pages/CreateRunScreen.vue'),
            'utf8'
        );
        const timelineSource = readFileSync(
            resolve(
                __dirname,
                '../renderer/components/agent/AgentConversationTimeline.vue'
            ),
            'utf8'
        );
        const stageNavSource = readFileSync(
            resolve(
                __dirname,
                '../renderer/components/agent/AgentRunStageNav.vue'
            ),
            'utf8'
        );
        const cssSource = readFileSync(
            resolve(__dirname, '../renderer/index.css'),
            'utf8'
        );

        expect(pageSource).toContain('data-create-run-scroll-container');
        expect(pageSource).toContain('overflow-y-auto');
        expect(pageSource).toContain('scrollbar-dark');
        expect(pageSource).not.toContain('scrollbar-none');
        expect(pageSource).toContain('relative mx-auto grid min-h-0 h-full');
        expect(pageSource).toContain(
            'relative flex min-h-0 min-w-0 flex-col overflow-hidden'
        );
        expect(timelineSource).toContain('w-full');
        expect(timelineSource).not.toContain('ml-auto w-[760px]');
        expect(timelineSource).not.toContain('mr-auto w-[760px]');
        expect(stageNavSource).not.toContain('fixed top-[88px] right-8');
        expect(cssSource).toContain('.scrollbar-dark');
        expect(cssSource).toContain('scrollbar-width: thin');
        expect(cssSource).not.toContain('scrollbar-width: none');
    });

    it('aggregates model stream deltas into one assistant message and keeps structured progress separate', () => {
        const viewModel = createAgentConversationViewModel({
            events: [
                runStartedEvent,
                {
                    ...baseEvent,
                    messageId: 'creative_brief-content-understanding',
                    nodeName: 'creative_brief',
                    sequence: 2,
                    title: '内容理解',
                    type: 'model.stream.started'
                },
                {
                    ...baseEvent,
                    delta: '我会先提炼主题，',
                    messageId: 'creative_brief-content-understanding',
                    nodeName: 'creative_brief',
                    sequence: 3,
                    type: 'model.stream.delta'
                },
                {
                    ...baseEvent,
                    delta: '再拆解分镜。',
                    messageId: 'creative_brief-content-understanding',
                    nodeName: 'creative_brief',
                    sequence: 4,
                    type: 'model.stream.delta'
                },
                {
                    ...baseEvent,
                    messageId: 'creative_brief-content-understanding',
                    nodeName: 'creative_brief',
                    sequence: 5,
                    type: 'model.stream.completed'
                },
                {
                    ...baseEvent,
                    nodeName: 'asset_scan',
                    sequence: 6,
                    type: 'node.started'
                },
                {
                    ...baseEvent,
                    nodeName: 'asset_scan',
                    sequence: 7,
                    type: 'node.completed'
                }
            ] as AgentRunConversationEvent[]
        });

        expect(viewModel.messages).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    content: '生成一条介绍 Magicut 智能剪辑的视频',
                    role: 'user'
                }),
                expect.objectContaining({
                    content: '我会先提炼主题，再拆解分镜。',
                    nodeName: 'creative_brief',
                    role: 'assistant',
                    sourceEventType: 'model.stream.completed'
                }),
                expect.objectContaining({
                    blocks: expect.arrayContaining([
                        expect.objectContaining({
                            items: expect.arrayContaining([
                                expect.objectContaining({
                                    label: '01 准备阶段',
                                    status: 'completed'
                                }),
                                expect.objectContaining({
                                    label: '02 创建分镜',
                                    status: 'waiting'
                                })
                            ]),
                            type: 'progress'
                        })
                    ]),
                    role: 'system'
                })
            ])
        );
    });

    it('renders streamed assistant content only once when it is also stored as a paragraph block', async () => {
        const viewModel = createAgentConversationViewModel({
            events: [
                runStartedEvent,
                {
                    ...baseEvent,
                    messageId: 'creative_brief-content-understanding',
                    nodeName: 'creative_brief',
                    sequence: 2,
                    title: '内容理解',
                    type: 'model.stream.started'
                },
                {
                    ...baseEvent,
                    delta: '我会先提炼主题，再拆解分镜。',
                    messageId: 'creative_brief-content-understanding',
                    nodeName: 'creative_brief',
                    sequence: 3,
                    type: 'model.stream.delta'
                },
                {
                    ...baseEvent,
                    messageId: 'creative_brief-content-understanding',
                    nodeName: 'creative_brief',
                    sequence: 4,
                    type: 'model.stream.completed'
                }
            ] as AgentRunConversationEvent[]
        });
        const html = await renderComponent(AgentConversationTimeline, {
            viewModel
        });

        expect(html.match(/我会先提炼主题，再拆解分镜。/g) ?? []).toHaveLength(
            1
        );
    });

    it('dedupes repeated run page failure messages with the same detail', () => {
        const error =
            'TTS conversion failed: {"error":"Forbidden.AgentPlanDeductNotEnabled"}';
        const viewModel = createAgentConversationViewModel({
            events: [
                runStartedEvent,
                {
                    ...baseEvent,
                    nodeName: 'tts',
                    sequence: 2,
                    type: 'node.started'
                },
                {
                    ...baseEvent,
                    error,
                    nodeName: 'tts',
                    sequence: 3,
                    type: 'node.failed'
                },
                {
                    ...baseEvent,
                    error,
                    sequence: 4,
                    type: 'run.failed'
                }
            ] as AgentRunConversationEvent[]
        });

        expect(
            viewModel.messages.filter(
                (message) =>
                    message.tone === 'failed' && message.content.includes(error)
            )
        ).toHaveLength(1);
    });

    it('shows status labels in the execution directory', async () => {
        const html = await renderComponent(AgentRunStageNav, {
            stageItems: [
                {
                    detail: '加载制片规范与文稿',
                    label: '01 准备阶段',
                    status: 'completed'
                },
                {
                    detail: '生成分镜并等待确认',
                    label: '02 创建分镜',
                    status: 'running'
                },
                {
                    detail: '合成口播并匹配素材',
                    label: '03 配音生成',
                    status: 'waiting'
                }
            ]
        });

        expect(html).toContain('已完成');
        expect(html).toContain('执行中');
        expect(html).toContain('等待中');
    });

    it('dedupes repeated approval events and turns scene-plan approval into a confirmation table', () => {
        const approvalEvent: DesktopAgentRunEvent = {
            ...baseEvent,
            approval: {
                payload: {
                    scenes: [
                        {
                            durationMs: 3200,
                            id: 'scene_001',
                            script: 'Magicut 让视频创作更快',
                            subtitleLines: ['Magicut 让视频创作更快'],
                            title: '开场',
                            visualIntent: '产品界面'
                        }
                    ]
                },
                type: 'scene-plan'
            },
            sequence: 8,
            type: 'approval.required'
        };
        const viewModel = createAgentConversationViewModel({
            events: [
                runStartedEvent,
                approvalEvent,
                approvalEvent,
                {
                    ...baseEvent,
                    approved: true,
                    content: '确认分镜，继续生成',
                    sequence: 9,
                    type: 'user.reply'
                }
            ] as AgentRunConversationEvent[]
        });
        const approvalMessage = viewModel.messages.find(
            (message) => message.tone === 'waiting'
        );

        expect(
            viewModel.messages.filter((message) => message.tone === 'waiting')
        ).toHaveLength(1);
        expect(approvalMessage?.blocks).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    columns: ['分镜', '画面意图', '口播字幕', '时长'],
                    rows: [
                        ['开场', '产品界面', 'Magicut 让视频创作更快', '3.2s']
                    ],
                    type: 'table'
                })
            ])
        );
        expect(viewModel.messages.at(-1)).toMatchObject({
            content: '确认分镜，继续生成',
            role: 'user',
            sourceEventType: 'user.reply'
        });
    });

    it('renders user request, execution plan, approval reply, and completion overview', async () => {
        const viewModel = createAgentConversationViewModel({
            events: [
                runStartedEvent,
                {
                    ...baseEvent,
                    nodeName: 'asset_scan',
                    sequence: 2,
                    type: 'node.started'
                },
                {
                    ...baseEvent,
                    approval: {
                        payload: {
                            scenes: [
                                {
                                    durationMs: 3200,
                                    id: 'scene_001',
                                    script: 'Magicut 让视频创作更快',
                                    subtitleLines: ['Magicut 让视频创作更快'],
                                    title: '开场',
                                    visualIntent: '产品界面'
                                }
                            ]
                        },
                        type: 'scene-plan'
                    },
                    sequence: 3,
                    type: 'approval.required'
                },
                {
                    ...baseEvent,
                    approved: true,
                    content: '确认并继续',
                    sequence: 4,
                    type: 'user.reply'
                },
                {
                    ...baseEvent,
                    projectId: 'project_run-message-001',
                    savedProjectPath: '/tmp/project.json',
                    sequence: 5,
                    type: 'run.completed'
                }
            ] as AgentRunConversationEvent[]
        });
        const html = await renderComponent(AgentConversationTimeline, {
            viewModel
        });

        expect(html).toContain('data-message-kind="user-request"');
        expect(html).toContain('视频画面');
        expect(html).toContain('智能匹配素材');
        expect(html).toContain('旁白配音');
        expect(html).toContain('data-message-kind="execution-plan"');
        expect(html).toContain('01 准备阶段');
        expect(html).toContain('02 创建分镜');
        expect(html).toContain('03 配音生成');
        expect(html).toContain('04 视频生成');
        expect(html).toContain('data-message-kind="user-reply"');
        expect(html).toContain('确认并继续');
        expect(html).toContain('data-message-kind="video-overview"');
        expect(html).toContain('视频概览');
        expect(html).toContain('视频制作完成，可进入编辑器预览并微调轨道。');
    });
});
