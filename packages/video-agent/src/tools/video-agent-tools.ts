import type { VideoProject } from '@magicut/video-project';

import type { CreativeBrief } from '../prompts/creative-brief';
import type { PlannedScene } from '../prompts/scene-planner';

export type AssetAnalysis = {
    assetId: string;
    description: string;
    durationMs: number;
};

export type AssetMatchResult = {
    rankedAssetIds: {
        assetId: string;
        reason: string;
        score: number;
    }[];
    sceneId: string;
};

export type VoiceSynthesisResult = {
    assetId: string;
    durationMs: number;
    path: string;
    sceneId: string;
};

export type VideoCreationInput = {
    prompt: string;
    runId: string;
    sourceAssetDirectory: string;
};

export type ProjectValidationResult =
    | {
          success: true;
      }
    | {
          error: string;
          success: false;
      };

export type SavedVideoProject = {
    path: string;
    project: VideoProject;
};

export type VideoAgentTools = {
    analyzeAssets: (input: {
        assets: AssetAnalysis[];
        input: VideoCreationInput;
    }) => Promise<AssetAnalysis[]>;
    assembleTimeline: (input: {
        assets: AssetAnalysis[];
        brief: CreativeBrief;
        input: VideoCreationInput;
        matches: AssetMatchResult[];
        scenes: PlannedScene[];
        voices: VoiceSynthesisResult[];
    }) => Promise<VideoProject>;
    generateCreativeBrief: (input: {
        assets: AssetAnalysis[];
        input: VideoCreationInput;
    }) => Promise<CreativeBrief>;
    matchAssets: (input: {
        assets: AssetAnalysis[];
        input: VideoCreationInput;
        scenes: PlannedScene[];
    }) => Promise<AssetMatchResult[]>;
    planScenes: (input: {
        assets: AssetAnalysis[];
        brief: CreativeBrief;
        input: VideoCreationInput;
    }) => Promise<PlannedScene[]>;
    saveProject: (input: {
        project: VideoProject;
    }) => Promise<SavedVideoProject>;
    scanAssets: (input: {
        input: VideoCreationInput;
    }) => Promise<AssetAnalysis[]>;
    synthesizeVoice: (input: {
        brief: CreativeBrief;
        input: VideoCreationInput;
        scenes: PlannedScene[];
    }) => Promise<VoiceSynthesisResult[]>;
    validateProject: (input: {
        project: VideoProject;
    }) => Promise<ProjectValidationResult>;
};
