import { contextBridge, ipcRenderer } from 'electron';

import type { VideoProject } from '@magicut/video-project';

import { videoProjectIpcChannels } from './video-project-channels';

contextBridge.exposeInMainWorld('magicutAPI', {
    ping: async () => ({ success: true }),
    videoProject: {
        create: async (project: VideoProject) =>
            ipcRenderer.invoke(videoProjectIpcChannels.create, { project }),
        read: async (filePath: string) =>
            ipcRenderer.invoke(videoProjectIpcChannels.read, { filePath }),
        save: async ({
            filePath,
            project
        }: {
            filePath: string;
            project: VideoProject;
        }) =>
            ipcRenderer.invoke(videoProjectIpcChannels.save, {
                filePath,
                project
            }),
        validate: async (project: unknown) =>
            ipcRenderer.invoke(videoProjectIpcChannels.validate, { project })
    }
});
