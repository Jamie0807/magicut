import { afterEach, describe, expect, it, vi } from 'vitest';

import { sampleVideoProject } from '@magicut/video-project';

import type { DesktopAgentRunEvent } from '../shared/video-agent';

const flushPromises = () =>
    new Promise<void>((resolve) => {
        setTimeout(resolve, 0);
    });

const createRunStartedEvent = (runId: string): DesktopAgentRunEvent => ({
    createdAt: '2026-06-23T10:00:00.000Z',
    input: {
        prompt: '介绍 Magicut 智能剪辑',
        selectedVoice: '温婉学姐',
        selectedVoiceType: 'zh_female_wenroushunv_uranus_bigtts',
        sourceAssetDirectory: '/Users/jamie/Movies/magicut'
    },
    runId,
    sequence: 1,
    type: 'run.started'
});

describe('agent run store', () => {
    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it('dedupes repeated run events by run id, sequence, and type', async () => {
        const { addAgentRunEvent, getAgentRunSnapshot } = await import(
            '../renderer/stores/agent-run-store'
        );
        const event = createRunStartedEvent('run_store_dedupe');

        addAgentRunEvent(event);
        addAgentRunEvent(event);

        const snapshot = getAgentRunSnapshot('run_store_dedupe');

        expect(snapshot.events).toHaveLength(1);
        expect(snapshot.viewModel.messages).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    content: '介绍 Magicut 智能剪辑',
                    role: 'user'
                })
            ])
        );
    });

    it('adds user replies before approving a waiting run', async () => {
        const approve = vi.fn(async () => ({
            data: {
                runId: 'run_store_approval'
            },
            success: true
        }));
        vi.stubGlobal('window', {
            magicutAPI: {
                videoAgent: {
                    approve
                }
            }
        });
        const { addAgentRunEvent, approveAgentRun, getAgentRunSnapshot } =
            await import('../renderer/stores/agent-run-store');

        addAgentRunEvent(createRunStartedEvent('run_store_approval'));
        addAgentRunEvent({
            approval: {
                payload: {
                    scenes: []
                },
                type: 'scene-plan'
            },
            createdAt: '2026-06-23T10:00:01.000Z',
            runId: 'run_store_approval',
            sequence: 2,
            type: 'approval.required'
        });

        await approveAgentRun('run_store_approval');

        const snapshot = getAgentRunSnapshot('run_store_approval');

        expect(approve).toHaveBeenCalledWith({
            approved: true,
            runId: 'run_store_approval'
        });
        expect(snapshot.viewModel.messages.at(-1)).toMatchObject({
            content: '确认分镜，继续生成',
            role: 'user',
            sourceEventType: 'user.reply'
        });
    });

    it('persists the completed conversation back into the generated project', async () => {
        const project = structuredClone(sampleVideoProject);
        project.project.id = 'project_store_completed';
        const save = vi.fn(async () => ({
            data: project,
            success: true
        }));
        vi.stubGlobal('window', {
            magicutAPI: {
                videoProject: {
                    list: vi.fn(async () => ({
                        data: [
                            {
                                filePath:
                                    '/tmp/project_store_completed.magicut.json',
                                project
                            }
                        ],
                        success: true
                    })),
                    save
                }
            }
        });
        const { addAgentRunEvent } = await import(
            '../renderer/stores/agent-run-store'
        );

        addAgentRunEvent(createRunStartedEvent('run_store_completed'));
        addAgentRunEvent({
            createdAt: '2026-06-23T10:00:02.000Z',
            projectId: 'project_store_completed',
            runId: 'run_store_completed',
            savedProjectPath: '/tmp/project_store_completed.magicut.json',
            sequence: 2,
            type: 'run.completed'
        });
        await flushPromises();

        expect(save).toHaveBeenCalledWith(
            expect.objectContaining({
                filePath: '/tmp/project_store_completed.magicut.json',
                project: expect.objectContaining({
                    ai: expect.objectContaining({
                        conversation: expect.arrayContaining([
                            expect.objectContaining({
                                content: '介绍 Magicut 智能剪辑',
                                role: 'user'
                            }),
                            expect.objectContaining({
                                content:
                                    '视频制作完成，可进入编辑器预览并微调轨道。',
                                role: 'assistant'
                            })
                        ])
                    })
                })
            })
        );
    });
});
