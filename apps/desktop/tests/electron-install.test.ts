import {
    chmod,
    mkdir,
    mkdtemp,
    readFile,
    rm,
    stat,
    writeFile
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import {
    ensureExecutableFile,
    findCachedElectronArchive,
    getDefaultElectronCacheDirectory,
    getElectronArchiveName,
    getElectronBinaryPathForPlatform,
    isElectronInstallUsable,
    restoreElectronFromArchive
} from '../scripts/ensure-electron-installed.mjs';

const temporaryDirectories: string[] = [];

async function createTemporaryDirectory() {
    const temporaryDirectory = await mkdtemp(
        join(tmpdir(), 'magicut-electron-')
    );
    temporaryDirectories.push(temporaryDirectory);
    return temporaryDirectory;
}

afterEach(async () => {
    await Promise.all(
        temporaryDirectories
            .splice(0)
            .map((directory) => rm(directory, { recursive: true, force: true }))
    );
});

describe('ensure Electron installation helpers', () => {
    it('returns platform specific Electron executable paths', () => {
        expect(getElectronBinaryPathForPlatform('darwin')).toBe(
            'Electron.app/Contents/MacOS/Electron'
        );
        expect(getElectronBinaryPathForPlatform('linux')).toBe('electron');
        expect(getElectronBinaryPathForPlatform('win32')).toBe('electron.exe');
    });

    it('builds the Electron cache archive name', () => {
        expect(getElectronArchiveName('38.4.0', 'darwin', 'arm64')).toBe(
            'electron-v38.4.0-darwin-arm64.zip'
        );
    });

    it('uses the macOS Electron cache directory by default', () => {
        expect(getDefaultElectronCacheDirectory('darwin', '/Users/jamie')).toBe(
            '/Users/jamie/Library/Caches/electron'
        );
    });

    it('detects whether the Electron install points to an existing binary', async () => {
        const electronDirectory = await createTemporaryDirectory();

        expect(
            await isElectronInstallUsable(electronDirectory, '38.4.0', 'darwin')
        ).toBe(false);

        await mkdir(
            join(
                electronDirectory,
                'dist',
                'Electron.app',
                'Contents',
                'MacOS'
            ),
            { recursive: true }
        );
        await writeFile(
            join(electronDirectory, 'path.txt'),
            'Electron.app/Contents/MacOS/Electron'
        );
        await writeFile(join(electronDirectory, 'dist', 'version'), 'v38.4.0');
        await writeFile(
            join(
                electronDirectory,
                'dist',
                'Electron.app',
                'Contents',
                'MacOS',
                'Electron'
            ),
            ''
        );

        expect(
            await isElectronInstallUsable(electronDirectory, '38.4.0', 'darwin')
        ).toBe(true);
    });

    it('finds a nested cached Electron archive', async () => {
        const cacheDirectory = await createTemporaryDirectory();
        const archiveDirectory = join(
            cacheDirectory,
            'fc37a51636238d96cb141d583f16af6504143752c8844988fed24ba5b06f4173'
        );
        const archivePath = join(
            archiveDirectory,
            'electron-v38.4.0-darwin-arm64.zip'
        );

        await mkdir(archiveDirectory, { recursive: true });
        await writeFile(archivePath, '');

        await expect(
            findCachedElectronArchive(
                cacheDirectory,
                'electron-v38.4.0-darwin-arm64.zip'
            )
        ).resolves.toBe(archivePath);
    });

    it('restores Electron metadata after extracting a cached archive', async () => {
        const electronDirectory = await createTemporaryDirectory();
        const archivePath = join(
            await createTemporaryDirectory(),
            'electron-v38.4.0-darwin-arm64.zip'
        );
        const commands: { args: string[]; command: string }[] = [];

        await writeFile(archivePath, '');
        await restoreElectronFromArchive({
            electronDirectory,
            archivePath,
            version: '38.4.0',
            platform: 'darwin',
            commandRunner: async (command, args) => {
                commands.push({ command, args });
                await mkdir(
                    join(
                        electronDirectory,
                        'dist',
                        'Electron.app',
                        'Contents',
                        'MacOS'
                    ),
                    { recursive: true }
                );
                await writeFile(
                    join(
                        electronDirectory,
                        'dist',
                        'Electron.app',
                        'Contents',
                        'MacOS',
                        'Electron'
                    ),
                    ''
                );
            }
        });

        expect(commands).toEqual([
            {
                command: 'ditto',
                args: ['-x', '-k', archivePath, join(electronDirectory, 'dist')]
            }
        ]);
        await expect(
            readFile(join(electronDirectory, 'path.txt'), 'utf8')
        ).resolves.toBe('Electron.app/Contents/MacOS/Electron');
        await expect(
            readFile(join(electronDirectory, 'dist', 'version'), 'utf8')
        ).resolves.toBe('38.4.0');
        await expect(
            isElectronInstallUsable(electronDirectory, '38.4.0', 'darwin')
        ).resolves.toBe(true);
    });

    it('restores execute permissions for package bin files', async () => {
        const packageBinPath = join(await createTemporaryDirectory(), 'bin.js');

        await writeFile(packageBinPath, '#!/usr/bin/env node\n');
        await chmod(packageBinPath, 0o644);

        await expect(ensureExecutableFile(packageBinPath)).resolves.toBe(true);

        const packageBinStat = await stat(packageBinPath);
        expect(packageBinStat.mode & 0o111).not.toBe(0);
    });
});
