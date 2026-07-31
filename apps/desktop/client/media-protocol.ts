import { net, protocol } from 'electron';
import { pathToFileURL } from 'node:url';

import type { VideoProject } from '@magicut/video-project';

import {
    type MediaAssetKind,
    mediaProtocolScheme,
    parseMediaAssetUrl
} from '../shared/media-protocol';

import type { VideoProjectStore } from './video-project-store';

export const mediaProtocolPrivilege = {
    privileges: {
        secure: true,
        standard: true,
        stream: true,
        supportFetchAPI: true
    },
    scheme: mediaProtocolScheme
} as const;

type MediaProtocolModule = {
    handle: (
        scheme: string,
        handler: (request: Request) => Promise<Response>
    ) => void;
};

type FetchMediaFile = (input: {
    filePath: string;
    request: Request;
}) => Promise<Response>;

export const registerMediaProtocolSchemePrivileges = () => {
    protocol.registerSchemesAsPrivileged([mediaProtocolPrivilege]);
};

const createTextResponse = (body: string, status: number) =>
    new Response(body, { status });

const resolveProjectMediaPath = ({
    assetId,
    kind,
    project
}: {
    assetId: string;
    kind: MediaAssetKind;
    project: VideoProject;
}) => {
    if (kind === 'video') {
        return project.assets.videos.find((asset) => asset.id === assetId)
            ?.path;
    }

    if (kind === 'voice') {
        return project.assets.voices.find((asset) => asset.id === assetId)
            ?.path;
    }

    return project.assets.thumbnails.find((asset) => asset.id === assetId)
        ?.path;
};

const defaultFetchMediaFile: FetchMediaFile = ({ filePath, request }) =>
    net.fetch(pathToFileURL(filePath).toString(), {
        headers: request.headers
    });

export const createMediaProtocolHandler = ({
    fetchMediaFile = defaultFetchMediaFile,
    store
}: {
    fetchMediaFile?: FetchMediaFile;
    store: VideoProjectStore;
}) => {
    return async (request: Request) => {
        const mediaRequest = parseMediaAssetUrl(request.url);

        if (!mediaRequest) {
            return createTextResponse('Malformed media URL', 400);
        }

        const project = await store.readProjectById({
            projectId: mediaRequest.projectId
        });

        if (project.success === false) {
            return createTextResponse('Project not found', 404);
        }

        const filePath = resolveProjectMediaPath({
            assetId: mediaRequest.assetId,
            kind: mediaRequest.kind,
            project: project.data
        });

        if (!filePath) {
            return createTextResponse('Media asset not found', 404);
        }

        return fetchMediaFile({
            filePath,
            request
        });
    };
};

export const registerMediaProtocol = ({
    protocolModule = protocol,
    store
}: {
    protocolModule?: MediaProtocolModule;
    store: VideoProjectStore;
}) => {
    protocolModule.handle(
        mediaProtocolScheme,
        createMediaProtocolHandler({ store })
    );
};
