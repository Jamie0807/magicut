import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { probeAudioDuration } from '../src/audio/probe-audio-duration';
import { serializeError } from '../src/events/event-emitter';
import {
    createTtsMessageFrame,
    EventType,
    MsgType,
    type TtsProtocolSocket
} from '../src/providers/tts-protocol';
import {
    VolcengineTtsProvider,
    VolcengineTtsProviderError
} from '../src/providers/volcengine-tts-provider';

class FakeTtsSocket implements TtsProtocolSocket {
    public closed = false;
    public readonly sent: Uint8Array[] = [];

    constructor(private readonly incoming: Uint8Array[]) {}

    async close() {
        this.closed = true;
    }

    async receive() {
        const next = this.incoming.shift();

        if (!next) {
            throw new Error('No incoming TTS message');
        }

        return next;
    }

    async send(data: Uint8Array) {
        this.sent.push(data);
    }
}

const createProvider = ({ incoming }: { incoming: Uint8Array[] }) => {
    const socket = new FakeTtsSocket(incoming);
    const provider = new VolcengineTtsProvider({
        connect: async ({ headers }) => {
            expect(headers).toMatchObject({
                'X-Api-Key': 'ark-sensitive-token-123456',
                'X-Api-Resource-Id': 'seed-tts-2.0',
                'X-Control-Require-Usage-Tokens-Return': '*'
            });

            return socket;
        },
        env: {
            API_KEY: 'ark-sensitive-token-123456',
            TTS_MODEL: 'seed-tts-2.0'
        },
        probeDuration: async ({ filePath }) => {
            expect(filePath).toContain('voice.mp3');

            return 1234;
        }
    });

    return { provider, socket };
};

describe('VolcengineTtsProvider', () => {
    it('writes streamed mp3 chunks and returns probed duration', async () => {
        const outputDir = await mkdtemp(join(tmpdir(), 'magicut-tts-'));
        const outputPath = join(outputDir, 'voice.mp3');
        const events: unknown[] = [];
        const { provider, socket } = createProvider({
            incoming: [
                createTtsMessageFrame({
                    event: EventType.TtsResponse,
                    msgType: MsgType.AudioOnlyServer,
                    payload: new Uint8Array([1, 2]),
                    sessionId: 'session-001'
                }),
                createTtsMessageFrame({
                    event: EventType.TtsResponse,
                    msgType: MsgType.AudioOnlyServer,
                    payload: new Uint8Array([3, 4]),
                    sessionId: 'session-001'
                }),
                createTtsMessageFrame({
                    event: EventType.SessionFinished,
                    msgType: MsgType.FullServerResponse,
                    payload: new Uint8Array(),
                    sessionId: 'session-001'
                })
            ]
        });

        const result = await provider.synthesizeSpeech({
            emit: (event) => events.push(event),
            outputPath,
            text: 'Magicut makes video creation faster',
            voice: 'zh_female_gaolengyujie_uranus_bigtts'
        });

        expect([...new Uint8Array(await readFile(outputPath))]).toEqual([
            1, 2, 3, 4
        ]);
        expect(result).toMatchObject({
            byteLength: 4,
            durationMs: 1234,
            format: 'mp3',
            path: outputPath
        });
        expect(socket.closed).toBe(true);
        expect(JSON.stringify(events)).not.toContain(
            'ark-sensitive-token-123456'
        );
        expect(events).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ type: 'tts.started' }),
                expect.objectContaining({ byteLength: 2, type: 'tts.chunk' }),
                expect.objectContaining({
                    byteLength: 4,
                    durationMs: 1234,
                    type: 'tts.completed'
                })
            ])
        );
    });

    it('requests mp3 encoding from the provider protocol', async () => {
        const outputDir = await mkdtemp(join(tmpdir(), 'magicut-tts-'));
        const { provider, socket } = createProvider({
            incoming: [
                createTtsMessageFrame({
                    event: EventType.TtsResponse,
                    msgType: MsgType.AudioOnlyServer,
                    payload: new Uint8Array([1, 2]),
                    sessionId: 'session-encoding'
                }),
                createTtsMessageFrame({
                    event: EventType.SessionFinished,
                    msgType: MsgType.FullServerResponse,
                    payload: new Uint8Array(),
                    sessionId: 'session-encoding'
                })
            ]
        });

        await provider.synthesizeSpeech({
            outputPath: join(outputDir, 'voice.mp3'),
            text: 'Magicut',
            voice: 'zh_female_wenroushunv_uranus_bigtts'
        });

        const requestText = new TextDecoder().decode(socket.sent[0]);

        expect(requestText).toContain('"encoding":"mp3"');
    });

    it('turns protocol errors into redacted provider errors', async () => {
        const outputDir = await mkdtemp(join(tmpdir(), 'magicut-tts-'));
        const { provider } = createProvider({
            incoming: [
                createTtsMessageFrame({
                    errorCode: 403,
                    event: EventType.SessionFailed,
                    msgType: MsgType.Error,
                    payload: new TextEncoder().encode(
                        'invalid key ark-sensitive-token-123456'
                    ),
                    sessionId: 'session-001'
                })
            ]
        });

        const failure = await provider
            .synthesizeSpeech({
                outputPath: join(outputDir, 'voice.mp3'),
                text: 'Magicut',
                voice: 'zh_female_gaolengyujie_uranus_bigtts'
            })
            .catch((error: unknown) => error);

        expect(failure).toBeInstanceOf(VolcengineTtsProviderError);
        expect((failure as Error).message).toContain('[REDACTED]');
        expect((failure as Error).message).not.toContain(
            'ark-sensitive-token-123456'
        );
    });
});

describe('probeAudioDuration', () => {
    it('returns duration in milliseconds from ffprobe JSON output', async () => {
        const durationMs = await probeAudioDuration({
            execFile: async () => ({
                stderr: '',
                stdout: JSON.stringify({
                    format: {
                        duration: '1.234'
                    }
                })
            }),
            ffprobePath: 'ffprobe',
            filePath: '/tmp/voice.mp3'
        });

        expect(durationMs).toBe(1234);
    });

    it('serializes non-error values without leaking provider tokens', () => {
        expect(serializeError('failed ark-sensitive-token-123456')).toBe(
            'failed [REDACTED]'
        );
    });
});
