export const defaultVideoAgentCanvas = {
    fps: 30,
    height: 1080,
    width: 1920
} as const;

export type VideoAgentCanvasConfig = {
    fps: number;
    height: number;
    width: number;
};

export type VideoAgentStartInput = {
    canvas?: VideoAgentCanvasConfig;
    prompt: string;
    selectedVoice: string;
    selectedVoiceType?: string;
    sourceAssetDirectory: string;
};

export type VideoAgentApprovalInput = {
    approved: boolean;
    runId: string;
};

export type VideoAgentCancelInput = {
    runId: string;
};

export type VideoAgentResultData = {
    runId: string;
};

export type VideoAgentErrorCode =
    | 'CANCELLED'
    | 'RUN_FAILED'
    | 'VALIDATION_FAILED';

export type VideoAgentOperationResult<T> =
    | {
          data: T;
          success: true;
      }
    | {
          error: {
              code: VideoAgentErrorCode;
              message: string;
          };
          success: false;
      };

export type DesktopAgentRunEventBase = {
    createdAt: string;
    runId: string;
    sequence: number;
};

export type DesktopAgentRunEvent =
    | (DesktopAgentRunEventBase & {
          input: {
              prompt: string;
              selectedVoice: string;
              selectedVoiceType?: string;
              sourceAssetDirectory: string;
          };
          type: 'run.started';
      })
    | (DesktopAgentRunEventBase & {
          nodeName: string;
          type: 'node.started';
      })
    | (DesktopAgentRunEventBase & {
          nodeName: string;
          type: 'node.completed';
      })
    | (DesktopAgentRunEventBase & {
          error: string;
          nodeName: string;
          type: 'node.failed';
      })
    | (DesktopAgentRunEventBase & {
          delta: string;
          nodeName: string;
          type: 'model.delta';
      })
    | (DesktopAgentRunEventBase & {
          approval: {
              payload: unknown;
              type: string;
          };
          type: 'approval.required';
      })
    | (DesktopAgentRunEventBase & {
          projectId: string;
          savedProjectPath?: string;
          type: 'run.completed';
      })
    | (DesktopAgentRunEventBase & {
          error: string;
          type: 'run.failed';
      })
    | (DesktopAgentRunEventBase & {
          reason?: string;
          type: 'run.cancelled';
      });
