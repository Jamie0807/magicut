import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const repositoryRoot = resolve(__dirname, '../../..');
const serverDirectory = resolve(repositoryRoot, 'apps/server');

describe('server stack', () => {
    it('keeps the server placeholder aligned with the Vue ecosystem through Nuxt', () => {
        const packageJson = JSON.parse(
            readFileSync(resolve(serverDirectory, 'package.json'), 'utf8')
        ) as {
            dependencies?: Record<string, string>;
            devDependencies?: Record<string, string>;
            scripts?: Record<string, string>;
        };

        expect(packageJson.scripts).toMatchObject({
            build: 'nuxt build',
            dev: 'nuxt dev',
            start: 'nuxt start'
        });
        expect(packageJson.dependencies).toMatchObject({
            nuxt: expect.any(String)
        });
        expect(packageJson.dependencies).not.toHaveProperty('next');
        expect(packageJson.dependencies).not.toHaveProperty('react');
        expect(packageJson.dependencies).not.toHaveProperty('react-dom');
        expect(packageJson.devDependencies).not.toHaveProperty('@types/react');
        expect(existsSync(resolve(serverDirectory, 'app.vue'))).toBe(true);
        expect(
            existsSync(resolve(serverDirectory, 'server/api/health.get.ts'))
        ).toBe(true);
        expect(existsSync(resolve(serverDirectory, 'next.config.ts'))).toBe(
            false
        );
        expect(existsSync(resolve(serverDirectory, 'next-env.d.ts'))).toBe(
            false
        );
    });
});
