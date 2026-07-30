import { describe, expect, it } from 'vitest';
import type { ZodType } from 'zod';

import type { AgentEnv } from '../src/config/load-agent-env';
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

const expectJsonSchemaCall = (model: {
    structuredOutputCalls: { config: unknown; schema: unknown }[];
}) => {
    expect(model.structuredOutputCalls[0]?.config).toEqual({
        method: 'jsonSchema',
        strict: true
    });
};

describe('ArkChatModelProvider', () => {
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
