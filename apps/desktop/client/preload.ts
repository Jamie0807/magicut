import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron';

import type { VideoProject } from '@magicut/video-project';

import type {
    DesktopAgentRunEvent,
    VideoAgentApprovalInput,
    VideoAgentCancelInput,
    VideoAgentStartInput
} from '../shared/video-agent';
import { videoAgentIpcChannels } from '../shared/video-agent-channels';
import { videoProjectIpcChannels } from '../shared/video-project-channels';

contextBridge.exposeInMainWorld('magicutAPI', {
    ping: async () => ({ success: true }),
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
        start: async (input: VideoAgentStartInput) =>
            ipcRenderer.invoke(videoAgentIpcChannels.start, input)
    },
    videoProject: {
        create: async (project: VideoProject) =>
            ipcRenderer.invoke(videoProjectIpcChannels.create, { project }),
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
