import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import {
    validateVideoProject,
    type VideoProject
} from '@magicut/video-project';

export type VideoProjectStoreErrorCode =
    | 'READ_FAILED'
    | 'VALIDATION_FAILED'
    | 'WRITE_FAILED';

export type VideoProjectStoreError = {
    code: VideoProjectStoreErrorCode;
    message: string;
};

export type VideoProjectOperationResult<T> =
    | {
          data: T;
          success: true;
      }
    | {
          error: VideoProjectStoreError;
          success: false;
      };

export type VideoProjectFileResult = {
    filePath: string;
    project: VideoProject;
};

export type VideoProjectStore = {
    createProject: (input: {
        project: unknown;
    }) => Promise<VideoProjectOperationResult<VideoProjectFileResult>>;
    readProject: (input: {
        filePath: string;
    }) => Promise<VideoProjectOperationResult<VideoProject>>;
    readProjectById: (input: {
        projectId: string;
    }) => Promise<VideoProjectOperationResult<VideoProject>>;
    saveProject: (input: {
        filePath: string;
        project: unknown;
    }) => Promise<VideoProjectOperationResult<VideoProject>>;
    validateProject: (input: {
        project: unknown;
    }) => VideoProjectOperationResult<VideoProject>;
};

const toError = ({
    code,
    error
}: {
    code: VideoProjectStoreErrorCode;
    error: unknown;
}): VideoProjectStoreError => {
    if (error instanceof Error) {
        return {
            code,
            message: error.message
        };
    }

    return {
        code,
        message: String(error)
    };
};

const toValidationError = (issues: string[]): VideoProjectStoreError => {
    return {
        code: 'VALIDATION_FAILED',
        message: issues.join('\n')
    };
};

const failure = <T>(
    error: VideoProjectStoreError
): VideoProjectOperationResult<T> => {
    return {
        error,
        success: false
    };
};

const createProjectFileName = (project: VideoProject) => {
    const safeProjectId = project.project.id.replace(/[^a-zA-Z0-9_-]/g, '-');

    return `${safeProjectId}.magicut.json`;
};

const serializeProject = (project: VideoProject) => {
    return `${JSON.stringify(project, null, 4)}\n`;
};

export const createVideoProjectStore = ({
    projectsDirectory
}: {
    projectsDirectory: string;
}): VideoProjectStore => {
    const validateProject: VideoProjectStore['validateProject'] = ({
        project
    }) => {
        const result = validateVideoProject(project);

        if (result.success === false) {
            return failure(toValidationError(result.issues));
        }

        return {
            data: result.data,
            success: true
        };
    };

    const saveProject: VideoProjectStore['saveProject'] = async ({
        filePath,
        project
    }) => {
        const result = validateProject({ project });

        if (result.success === false) {
            return result;
        }

        try {
            await mkdir(path.dirname(filePath), { recursive: true });
            await writeFile(filePath, serializeProject(result.data), 'utf8');

            return {
                data: result.data,
                success: true
            };
        } catch (error) {
            return failure(
                toError({
                    code: 'WRITE_FAILED',
                    error
                })
            );
        }
    };

    const readProject: VideoProjectStore['readProject'] = async ({
        filePath
    }) => {
        try {
            const projectContent = await readFile(filePath, 'utf8');
            const project = JSON.parse(projectContent) as unknown;

            return validateProject({ project });
        } catch (error) {
            if (error instanceof SyntaxError) {
                return failure(
                    toError({
                        code: 'VALIDATION_FAILED',
                        error
                    })
                );
            }

            return failure(
                toError({
                    code: 'READ_FAILED',
                    error
                })
            );
        }
    };

    return {
        createProject: async ({ project }) => {
            const result = validateProject({ project });

            if (result.success === false) {
                return failure(result.error);
            }

            const filePath = path.join(
                projectsDirectory,
                createProjectFileName(result.data)
            );
            const saved = await saveProject({
                filePath,
                project: result.data
            });

            if (saved.success === false) {
                return failure(saved.error);
            }

            return {
                data: {
                    filePath,
                    project: saved.data
                },
                success: true
            };
        },
        readProject,
        readProjectById: async ({ projectId }) => {
            const filePath = path.join(
                projectsDirectory,
                `${projectId.replace(/[^a-zA-Z0-9_-]/g, '-')}.magicut.json`
            );

            return readProject({ filePath });
        },
        saveProject,
        validateProject
    };
};
