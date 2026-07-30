import { z, type ZodIssue, type ZodType } from 'zod';

import { ChatOpenAI } from '@langchain/openai';

import type { AgentEnv } from '../config/load-agent-env';
import {
    type AssetMatchCandidate,
    type AssetMatchRanking,
    AssetMatchResponseSchema,
    buildAssetMatcherPrompt
} from '../prompts/asset-matcher';
import {
    buildCreativeBriefPrompt,
    type CreativeBrief,
    type CreativeBriefInput,
    CreativeBriefSchema
} from '../prompts/creative-brief';
import {
    buildFrameDescriptionPrompt,
    type FrameDescription,
    type FrameDescriptionInput,
    FrameDescriptionResponseSchema
} from '../prompts/frame-description';
import {
    buildScenePlannerPrompt,
    type PlannedScene,
    type ScenePlanInput,
    ScenePlanResponseSchema
} from '../prompts/scene-planner';

import type { ModelProvider, TextEmbedding } from './model-provider';

type ModelProviderTask =
    | 'assetMatcher'
    | 'creativeBrief'
    | 'frameDescription'
    | 'scenePlanner'
    | 'textEmbedding';

export type ArkProviderEvent = {
    baseURL: string;
    model: string;
    provider: 'ark';
    type: 'provider.configured';
};

export type StructuredChatModel = {
    withStructuredOutput: <T>(
        schema: ZodType<T>,
        config: StructuredOutputOptions
    ) => {
        invoke: (prompt: string) => Promise<unknown>;
    };
};

export type StructuredOutputMethod =
    | 'functionCalling'
    | 'jsonMode'
    | 'jsonSchema';

export type StructuredOutputOptions = {
    method: StructuredOutputMethod;
    strict?: boolean;
};

export type ArkChatModelOptions = {
    apiKey: string;
    configuration: {
        baseURL: string;
    };
    maxRetries?: number;
    model: string;
    streamUsage: false;
    timeout?: number;
};

export class ModelProviderSchemaError extends Error {
    public readonly issues: Pick<ZodIssue, 'message' | 'path'>[];
    public readonly task: ModelProviderTask;

    constructor({
        issues,
        task
    }: {
        issues: Pick<ZodIssue, 'message' | 'path'>[];
        task: ModelProviderTask;
    }) {
        super(`Model output failed schema validation for ${task}`);
        this.name = 'ModelProviderSchemaError';
        this.issues = issues;
        this.task = task;
    }
}

const createDefaultChatModel = (options: ArkChatModelOptions) =>
    new ChatOpenAI(options);

const TextEmbeddingResponseSchema = z.object({
    embeddings: z.array(
        z.object({
            embedding: z.array(z.number()),
            text: z.string().min(1)
        })
    )
});

const parseStructuredOutput = <T>({
    raw,
    schema,
    task
}: {
    raw: unknown;
    schema: ZodType<T>;
    task: ModelProviderTask;
}): T => {
    const parsed = schema.safeParse(raw);

    if (!parsed.success) {
        throw new ModelProviderSchemaError({
            issues: parsed.error.issues.map((issue) => ({
                message: issue.message,
                path: issue.path
            })),
            task
        });
    }

    return parsed.data;
};

const isZodErrorLike = (
    error: unknown
): error is { issues: Pick<ZodIssue, 'message' | 'path'>[] } =>
    Boolean(
        error &&
            typeof error === 'object' &&
            'issues' in error &&
            Array.isArray((error as { issues?: unknown }).issues)
    );

const normalizeStructuredOutputError = ({
    error,
    task
}: {
    error: unknown;
    task: ModelProviderTask;
}): never => {
    if (error instanceof ModelProviderSchemaError) {
        throw error;
    }

    if (isZodErrorLike(error)) {
        throw new ModelProviderSchemaError({
            issues: error.issues.map((issue) => ({
                message: issue.message,
                path: issue.path
            })),
            task
        });
    }

    throw error;
};

const createStructuredOutputOptions = ({
    method = 'jsonSchema',
    strict = true
}: Partial<StructuredOutputOptions> = {}): StructuredOutputOptions => {
    if (method === 'jsonMode') {
        return { method };
    }

    return {
        method,
        strict
    };
};

export class ArkChatModelProvider implements ModelProvider {
    public readonly providerName = 'ark';
    private readonly model: StructuredChatModel;
    private readonly structuredOutput: StructuredOutputOptions;

    constructor({
        createModel = createDefaultChatModel,
        emit,
        env,
        maxRetries,
        model,
        structuredOutput,
        timeout
    }: {
        createModel?: (options: ArkChatModelOptions) => StructuredChatModel;
        emit?: (event: ArkProviderEvent) => void;
        env: AgentEnv;
        maxRetries?: number;
        model?: StructuredChatModel;
        structuredOutput?: Partial<StructuredOutputOptions>;
        timeout?: number;
    }) {
        const options: ArkChatModelOptions = {
            apiKey: env.API_KEY,
            configuration: {
                baseURL: env.BASE_URL
            },
            maxRetries,
            model: env.LLM_MODEL,
            streamUsage: false,
            timeout
        };

        this.model = model ?? createModel(options);
        this.structuredOutput = createStructuredOutputOptions(structuredOutput);
        emit?.({
            baseURL: env.BASE_URL,
            model: env.LLM_MODEL,
            provider: 'ark',
            type: 'provider.configured'
        });
    }

    async describeFrames({
        frames
    }: {
        frames: FrameDescriptionInput[];
    }): Promise<FrameDescription[]> {
        const response = await this.invokeStructured({
            prompt: buildFrameDescriptionPrompt({ frames }),
            schema: FrameDescriptionResponseSchema,
            task: 'frameDescription'
        });

        return response.frames;
    }

    async embedTexts({ texts }: { texts: string[] }): Promise<TextEmbedding[]> {
        if (texts.length === 0) {
            return [];
        }

        const response = await this.invokeStructured({
            prompt: [
                '为输入文本生成可用于素材检索的 embedding JSON。',
                '输出严格 JSON，不要包含 Markdown。',
                'JSON 字段：embeddings，每项包含 text 和 embedding。',
                `文本：${JSON.stringify(texts)}`
            ].join('\n'),
            schema: TextEmbeddingResponseSchema,
            task: 'textEmbedding'
        });

        return response.embeddings;
    }

    async generateCreativeBrief(
        input: CreativeBriefInput
    ): Promise<CreativeBrief> {
        return this.invokeStructured({
            prompt: buildCreativeBriefPrompt(input),
            schema: CreativeBriefSchema,
            task: 'creativeBrief'
        });
    }

    async planScenes(input: ScenePlanInput): Promise<PlannedScene[]> {
        const response = await this.invokeStructured({
            prompt: buildScenePlannerPrompt(input),
            schema: ScenePlanResponseSchema,
            task: 'scenePlanner'
        });

        return response.scenes;
    }

    async rankAssetMatches({
        candidates,
        scenes
    }: {
        candidates: AssetMatchCandidate[];
        scenes: PlannedScene[];
    }): Promise<AssetMatchRanking[]> {
        const response = await this.invokeStructured({
            prompt: buildAssetMatcherPrompt({ candidates, scenes }),
            schema: AssetMatchResponseSchema,
            task: 'assetMatcher'
        });
        const candidateAssetIds = new Set(
            candidates.map((candidate) => candidate.assetId)
        );
        const issues = response.matches.flatMap((match, matchIndex) =>
            match.rankedAssetIds.flatMap((rankedAsset, rankedAssetIndex) =>
                candidateAssetIds.has(rankedAsset.assetId)
                    ? []
                    : [
                          {
                              message: `Matched asset id ${rankedAsset.assetId} is not in candidates`,
                              path: [
                                  'matches',
                                  matchIndex,
                                  'rankedAssetIds',
                                  rankedAssetIndex,
                                  'assetId'
                              ]
                          }
                      ]
            )
        );

        if (issues.length > 0) {
            throw new ModelProviderSchemaError({
                issues,
                task: 'assetMatcher'
            });
        }

        return response.matches;
    }

    private async invokeStructured<T>({
        prompt,
        schema,
        task
    }: {
        prompt: string;
        schema: ZodType<T>;
        task: ModelProviderTask;
    }): Promise<T> {
        let raw: unknown;

        try {
            raw = await this.model
                .withStructuredOutput(schema, this.structuredOutput)
                .invoke(prompt);
        } catch (error) {
            normalizeStructuredOutputError({ error, task });
        }

        return parseStructuredOutput({
            raw,
            schema,
            task
        });
    }
}
