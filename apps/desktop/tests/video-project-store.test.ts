import { access, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { assertVideoProject, sampleVideoProject } from '@magicut/video-project';

import {
    createVideoProjectStore,
    type VideoProjectStore
} from '../client/video-project-store';

describe('video project store', () => {
    let tempDirectory: string;
    let store: VideoProjectStore;

    beforeEach(async () => {
        tempDirectory = await mkdtemp(
            path.join(tmpdir(), 'magicut-video-project-')
        );
        store = createVideoProjectStore({
            projectsDirectory: tempDirectory
        });
    });

    afterEach(async () => {
        await rm(tempDirectory, { force: true, recursive: true });
    });

    it('creates a project json file that can be read back and validated', async () => {
        const created = await store.createProject({
            project: sampleVideoProject
        });

        expect(created.success).toBe(true);
        if (created.success === false) {
            throw new Error(created.error.message);
        }

        expect(created.data.project.project.id).toBe(
            sampleVideoProject.project.id
        );
        expect(created.data.filePath.endsWith('.magicut.json')).toBe(true);

        const read = await store.readProject({
            filePath: created.data.filePath
        });

        expect(read.success).toBe(true);
        if (read.success) {
            expect(read.data.project.id).toBe(sampleVideoProject.project.id);
            expect(() => assertVideoProject(read.data)).not.toThrow();
        }
    });

    it('reads a saved project by project id', async () => {
        const project = {
            ...sampleVideoProject,
            project: {
                ...sampleVideoProject.project,
                id: 'project_from_langgraph_runner'
            }
        };

        const created = await store.createProject({ project });
        const read = await store.readProjectById({
            projectId: project.project.id
        });

        expect(created).toMatchObject({ success: true });
        expect(read).toMatchObject({
            data: {
                project: {
                    id: 'project_from_langgraph_runner'
                }
            },
            success: true
        });
    });

    it('saves a valid project json over an existing file', async () => {
        const created = await store.createProject({
            project: sampleVideoProject
        });

        if (created.success === false) {
            throw new Error(created.error.message);
        }

        const nextProject = structuredClone(sampleVideoProject);
        nextProject.project.title = '更新后的项目标题';

        const saved = await store.saveProject({
            filePath: created.data.filePath,
            project: nextProject
        });

        expect(saved.success).toBe(true);
        if (saved.success) {
            expect(saved.data.project.title).toBe('更新后的项目标题');
        }
    });

    it('returns a structured validation error for invalid project json', async () => {
        const invalidProject = structuredClone(sampleVideoProject);
        invalidProject.tracks[0]!.clips[0]!.endMs =
            invalidProject.tracks[0]!.clips[0]!.startMs;

        const result = await store.createProject({
            project: invalidProject
        });

        expect(result.success).toBe(false);
        if (result.success === false) {
            expect(result.error.code).toBe('VALIDATION_FAILED');
            expect(result.error.message).toContain(
                'Clip endMs must be greater than startMs'
            );
        }
    });

    it('rejects invalid json content when reading a project file', async () => {
        const filePath = path.join(tempDirectory, 'broken.magicut.json');
        await writeFile(filePath, '{ "schemaVersion": ', 'utf8');

        const result = await store.readProject({ filePath });

        expect(result.success).toBe(false);
        if (result.success === false) {
            expect(result.error.code).toBe('VALIDATION_FAILED');
        }
    });

    it('validateProject returns sanitized validation results without touching the filesystem', async () => {
        const projectsDirectory = path.join(tempDirectory, 'unused-store');
        const isolatedStore = createVideoProjectStore({ projectsDirectory });

        const result = isolatedStore.validateProject({
            project: sampleVideoProject
        });

        expect(result.success).toBe(true);
        await expect(access(projectsDirectory)).rejects.toThrow();
    });
});
