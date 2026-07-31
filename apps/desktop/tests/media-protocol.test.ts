import { describe, expect, it } from 'vitest';

import { sampleVideoProject } from '@magicut/video-project';

import type { VideoProjectStore } from '../client/video-project-store';

describe('media protocol', () => {
    it('declares a secure streaming custom protocol for preview media', async () => {
        const { mediaProtocolPrivilege } = await import(
            '../client/media-protocol'
        );

        expect(mediaProtocolPrivilege).toEqual({
            privileges: {
                secure: true,
                standard: true,
                stream: true,
                supportFetchAPI: true
            },
            scheme: 'magicut-media'
        });
    });

    it('resolves project media URLs to files inside the main process only', async () => {
        const project = structuredClone(sampleVideoProject);
        const fetchedFiles: string[] = [];

        project.project.id = 'project_media';
        project.assets.videos[0]!.path = '/Users/jamie/Videos/scene-01.mp4';
        project.assets.voices[0]!.path =
            '/Users/jamie/Library/Application Support/magicut/voice-01.mp3';
        project.assets.thumbnails[0]!.path =
            '/Users/jamie/Library/Application Support/magicut/scene-01.jpg';

        const store = {
            readProjectById: async ({ projectId }) => {
                expect(projectId).toBe('project_media');

                return {
                    data: project,
                    success: true
                };
            }
        } as VideoProjectStore;
        const { createMediaProtocolHandler } = await import(
            '../client/media-protocol'
        );
        const handler = createMediaProtocolHandler({
            fetchMediaFile: async ({ filePath }) => {
                fetchedFiles.push(filePath);

                return new Response('media');
            },
            store
        });

        const video = await handler(
            new Request(
                'magicut-media://project/project_media/video/video_asset_001'
            )
        );
        const voice = await handler(
            new Request(
                'magicut-media://project/project_media/voice/voice_asset_001'
            )
        );
        const thumbnail = await handler(
            new Request(
                'magicut-media://project/project_media/thumbnail/thumbnail_asset_001'
            )
        );

        expect(await video.text()).toBe('media');
        expect(await voice.text()).toBe('media');
        expect(await thumbnail.text()).toBe('media');
        expect(fetchedFiles).toEqual([
            '/Users/jamie/Videos/scene-01.mp4',
            '/Users/jamie/Library/Application Support/magicut/voice-01.mp3',
            '/Users/jamie/Library/Application Support/magicut/scene-01.jpg'
        ]);
    });

    it('rejects malformed media URLs before touching the filesystem', async () => {
        const readProjectById = async () => {
            throw new Error('store should not be called');
        };
        const { createMediaProtocolHandler } = await import(
            '../client/media-protocol'
        );
        const handler = createMediaProtocolHandler({
            fetchMediaFile: async () => new Response('media'),
            store: {
                readProjectById
            } as unknown as VideoProjectStore
        });
        const response = await handler(
            new Request('magicut-media://project/project_media/other/asset_001')
        );

        expect(response.status).toBe(400);
    });
});
