import { describe, expect, it } from 'vitest';

import {
    sampleVideoProject,
    validateVideoProject,
    type VideoProject
} from '@magicut/video-project';

import type { AgentRunEvent } from '../src/events/agent-run-event';
import {
    createVideoCreationGraph,
    type VideoAgentTools
} from '../src/graph/create-video-creation-graph';
import type {
    AssetAnalysis,
    AssetMatchResult,
    VoiceSynthesisResult
} from '../src/tools/video-agent-tools';

const runInput = {
    prompt: 'Generate a Magicut product intro video',
    runId: 'run-test-001',
    sourceAssetDirectory: '/Users/jamie/Movies/magicut-demo/raw'
};

const brief = {
    audience: 'video creators',
    keyMessages: ['smart scene planning', 'asset matching', 'auto voiceover'],
    summary: 'Magicut product intro video',
    title: 'Magicut intelligent editing',
    tone: 'professional and upbeat',
    visualStyle: 'bright technology'
};

const scenes = [
    {
        durationMs: 3000,
        goal: 'show the product opening',
        id: 'scene-001',
        index: 1,
        script: 'Magicut makes video creation faster',
        subtitleLines: ['Magicut makes video creation faster'],
        title: 'Opening',
        visualIntent: 'product interface and timeline'
    }
];

const assets: AssetAnalysis[] = [
    {
        assetId: 'video-001',
        description: 'product interface screen recording',
        durationMs: 3000
    }
];

const matches: AssetMatchResult[] = [
    {
        rankedAssetIds: [
            {
                assetId: 'video-001',
                reason: 'matches the product interface scene',
                score: 0.96
            }
        ],
        sceneId: 'scene-001'
    }
];

const voices: VoiceSynthesisResult[] = [
    {
        assetId: 'voice-001',
        durationMs: 3000,
        lineIndex: 0,
        path: '/tmp/magicut/voice-001.mp3',
        sceneId: 'scene-001',
        text: 'Magicut makes video creation faster'
    }
];

const createFakeTools = ({
    invalidProject = false,
    withStreamReport = false
}: {
    invalidProject?: boolean;
    withStreamReport?: boolean;
} = {}) => {
    const calls: string[] = [];
    const tools: VideoAgentTools = {
        analyzeAssets: async () => {
            calls.push('analyzeAssets');
            return assets;
        },
        assembleTimeline: async () => {
            calls.push('assembleTimeline');

            if (invalidProject) {
                return {
                    ...sampleVideoProject,
                    schemaVersion: 'invalid-version'
                } as unknown as VideoProject;
            }

            return sampleVideoProject;
        },
        generateCreativeBrief: async () => {
            calls.push('generateCreativeBrief');
            return brief;
        },
        matchAssets: async () => {
            calls.push('matchAssets');
            return matches;
        },
        planScenes: async () => {
            calls.push('planScenes');
            return scenes;
        },
        saveProject: async ({ project }) => {
            calls.push('saveProject');
            return {
                path: `/tmp/magicut/${project.project.id}.json`,
                project
            };
        },
        scanAssets: async () => {
            calls.push('scanAssets');
            return assets;
        },
        synthesizeVoice: async () => {
            calls.push('synthesizeVoice');
            return voices;
        },
        validateProject: async ({ project }) => {
            calls.push('validateProject');
            const result = validateVideoProject(project);

            if (result.success === false) {
                return {
                    error: result.issues[0] ?? 'Invalid project',
                    success: false
                };
            }

            return { success: true };
        }
    };

    if (withStreamReport) {
        tools.streamReport = async (_input, emitDelta) => {
            calls.push('streamReport');
            await emitDelta('我会先理解文稿，');
            await emitDelta('再拆成可执行分镜。');

            return '我会先理解文稿，再拆成可执行分镜。';
        };
    }

    return { calls, tools };
};

const collectEvents = () => {
    const events: AgentRunEvent[] = [];

    return {
        emit: (event: AgentRunEvent) => {
            events.push(event);
        },
        events
    };
};

describe('video creation graph', () => {
    it('pauses for scene approval before matching assets', async () => {
        const { calls, tools } = createFakeTools();
        const { emit, events } = collectEvents();
        const graph = createVideoCreationGraph({ emit, tools });

        const result = await graph.start(runInput);

        expect(result.status).toBe('waiting_for_approval');
        expect(result.approval?.type).toBe('scene-plan');
        expect(result.state?.scenes).toEqual(scenes);
        expect(calls).toEqual([
            'scanAssets',
            'analyzeAssets',
            'generateCreativeBrief',
            'planScenes'
        ]);
        expect(events.map((event) => event.type)).toContain(
            'approval.required'
        );
        expect(events[0]).toMatchObject({
            runId: 'run-test-001',
            sequence: 1,
            type: 'run.started'
        });
    });

    it('emits public model stream reports around graph stages when supported', async () => {
        const { tools } = createFakeTools({ withStreamReport: true });
        const { emit, events } = collectEvents();
        const graph = createVideoCreationGraph({ emit, tools });

        await graph.start(runInput);

        expect(events).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    messageId: 'creative_brief-content-understanding',
                    nodeName: 'creative_brief',
                    title: '内容理解',
                    type: 'model.stream.started'
                }),
                expect.objectContaining({
                    delta: '我会先理解文稿，',
                    messageId: 'creative_brief-content-understanding',
                    nodeName: 'creative_brief',
                    type: 'model.stream.delta'
                }),
                expect.objectContaining({
                    messageId: 'scene_planner-storyboard-breakdown',
                    nodeName: 'scene_planner',
                    type: 'model.stream.completed'
                })
            ])
        );
    });

    it('resumes after scene approval and outputs a valid VideoProject', async () => {
        const { calls, tools } = createFakeTools();
        const { emit, events } = collectEvents();
        const graph = createVideoCreationGraph({ emit, tools });

        await graph.start(runInput);
        const result = await graph.resume({
            approval: {
                approved: true
            },
            runId: runInput.runId
        });

        expect(result.status).toBe('completed');
        expect(validateVideoProject(result.project).success).toBe(true);
        expect(result.savedProjectPath).toBe(
            `/tmp/magicut/${sampleVideoProject.project.id}.json`
        );
        expect(calls).toContain('matchAssets');
        expect(calls).toContain('synthesizeVoice');
        expect(calls).toContain('saveProject');
        expect(events.map((event) => event.type)).toEqual(
            expect.arrayContaining([
                'run.started',
                'node.started',
                'node.completed',
                'approval.required',
                'run.completed'
            ])
        );
    });

    it('returns readable validation errors and emits run.failed', async () => {
        const { tools } = createFakeTools({ invalidProject: true });
        const { emit, events } = collectEvents();
        const graph = createVideoCreationGraph({ emit, tools });

        await graph.start(runInput);
        const result = await graph.resume({
            approval: {
                approved: true
            },
            runId: runInput.runId
        });

        expect(result.status).toBe('failed');
        expect(result.errors[0]).toContain('schemaVersion');
        expect(events.at(-1)).toMatchObject({
            runId: runInput.runId,
            type: 'run.failed'
        });
    });

    it('redacts API-like secrets from failed event payloads', async () => {
        const { tools } = createFakeTools();
        const { emit, events } = collectEvents();
        const graph = createVideoCreationGraph({
            emit,
            tools: {
                ...tools,
                matchAssets: async () => {
                    throw new Error(
                        'provider failed with ark-sensitive-token-123456'
                    );
                }
            }
        });

        await graph.start(runInput);
        const result = await graph.resume({
            approval: {
                approved: true
            },
            runId: runInput.runId
        });

        expect(result.status).toBe('failed');
        expect(JSON.stringify(events)).not.toContain(
            'ark-sensitive-token-123456'
        );
        expect(JSON.stringify(events)).toContain('[REDACTED]');
    });
});
