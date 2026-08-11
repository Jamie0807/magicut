import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('file dialog IPC', () => {
    it('registers and exposes source directory selection through preload', async () => {
        const { registerFileDialogIpc } = await import(
            '../client/file-dialog-ipc'
        );
        const { fileDialogIpcChannels } = await import(
            '../shared/file-dialog-channels'
        );
        const preloadSource = readFileSync(
            resolve(__dirname, '../client/preload.ts'),
            'utf8'
        );
        const envTypesSource = readFileSync(
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

        registerFileDialogIpc({
            dialog: {
                showOpenDialog: async () => ({
                    canceled: false,
                    filePaths: ['/Users/jamie/Videos/magicut']
                })
            },
            ipcMain
        });

        expect(fileDialogIpcChannels.selectSourceDirectory).toBe(
            'fileDialog:selectSourceDirectory'
        );
        expect(handlers.has(fileDialogIpcChannels.selectSourceDirectory)).toBe(
            true
        );
        await expect(
            handlers.get(fileDialogIpcChannels.selectSourceDirectory)?.()
        ).resolves.toEqual({
            data: {
                directoryPath: '/Users/jamie/Videos/magicut'
            },
            success: true
        });
        expect(preloadSource).toContain('fileDialog: {');
        expect(preloadSource).toContain('fileDialogIpcChannels');
        expect(preloadSource).toContain('selectSourceDirectory:');
        expect(envTypesSource).toContain('fileDialog: {');
        expect(envTypesSource).toContain('selectSourceDirectory: (');
    });

    it('returns a cancelled result when no directory is selected', async () => {
        const { registerFileDialogIpc } = await import(
            '../client/file-dialog-ipc'
        );
        const { fileDialogIpcChannels } = await import(
            '../shared/file-dialog-channels'
        );
        const handlers = new Map<string, (...args: never[]) => unknown>();

        registerFileDialogIpc({
            dialog: {
                showOpenDialog: async () => ({
                    canceled: true,
                    filePaths: []
                })
            },
            ipcMain: {
                handle: (
                    channel: string,
                    handler: (...args: never[]) => unknown
                ) => {
                    handlers.set(channel, handler);
                }
            }
        });

        await expect(
            handlers.get(fileDialogIpcChannels.selectSourceDirectory)?.()
        ).resolves.toEqual({
            error: {
                code: 'SELECTION_CANCELLED',
                message: '已取消选择本地素材目录'
            },
            success: false
        });
    });
});
