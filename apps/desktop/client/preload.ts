import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron';

import type { VideoProject } from '@magicut/video-project';

import type {
    DesktopAgentRunEvent,
    VideoAgentApprovalInput,
    VideoAgentCancelInput,
    VideoAgentRegenerateSceneInput,
    VideoAgentRegenerateVoicesInput,
    VideoAgentStartInput
} from '../shared/video-agent';
import { videoAgentIpcChannels } from '../shared/video-agent-channels';
import type {
    VideoExportProgressEvent,
    VideoExportRenderInput,
    VideoExportSelectOutputPathInput
} from '../shared/video-export';
import { videoExportIpcChannels } from '../shared/video-export-channels';
import { videoProjectIpcChannels } from '../shared/video-project-channels';

contextBridge.exposeInMainWorld('magicutAPI', {
    ping: async () => ({ success: true }),
    videoExport: {
        onProgress: (listener: (event: VideoExportProgressEvent) => void) => {
            const subscription = (
                _event: IpcRendererEvent,
                event: VideoExportProgressEvent
            ) => {
                listener(event);
            };

            ipcRenderer.on(videoExportIpcChannels.progress, subscription);

            return () => {
                ipcRenderer.removeListener(
                    videoExportIpcChannels.progress,
                    subscription
                );
            };
        },
        render: async (input: VideoExportRenderInput) =>
            ipcRenderer.invoke(videoExportIpcChannels.render, input),
        selectOutputPath: async (input: VideoExportSelectOutputPathInput) =>
            ipcRenderer.invoke(videoExportIpcChannels.selectOutputPath, input)
    },
    videoAgent: {
        approve: async (input: VideoAgentApprovalInput) =>
            ipcRenderer.invoke(videoAgentIpcChannels.approve, input),
        cancel: async (input: VideoAgentCancelInput) =>
            ipcRenderer.invoke(videoAgentIpcChannels.cancel, input),
        onEvent: (listener: (event: DesktopAgentRunEvent) => void) => {
            const subscription = (
                _event: IpcRendererEvent,
                event: DesktopAgentRunEvent
            ) => {
                listener(event);
            };

            ipcRenderer.on(videoAgentIpcChannels.event, subscription);

            return () => {
                ipcRenderer.removeListener(
                    videoAgentIpcChannels.event,
                    subscription
                );
            };
        },
        regenerateScene: async (input: VideoAgentRegenerateSceneInput) =>
            ipcRenderer.invoke(videoAgentIpcChannels.regenerateScene, input),
        regenerateVoices: async (input: VideoAgentRegenerateVoicesInput) =>
            ipcRenderer.invoke(videoAgentIpcChannels.regenerateVoices, input),
        start: async (input: VideoAgentStartInput) =>
            ipcRenderer.invoke(videoAgentIpcChannels.start, input)
    },
    videoProject: {
        create: async (project: VideoProject) =>
            ipcRenderer.invoke(videoProjectIpcChannels.create, { project }),
        delete: async (projectId: string) =>
            ipcRenderer.invoke(videoProjectIpcChannels.delete, { projectId }),
        list: async () => ipcRenderer.invoke(videoProjectIpcChannels.list),
        read: async (filePath: string) =>
            ipcRenderer.invoke(videoProjectIpcChannels.read, { filePath }),
        readById: async (projectId: string) =>
            ipcRenderer.invoke(videoProjectIpcChannels.readById, {
                projectId
            }),
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
