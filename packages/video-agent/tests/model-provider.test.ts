import { describe, expect, it } from 'vitest';
import type { ZodType } from 'zod';

import type { AgentEnv } from '../src/config/load-agent-env';
import { buildScenePlannerPrompt } from '../src/prompts/scene-planner';
import {
    ArkChatModelProvider,
    ModelProviderSchemaError,
    type StructuredChatModel
} from '../src/providers/ark-chat-model-provider';

const agentEnv: AgentEnv = {
    API_KEY: 'test-provider-token',
    BASE_URL: 'https://ark.cn-beijing.volces.com/api/plan/v3',
    LLM_MODEL: 'doubao-seed-2.0-pro',
    TTS_MODEL: 'seed-tts-2.0'
};

class FakeStructuredChatModel implements StructuredChatModel {
    public readonly prompts: string[] = [];
    public readonly structuredOutputCalls: {
        config: unknown;
        schema: unknown;
    }[] = [];

    constructor(private readonly outputs: unknown[]) {}

    withStructuredOutput<T>(schema: ZodType<T>, config: unknown) {
        this.structuredOutputCalls.push({ config, schema });

        return {
            invoke: async (prompt: string) => {
                this.prompts.push(prompt);
                const output = this.outputs.shift();

                return schema.parse(output);
            }
        };
    }

    async invoke() {
        throw new Error(
            'FakeStructuredChatModel.invoke should not be called directly'
        );
    }
}

class FakeRawChatModel implements StructuredChatModel {
    public readonly prompts: string[] = [];
    public readonly structuredOutputCalls: {
        config: unknown;
        schema: unknown;
    }[] = [];

    constructor(private readonly outputs: unknown[]) {}

    withStructuredOutput<T>(schema: ZodType<T>, config: unknown) {
        this.structuredOutputCalls.push({ config, schema });

        return {
            invoke: async (prompt: string) => {
                this.prompts.push(prompt);

                return this.outputs.shift();
            }
        };
    }

    async invoke() {
        throw new Error(
            'FakeRawChatModel.invoke should not be called directly'
        );
    }
}

class FakeUnavailableStructuredOutputModel implements StructuredChatModel {
    async invoke() {
        throw new Error(
            'Legacy direct invoke is intentionally unsupported for structured output'
        );
    }

    withStructuredOutput(): never {
        throw new Error('withStructuredOutput is unavailable');
    }
}

class FakeStreamingChatModel extends FakeStructuredChatModel {
    async *stream(prompt: string) {
        this.prompts.push(prompt);
        yield {
            content: '第一段'
        };
        yield {
            content: [
                {
                    text: '第二段'
                },
                '第三段'
            ]
        };
        yield {
            content: 42
        };
    }
}

const expectJsonSchemaCall = (model: {
    structuredOutputCalls: { config: unknown; schema: unknown }[];
}) => {
    expect(model.structuredOutputCalls[0]?.config).toEqual({
        method: 'jsonSchema',
        strict: true
    });
};

describe('ArkChatModelProvider', () => {
    it('instructs scene planning to output spoken narration copy for subtitle lines', () => {
        const prompt = buildScenePlannerPrompt({
            brief: {
                summary: '介绍 Magicut 智能剪辑'
            },
            targetSceneCount: 3
        });

        expect(prompt).toContain(
            'subtitleLines 必须是可以直接朗读给 TTS 的口播稿'
        );
        expect(prompt).toContain(
            '不要写分镜说明、镜头动作、标题、编号、冒号式结构'
        );
        expect(prompt).toContain('script 必须等于 subtitleLines 按换行拼接');
        expect(prompt).toContain('分镜数量不要固定');
        expect(prompt).toContain('每个分镜通常保留 1 到 3 条 subtitleLines');
    });

    it('uses LangChain structured output for creative brief generation', async () => {
        const model = new FakeStructuredChatModel([
            {
                audience: 'creators',
                keyMessages: ['save editing time', 'auto-generate scenes'],
                summary: 'A product video about intelligent editing',
                title: 'Magicut intelligent editing',
                tone: 'professional',
                visualStyle: 'bright technology'
            }
        ]);
        const provider = new ArkChatModelProvider({
            env: agentEnv,
            model
        });

        const brief = await provider.generateCreativeBrief({
            prompt: 'Create a product launch video',
            sourceAssetSummaries: ['screen recording', 'talking head']
        });

        expect(brief.title).toBe('Magicut intelligent editing');
        expect(brief.keyMessages).toEqual([
            'save editing time',
            'auto-generate scenes'
        ]);
        expect(model.prompts[0]).toContain('Create a product launch video');
        expectJsonSchemaCall(model);
    });

    it('streams public report chunks and returns the accumulated report', async () => {
        const model = new FakeStreamingChatModel([]);
        const provider = new ArkChatModelProvider({
            env: agentEnv,
            model
        });
        const deltas: string[] = [];

        const report = await provider.streamReport(
            {
                context: '素材数量：3',
                prompt: '介绍 Magicut 智能剪辑',
                title: '内容理解'
            },
            (delta) => {
                deltas.push(delta);
            }
        );

        expect(report).toBe('第一段第二段第三段');
        expect(deltas).toEqual(['第一段', '第二段第三段']);
        expect(model.prompts.at(-1)).toContain('Magicut');
        expect(model.prompts.at(-1)).toContain('不要输出隐藏推理链');
        expect(model.prompts.at(-1)).toContain('介绍 Magicut 智能剪辑');
    });

    it('rejects public report streaming when the chat model has no stream API', async () => {
        const provider = new ArkChatModelProvider({
            env: agentEnv,
            model: new FakeStructuredChatModel([])
        });

        await expect(
            provider.streamReport(
                {
                    prompt: '介绍 Magicut',
                    title: '内容理解'
                },
                () => undefined
            )
        ).rejects.toThrow('Chat model does not support streaming');
    });

    it('normalizes structured output schema errors', async () => {
        const provider = new ArkChatModelProvider({
            env: agentEnv,
            model: new FakeStructuredChatModel([
                {
                    title: 'missing fields'
                }
            ])
        });

        await expect(
            provider.generateCreativeBrief({
                prompt: 'Create a product launch video',
                sourceAssetSummaries: []
            })
        ).rejects.toMatchObject({
            issues: expect.arrayContaining([
                expect.objectContaining({
                    path: ['summary']
                })
            ]),
            task: 'creativeBrief'
        });
        await expect(
            provider.generateCreativeBrief({
                prompt: 'Create a product launch video',
                sourceAssetSummaries: []
            })
        ).rejects.toBeInstanceOf(ModelProviderSchemaError);
    });

    it('keeps provider boundary validation after LangChain structured output returns data', async () => {
        const provider = new ArkChatModelProvider({
            env: agentEnv,
            model: new FakeRawChatModel([
                {
                    title: 'missing fields'
                }
            ])
        });

        await expect(
            provider.generateCreativeBrief({
                prompt: 'Create a product launch video',
                sourceAssetSummaries: []
            })
        ).rejects.toBeInstanceOf(ModelProviderSchemaError);
    });

    it('rejects ranked asset matches that reference assets outside the candidate set', async () => {
        const model = new FakeStructuredChatModel([
            {
                matches: [
                    {
                        rankedAssetIds: [
                            {
                                assetId: 'video-missing',
                                reason: 'looks relevant',
                                score: 0.91
                            }
                        ],
                        sceneId: 'scene-001'
                    }
                ]
            }
        ]);
        const provider = new ArkChatModelProvider({
            env: agentEnv,
            model
        });

        await expect(
            provider.rankAssetMatches({
                candidates: [
                    {
                        assetId: 'video-001',
                        description: 'product interface',
                        durationMs: 3000
                    }
                ],
                scenes: [
                    {
                        durationMs: 3000,
                        goal: 'show the product',
                        id: 'scene-001',
                        index: 1,
                        script: 'Magicut makes editing faster',
                        subtitleLines: ['Magicut makes editing faster'],
                        title: 'opening',
                        visualIntent: 'product interface'
                    }
                ]
            })
        ).rejects.toMatchObject({
            issues: expect.arrayContaining([
                expect.objectContaining({
                    message:
                        'Matched asset id video-missing is not in candidates'
                })
            ]),
            task: 'assetMatcher'
        });
        expectJsonSchemaCall(model);
    });

    it('allows jsonMode fallback to be configured for OpenAI-compatible providers', async () => {
        const model = new FakeRawChatModel([
            {
                audience: 'creators',
                keyMessages: ['save editing time'],
                summary: 'A product video',
                title: 'Magicut',
                tone: 'professional',
                visualStyle: 'technology'
            }
        ]);
        const provider = new ArkChatModelProvider({
            env: agentEnv,
            model,
            structuredOutput: {
                method: 'jsonMode'
            }
        });

        await provider.generateCreativeBrief({
            prompt: 'Create a product launch video',
            sourceAssetSummaries: []
        });

        expect(model.structuredOutputCalls[0]?.config).toEqual({
            method: 'jsonMode'
        });
    });

    it('fails fast when a model does not expose withStructuredOutput', async () => {
        const provider = new ArkChatModelProvider({
            env: agentEnv,
            model: new FakeUnavailableStructuredOutputModel()
        });

        await expect(
            provider.generateCreativeBrief({
                prompt: 'Create a product launch video',
                sourceAssetSummaries: []
            })
        ).rejects.toThrow('withStructuredOutput is unavailable');
    });

    it('initializes ChatOpenAI-compatible options and emits sanitized provider events', () => {
        const events: unknown[] = [];
        const provider = new ArkChatModelProvider({
            createModel: (options) => {
                expect(options).toMatchObject({
                    apiKey: 'test-provider-token',
                    configuration: {
                        baseURL: 'https://ark.cn-beijing.volces.com/api/plan/v3'
                    },
                    model: 'doubao-seed-2.0-pro',
                    streamUsage: false
                });

                return new FakeStructuredChatModel([]);
            },
            emit: (event) => {
                events.push(event);
            },
            env: agentEnv
        });

        expect(provider.providerName).toBe('ark');
        expect(JSON.stringify(events)).not.toContain('test-provider-token');
        expect(events).toEqual([
            {
                baseURL: 'https://ark.cn-beijing.volces.com/api/plan/v3',
                model: 'doubao-seed-2.0-pro',
                provider: 'ark',
                type: 'provider.configured'
            }
        ]);
    });
});
