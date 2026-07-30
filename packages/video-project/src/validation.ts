import { VideoProjectSchema } from './schema';
import type { VideoProjectValidationResult } from './types';

export class VideoProjectValidationError extends Error {
    constructor(readonly issues: string[]) {
        super(issues.join('\n'));
        this.name = 'VideoProjectValidationError';
    }
}

export const validateVideoProject = (
    value: unknown
): VideoProjectValidationResult => {
    const result = VideoProjectSchema.safeParse(value);

    if (result.success === false) {
        return {
            issues: result.error.issues.map((issue) => issue.message),
            success: false
        };
    }

    return {
        data: result.data,
        success: true
    };
};

export const assertVideoProject = (value: unknown) => {
    const result = validateVideoProject(value);

    if (result.success === false) {
        throw new VideoProjectValidationError(result.issues);
    }

    return result.data;
};
