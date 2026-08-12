import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import mainViteConfig from '../vite.main.config';

describe('electron main bundle config', () => {
    it('keeps ws optional native accelerators external', () => {
        const external = mainViteConfig.build?.rollupOptions?.external;

        expect(external).toEqual(
            expect.arrayContaining(['bufferutil', 'utf-8-validate'])
        );
    });

    it('uses a stable user data directory for generated voice debug files', () => {
        const mainSource = readFileSync(
            resolve(__dirname, '../client/main.ts'),
            'utf8'
        );

        expect(mainSource).toContain('voiceOutputDirectory');
        expect(mainSource).toContain('agent-runs');
        expect(mainSource).toContain('voices');
    });

    it('does not rely on import.meta.url when loading the SQLite builtin for the main bundle', () => {
        const agentDatabaseSource = readFileSync(
            resolve(
                __dirname,
                '../../../packages/video-agent/src/storage/create-agent-database.ts'
            ),
            'utf8'
        );

        expect(agentDatabaseSource).not.toContain(
            'createRequire(import.meta.url)'
        );
        expect(agentDatabaseSource).toContain('process.getBuiltinModule');
    });
});
