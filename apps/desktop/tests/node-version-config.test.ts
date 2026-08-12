import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const repositoryRoot = resolve(__dirname, '../../..');

describe('node version configuration', () => {
    it('pins Node 22 across common version managers', () => {
        const packageJson = JSON.parse(
            readFileSync(resolve(repositoryRoot, 'package.json'), 'utf8')
        ) as {
            engines?: {
                node?: string;
            };
            packageManager?: string;
            volta?: {
                node?: string;
                pnpm?: string;
            };
        };
        const nvmVersion = readFileSync(
            resolve(repositoryRoot, '.nvmrc'),
            'utf8'
        ).trim();
        const nodeVersion = readFileSync(
            resolve(repositoryRoot, '.node-version'),
            'utf8'
        ).trim();
        const toolVersions = readFileSync(
            resolve(repositoryRoot, '.tool-versions'),
            'utf8'
        );

        expect(packageJson.engines?.node).toBe('>=22 <23');
        expect(packageJson.packageManager).toBe('pnpm@11.4.0');
        expect(packageJson.volta).toEqual({
            node: '22.20.0',
            pnpm: '11.4.0'
        });
        expect(nvmVersion).toBe('22.20.0');
        expect(nodeVersion).toBe('22.20.0');
        expect(toolVersions).toContain('nodejs 22.20.0');
    });
});
