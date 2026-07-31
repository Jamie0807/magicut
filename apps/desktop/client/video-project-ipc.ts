import type { IpcMain } from 'electron';
import { app } from 'electron';
import path from 'node:path';

import type { VideoProject } from '@magicut/video-project';

import { videoProjectIpcChannels } from '../shared/video-project-channels';

import {
    createVideoProjectStore,
    type VideoProjectDeleteResult,
    type VideoProjectFileResult,
    type VideoProjectOperationResult,
    type VideoProjectStore
} from './video-project-store';

export type VideoProjectCreateInput = {
    project: unknown;
};

export type VideoProjectDeleteInput = {
    projectId: string;
};

export type VideoProjectReadInput = {
    filePath: string;
};

export type VideoProjectReadByIdInput = {
    projectId: string;
};

export type VideoProjectSaveInput = {
    filePath: string;
    project: unknown;
};

export type VideoProjectValidateInput = {
    project: unknown;
};

export const createDefaultVideoProjectStore = () => {
    return createVideoProjectStore({
        projectsDirectory: path.join(app.getPath('userData'), 'video-projects')
    });
};

export const registerVideoProjectIpc = ({
    ipcMain,
    store = createDefaultVideoProjectStore()
}: {
    ipcMain: Pick<IpcMain, 'handle'>;
    store?: VideoProjectStore;
}) => {
    ipcMain.handle(
        videoProjectIpcChannels.create,
        async (_event, input: VideoProjectCreateInput) =>
            store.createProject({
                project: input.project
            })
    );

    ipcMain.handle(
        videoProjectIpcChannels.delete,
        async (_event, input: VideoProjectDeleteInput) =>
            store.deleteProject({
                projectId: input.projectId
            })
    );

    ipcMain.handle(videoProjectIpcChannels.list, async () =>
        store.listProjects()
    );

    ipcMain.handle(
        videoProjectIpcChannels.read,
        async (_event, input: VideoProjectReadInput) =>
            store.readProject({
                filePath: input.filePath
            })
    );

    ipcMain.handle(
        videoProjectIpcChannels.readById,
        async (_event, input: VideoProjectReadByIdInput) =>
            store.readProjectById({
                projectId: input.projectId
            })
    );

    ipcMain.handle(
        videoProjectIpcChannels.save,
        async (_event, input: VideoProjectSaveInput) =>
            store.saveProject({
                filePath: input.filePath,
                project: input.project
            })
    );

    ipcMain.handle(
        videoProjectIpcChannels.validate,
        (_event, input: VideoProjectValidateInput) =>
            store.validateProject({
                project: input.project
            })
    );
};

export type RendererVideoProjectApi = {
    create: (
        project: VideoProject
    ) => Promise<VideoProjectOperationResult<VideoProjectFileResult>>;
    delete: (
        projectId: string
    ) => Promise<VideoProjectOperationResult<VideoProjectDeleteResult>>;
    list: () => Promise<VideoProjectOperationResult<VideoProjectFileResult[]>>;
    read: (
        filePath: string
    ) => Promise<VideoProjectOperationResult<VideoProject>>;
    readById: (
        projectId: string
    ) => Promise<VideoProjectOperationResult<VideoProject>>;
    save: (input: {
        filePath: string;
        project: VideoProject;
    }) => Promise<VideoProjectOperationResult<VideoProject>>;
    validate: (
        project: unknown
    ) => Promise<VideoProjectOperationResult<VideoProject>>;
};
