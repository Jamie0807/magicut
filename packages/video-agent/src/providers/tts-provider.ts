export type TtsProviderEvent =
    | {
          textLength: number;
          type: 'tts.started';
          voice: string;
      }
    | {
          byteLength: number;
          type: 'tts.chunk';
      }
    | {
          byteLength: number;
          durationMs: number;
          outputPath: string;
          type: 'tts.completed';
      }
    | {
          error: string;
          type: 'tts.failed';
      };

export type TtsSynthesisInput = {
    emit?: (event: TtsProviderEvent) => void;
    outputPath: string;
    speedRatio?: number;
    text: string;
    volumeRatio?: number;
    voice: string;
};

export type TtsSynthesisResult = {
    byteLength: number;
    durationMs: number;
    format: 'mp3' | 'wav';
    path: string;
};

export type TtsProvider = {
    synthesizeSpeech: (input: TtsSynthesisInput) => Promise<TtsSynthesisResult>;
};
