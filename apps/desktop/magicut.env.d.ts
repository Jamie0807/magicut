interface Window {
    magicutAPI: {
        ping: () => Promise<{ success: boolean }>;
        videoProject: {
            create: (
                project: import('@magicut/video-project').VideoProject
            ) => Promise<
                import('./client/video-project-store').VideoProjectOperationResult<
                    import('./client/video-project-store').VideoProjectFileResult
                >
            >;
            read: (
                filePath: string
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
