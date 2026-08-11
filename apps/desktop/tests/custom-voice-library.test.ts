import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('custom voice library', () => {
    it('imports reference audio into app storage and returns a custom IndexTTS2 voice type', async () => {
        const { createCustomVoiceLibrary } = await import(
            '../client/custom-voice-library'
        );
        const rootDirectory = await mkdtemp(join(tmpdir(), 'magicut-voices-'));
        const sourcePath = join(rootDirectory, 'source.wav');

        await writeFile(sourcePath, new Uint8Array([1, 2, 3, 4]));

        const library = createCustomVoiceLibrary({
            createId: () => 'voice_001',
            now: () => '2026-06-28T01:02:03.000Z',
            rootDirectory
        });
        const imported = await library.importReferenceAudio({
            filePath: sourcePath
        });
        const voices = await library.list();

        expect(imported.voice).toMatchObject({
            createdAt: '2026-06-28T01:02:03.000Z',
            id: 'voice_001',
            provider: 'index-tts2',
            previewAudioUrl: 'magicut-media://custom-voice/voice_001/reference',
            sourceFileName: 'source.wav',
            title: 'source',
            voiceType: 'custom:index-tts2:voice_001'
        });
        expect(voices).toEqual([imported.voice]);
        expect(
            await library.resolveReferencePath(imported.voice.voiceType)
        ).toContain('reference.wav');
        expect([
            ...new Uint8Array(
                await readFile(
                    await library.resolveReferencePath(imported.voice.voiceType)
                )
            )
        ]).toEqual([1, 2, 3, 4]);
    });

    it('reports IndexTTS2 availability from the local server probe', async () => {
        const { createCustomVoiceLibrary } = await import(
            '../client/custom-voice-library'
        );
        const rootDirectory = await mkdtemp(join(tmpdir(), 'magicut-voices-'));
        const library = createCustomVoiceLibrary({
            fetch: async (url) => {
                expect(String(url)).toBe(
                    'http://127.0.0.1:7860/gradio_api/info'
                );

                return new Response('{}', { status: 200 });
            },
            rootDirectory
        });

        await expect(library.checkIndexTts2()).resolves.toMatchObject({
            available: true,
            provider: 'index-tts2',
            serverUrl: 'http://127.0.0.1:7860'
        });
    });

    it('registers custom voice IPC handlers and exposes the preload contract', async () => {
        const { registerCustomVoiceIpc } = await import(
            '../client/custom-voice-ipc'
        );
        const { customVoiceIpcChannels } = await import(
            '../shared/custom-voice-channels'
        );
        const preloadSource = await readFile(
            resolve(__dirname, '../client/preload.ts'),
            'utf8'
        );
        const envTypesSource = await readFile(
            resolve(__dirname, '../magicut.env.d.ts'),
            'utf8'
        );
        const handlers = new Map<string, (...args: never[]) => unknown>();
        const ipcMain = {
            handle: (
                channel: string,
                handler: (...args: never[]) => unknown
            ) => {
                handlers.set(channel, handler);
            }
        };
        const library = {
            checkIndexTts2: async () => ({
                available: true,
                message: 'ok',
                provider: 'index-tts2' as const,
                serverUrl: 'http://127.0.0.1:7860'
            }),
            importReferenceAudio: async () => ({
                voice: {
                    createdAt: '2026-06-28T01:02:03.000Z',
                    id: 'voice_001',
                    provider: 'index-tts2' as const,
                    sourceFileName: 'source.wav',
                    title: 'source',
                    voiceType: 'custom:index-tts2:voice_001'
                }
            }),
            list: async () => [],
            resolveReferencePath: async () => '/tmp/reference.wav'
        };

        registerCustomVoiceIpc({
            dialog: {
                showOpenDialog: async () => ({
                    canceled: false,
                    filePaths: ['/tmp/source.wav']
                })
            },
            ipcMain,
            library
        });

        expect(handlers.has(customVoiceIpcChannels.checkIndexTts2)).toBe(true);
        expect(handlers.has(customVoiceIpcChannels.importReferenceAudio)).toBe(
            true
        );
        expect(handlers.has(customVoiceIpcChannels.list)).toBe(true);
        expect(preloadSource).toContain('customVoice: {');
        expect(preloadSource).toContain(
            'customVoiceIpcChannels.checkIndexTts2'
        );
        expect(preloadSource).toContain(
            'customVoiceIpcChannels.importReferenceAudio'
        );
        expect(preloadSource).toContain('customVoiceIpcChannels.list');
        expect(envTypesSource).toContain('customVoice: {');
        expect(envTypesSource).toContain('checkIndexTts2: (');
        expect(envTypesSource).toContain('importReferenceAudio: (');
        expect(envTypesSource).toContain('list: (');
    });
});
