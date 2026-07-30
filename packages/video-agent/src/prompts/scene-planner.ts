import { z } from 'zod';

export const PlannedSceneSchema = z.object({
    durationMs: z.number().int().positive(),
    goal: z.string().min(1),
    id: z.string().min(1),
    index: z.number().int().positive(),
    script: z.string().min(1),
    subtitleLines: z.array(z.string().min(1)).min(1),
    title: z.string().min(1),
    visualIntent: z.string().min(1)
});

export const ScenePlanResponseSchema = z.object({
    scenes: z.array(PlannedSceneSchema).min(1)
});

export type PlannedScene = z.infer<typeof PlannedSceneSchema>;

export type ScenePlanInput = {
    brief: unknown;
    targetSceneCount?: number;
};

export const buildScenePlannerPrompt = ({
    brief,
    targetSceneCount
}: ScenePlanInput): string =>
    [
        '你是 Magicut 的视频分镜规划智能体。',
        '根据创意 brief 输出严格 JSON，不要包含 Markdown。',
        'JSON 字段：scenes，每个分镜包含 id, index, title, goal, script, subtitleLines, visualIntent, durationMs。',
        `目标分镜数量：${targetSceneCount ?? '由内容决定'}`,
        `创意 brief：${JSON.stringify(brief)}`
    ].join('\n');
