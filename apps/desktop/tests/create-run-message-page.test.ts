import { describe, expect, it } from 'vitest';
import type { Component } from 'vue';
import { createSSRApp, h } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';

import { renderToString } from '@vue/server-renderer';

import AgentConversationTimeline from '../renderer/components/agent/AgentConversationTimeline.vue';
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
        expect(html).toContain('w-[860px]');
        expect(html).not.toContain('CreateAgentProgress');
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
