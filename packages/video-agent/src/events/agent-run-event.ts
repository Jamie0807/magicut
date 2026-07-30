export type AgentRunEventBase = {
    createdAt: string;
    runId: string;
    sequence: number;
};

export type AgentRunEvent =
    | (AgentRunEventBase & {
          input: {
              prompt: string;
              sourceAssetDirectory: string;
          };
          type: 'run.started';
      })
    | (AgentRunEventBase & {
          nodeName: string;
          type: 'node.started';
      })
    | (AgentRunEventBase & {
          nodeName: string;
          type: 'node.completed';
      })
    | (AgentRunEventBase & {
          error: string;
          nodeName: string;
          type: 'node.failed';
      })
    | (AgentRunEventBase & {
          approval: {
              payload: unknown;
              type: string;
          };
          type: 'approval.required';
      })
    | (AgentRunEventBase & {
          projectId: string;
          savedProjectPath?: string;
          type: 'run.completed';
      })
    | (AgentRunEventBase & {
          error: string;
          type: 'run.failed';
      });
