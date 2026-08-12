#!/usr/bin/env node

import { constants } from 'node:fs';
import {
    access,
    chmod,
    mkdir,
    readdir,
    readFile,
    stat,
    writeFile
} from 'node:fs/promises';
import { createRequire } from 'node:module';
import { homedir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const currentFilePath = fileURLToPath(import.meta.url);
const require = createRequire(import.meta.url);

export function getElectronBinaryPathForPlatform(platform) {
    switch (platform) {
        case 'darwin':
        case 'mas':
            return 'Electron.app/Contents/MacOS/Electron';
        case 'freebsd':
        case 'linux':
        case 'openbsd':
            return 'electron';
        case 'win32':
            return 'electron.exe';
        default:
            throw new Error(
                `Electron builds are not available on platform: ${platform}`
            );
    }
}

export function getElectronArchiveName(version, platform, arch) {
    return `electron-v${version}-${platform}-${arch}.zip`;
}

export function getDefaultElectronCacheDirectory(
    platform = process.platform,
    homeDirectory = homedir()
) {
    const configuredCache =
        process.env.electron_config_cache ??
        process.env.npm_config_electron_config_cache;

    if (configuredCache) {
        return configuredCache;
    }

    if (platform === 'darwin') {
        return join(homeDirectory, 'Library', 'Caches', 'electron');
    }

    if (platform === 'win32') {
        return join(
            process.env.LOCALAPPDATA ?? join(homeDirectory, 'AppData', 'Local'),
            'electron',
            'Cache'
        );
    }

    return join(
        process.env.XDG_CACHE_HOME ?? join(homeDirectory, '.cache'),
        'electron'
    );
}

export async function pathExists(filePath) {
    try {
        await access(filePath, constants.F_OK);
        return true;
    } catch {
        return false;
    }
}

export async function ensureExecutableFile(filePath) {
    try {
        await access(filePath, constants.X_OK);
        return false;
    } catch {
        const fileStat = await stat(filePath);
        await chmod(filePath, fileStat.mode | 0o111);
        return true;
    }
}

export async function ensureElectronForgeCliExecutable() {
    const forgePackagePath = require.resolve(
        '@electron-forge/cli/package.json'
    );
    const forgeDirectory = dirname(forgePackagePath);
    const forgeCliPath = join(forgeDirectory, 'dist', 'electron-forge.js');

    if (await ensureExecutableFile(forgeCliPath)) {
        console.info(
            `[electron-forge] Restored execute permission on ${forgeCliPath}`
        );
    }
}

export async function isElectronInstallUsable(
    electronDirectory,
    version,
    platform = process.platform
) {
    const binaryPath = getElectronBinaryPathForPlatform(platform);
    const pathFilePath = join(electronDirectory, 'path.txt');
    const versionFilePath = join(electronDirectory, 'dist', 'version');
    const executablePath = join(electronDirectory, 'dist', binaryPath);

    try {
        const [installedBinaryPath, installedVersion] = await Promise.all([
            readFile(pathFilePath, 'utf8'),
            readFile(versionFilePath, 'utf8')
        ]);

        if (
            installedBinaryPath !== binaryPath ||
            installedVersion.replace(/^v/, '') !== version
        ) {
            return false;
        }
    } catch {
        return false;
    }

    return pathExists(executablePath);
}

export async function findCachedElectronArchive(cacheDirectory, archiveName) {
    const pendingDirectories = [cacheDirectory];

    while (pendingDirectories.length > 0) {
        const directory = pendingDirectories.shift();

        try {
            const entries = await readdir(directory, { withFileTypes: true });

            for (const entry of entries) {
                const entryPath = join(directory, entry.name);

                if (entry.isFile() && entry.name === archiveName) {
                    return entryPath;
                }

                if (entry.isDirectory()) {
                    pendingDirectories.push(entryPath);
                }
            }
        } catch {
            continue;
        }
    }

    return null;
}

export function runCommand(command, args, options = {}) {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, {
            stdio: 'inherit',
            ...options
        });

        child.on('error', reject);
        child.on('exit', (code) => {
            if (code === 0) {
                resolve();
                return;
            }

            reject(
                new Error(
                    `${command} ${args.join(' ')} failed with exit code ${code}`
                )
            );
        });
    });
}

export async function restoreElectronFromArchive({
    electronDirectory,
    archivePath,
    version,
    platform = process.platform,
    commandRunner = runCommand
}) {
    const distDirectory = join(electronDirectory, 'dist');
    const binaryPath = getElectronBinaryPathForPlatform(platform);
    const command = platform === 'darwin' ? 'ditto' : 'unzip';
    const args =
        platform === 'darwin'
            ? ['-x', '-k', archivePath, distDirectory]
            : ['-q', archivePath, '-d', distDirectory];

    await mkdir(distDirectory, { recursive: true });
    await commandRunner(command, args);
    await writeFile(join(electronDirectory, 'path.txt'), binaryPath);
    await writeFile(join(distDirectory, 'version'), version);
}

export async function runOfficialElectronInstaller(
    electronDirectory,
    commandRunner = runCommand
) {
    await commandRunner(process.execPath, [
        join(electronDirectory, 'install.js')
    ]);
}

export async function ensureElectronInstalled({
    platform = process.env.npm_config_platform ?? process.platform,
    arch = process.env.npm_config_arch ?? process.arch,
    cacheDirectory = getDefaultElectronCacheDirectory(platform),
    commandRunner = runCommand
} = {}) {
    const electronPackagePath = require.resolve('electron/package.json');
    const electronDirectory = dirname(electronPackagePath);
    const packageJson = JSON.parse(await readFile(electronPackagePath, 'utf8'));
    const version = packageJson.version;

    if (await isElectronInstallUsable(electronDirectory, version, platform)) {
        return;
    }

    const archiveName = getElectronArchiveName(version, platform, arch);
    const cachedArchivePath = await findCachedElectronArchive(
        cacheDirectory,
        archiveName
    );

    if (cachedArchivePath) {
        console.info(
            `[electron] Restoring ${archiveName} from ${dirname(cachedArchivePath)}`
        );
        await restoreElectronFromArchive({
            electronDirectory,
            archivePath: cachedArchivePath,
            version,
            platform,
            commandRunner
        });

        if (
            await isElectronInstallUsable(electronDirectory, version, platform)
        ) {
            return;
        }
    }

    console.info(
        `[electron] ${archiveName} was not found in ${cacheDirectory}; running Electron installer`
    );
    await runOfficialElectronInstaller(electronDirectory, commandRunner);

    if (
        !(await isElectronInstallUsable(electronDirectory, version, platform))
    ) {
        throw new Error(
            `Electron ${version} did not install a usable ${basename(getElectronBinaryPathForPlatform(platform))} binary`
        );
    }
}

if (process.argv[1] === currentFilePath) {
    Promise.all([
        ensureElectronInstalled(),
        ensureElectronForgeCliExecutable()
    ]).catch((error) => {
        console.error(error instanceof Error ? error.message : error);
        process.exit(1);
    });
}
