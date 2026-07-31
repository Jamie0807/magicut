interface Window {
    magicutAPI: {
        ping: () => Promise<{ success: boolean }>;
        videoAgent: {
            approve: (
                input: import('./shared/video-agent').VideoAgentApprovalInput
            ) => Promise<
                import('./shared/video-agent').VideoAgentOperationResult<
                    import('./shared/video-agent').VideoAgentResultData
                >
            >;
            cancel: (
                input: import('./shared/video-agent').VideoAgentCancelInput
            ) => Promise<
                import('./shared/video-agent').VideoAgentOperationResult<
                    import('./shared/video-agent').VideoAgentResultData
                >
            >;
            onEvent: (
                listener: (
                    event: import('./shared/video-agent').DesktopAgentRunEvent
                ) => void
            ) => () => void;
            start: (
                input: import('./shared/video-agent').VideoAgentStartInput
            ) => Promise<
                import('./shared/video-agent').VideoAgentOperationResult<
                    import('./shared/video-agent').VideoAgentResultData
                >
            >;
        };
        videoProject: {
            create: (
                project: import('@magicut/video-project').VideoProject
            ) => Promise<
                import('./client/video-project-store').VideoProjectOperationResult<
                    import('./client/video-project-store').VideoProjectFileResult
                >
            >;
            delete: (
                projectId: string
            ) => Promise<
                import('./client/video-project-store').VideoProjectOperationResult<
                    import('./client/video-project-store').VideoProjectDeleteResult
                >
            >;
            list: () => Promise<
                import('./client/video-project-store').VideoProjectOperationResult<
                    import('./client/video-project-store').VideoProjectFileResult[]
                >
            >;
            read: (
                filePath: string
            ) => Promise<
                import('./client/video-project-store').VideoProjectOperationResult<
                    import('@magicut/video-project').VideoProject
                >
            >;
            readById: (
                projectId: string
            ) => Promise<
                import('./client/video-project-store').VideoProjectOperationResult<
                    import('@magicut/video-project').VideoProject
                >
            >;
            save: (input: {
                filePath: string;
                project: import('@magicut/video-project').VideoProject;
            }) => Promise<
                import('./client/video-project-store').VideoProjectOperationResult<
                    import('@magicut/video-project').VideoProject
                >
            >;
            validate: (
                project: unknown
            ) => Promise<
                import('./client/video-project-store').VideoProjectOperationResult<
                    import('@magicut/video-project').VideoProject
                >
            >;
        };
    };
}

declare module '*.vue' {
    import type { DefineComponent } from 'vue';

    const component: DefineComponent<object, object, unknown>;
    export default component;
}

declare module '*.png' {
    const src: string;
    export default src;
}
