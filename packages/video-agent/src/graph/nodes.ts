import { interrupt } from '@langchain/langgraph';
import { validateVideoProject } from '@magicut/video-project';

import type { AgentRunEventEmitter } from '../events/event-emitter';
import { serializeError } from '../events/event-emitter';
import type { VideoAgentTools } from '../tools/video-agent-tools';

import type {
    SceneApprovalRequest,
    SceneApprovalResume,
    VideoCreationGraphState
} from './state';

type GraphNodeUpdate = Partial<VideoCreationGraphState>;

const requireInput = (state: VideoCreationGraphState) => {
    if (!state.input) {
        throw new Error('Video creation input is required');
    }

    return state.input;
};

const requireBrief = (state: VideoCreationGraphState) => {
    if (!state.brief) {
        throw new Error('Creative brief is required');
    }

    return state.brief;
};

const requireProject = (state: VideoCreationGraphState) => {
    if (!state.project) {
        throw new Error('Video project is required');
    }

    return state.project;
};

const createInstrumentedNode =
    ({
        emit,
        nodeName,
        run
    }: {
        emit: AgentRunEventEmitter;
        nodeName: string;
        run: (state: VideoCreationGraphState) => Promise<GraphNodeUpdate>;
    }) =>
    async (state: VideoCreationGraphState): Promise<GraphNodeUpdate> => {
        emit({
            createdAt: '',
            nodeName,
            runId: state.runId,
            sequence: 0,
            type: 'node.started'
        });

        try {
            const update = await run(state);
            emit({
                createdAt: '',
                nodeName,
                runId: state.runId,
                sequence: 0,
                type: 'node.completed'
            });

            return update;
        } catch (error) {
            emit({
                createdAt: '',
                error: serializeError(error),
                nodeName,
                runId: state.runId,
                sequence: 0,
                type: 'node.failed'
            });
            throw error;
        }
    };

export const createVideoCreationNodes = ({
    emit,
    tools
}: {
    emit: AgentRunEventEmitter;
    tools: VideoAgentTools;
}) => ({
    analyzeAssets: createInstrumentedNode({
        emit,
        nodeName: 'asset_understand',
        run: async (state) => ({
            assets: await tools.analyzeAssets({
                assets: state.assets,
                input: requireInput(state)
            })
        })
    }),
    assembleTimeline: createInstrumentedNode({
        emit,
        nodeName: 'timeline_assemble',
        run: async (state) => ({
            project: await tools.assembleTimeline({
                assets: state.assets,
                brief: requireBrief(state),
                input: requireInput(state),
                matches: state.matches,
                scenes: state.scenes,
                voices: state.voices
            })
        })
    }),
    creativeBrief: createInstrumentedNode({
        emit,
        nodeName: 'creative_brief',
        run: async (state) => ({
            brief: await tools.generateCreativeBrief({
                assets: state.assets,
                input: requireInput(state)
            })
        })
    }),
    matchAssets: createInstrumentedNode({
        emit,
        nodeName: 'asset_matcher',
        run: async (state) => ({
            matches: await tools.matchAssets({
                assets: state.assets,
                input: requireInput(state),
                scenes: state.scenes
            })
        })
    }),
    planScenes: createInstrumentedNode({
        emit,
        nodeName: 'scene_planner',
        run: async (state) => ({
            scenes: await tools.planScenes({
                assets: state.assets,
                brief: requireBrief(state),
                input: requireInput(state)
            })
        })
    }),
    saveProject: createInstrumentedNode({
        emit,
        nodeName: 'project_save',
        run: async (state) => ({
            savedProjectPath: (
                await tools.saveProject({
                    project: requireProject(state)
                })
            ).path
        })
    }),
    scanAssets: createInstrumentedNode({
        emit,
        nodeName: 'asset_scan',
        run: async (state) => ({
            assets: await tools.scanAssets({
                input: requireInput(state)
            })
        })
    }),
    sceneApproval: createInstrumentedNode({
        emit,
        nodeName: 'scene_approval',
        run: async (state) => {
            const approval = interrupt<
                SceneApprovalRequest,
                SceneApprovalResume
            >({
                payload: {
                    brief: state.brief,
                    scenes: state.scenes
                },
                type: 'scene-plan'
            });

            if (!approval.approved) {
                throw new Error('Scene plan approval was rejected');
            }

            return {};
        }
    }),
    synthesizeVoice: createInstrumentedNode({
        emit,
        nodeName: 'tts',
        run: async (state) => ({
            voices: await tools.synthesizeVoice({
                brief: requireBrief(state),
                input: requireInput(state),
                scenes: state.scenes
            })
        })
    }),
    validateProject: createInstrumentedNode({
        emit,
        nodeName: 'validation',
        run: async (state) => {
            const project = requireProject(state);
            const localValidation = validateVideoProject(project);

            if (localValidation.success === false) {
                throw new Error(localValidation.issues.join('; '));
            }

            const toolValidation = await tools.validateProject({ project });

            if (toolValidation.success === false) {
                throw new Error(toolValidation.error);
            }

            return {};
        }
    })
});
