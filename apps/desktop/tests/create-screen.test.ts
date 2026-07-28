import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import type { Component } from 'vue';
import { createSSRApp, h } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';

import { renderToString } from '@vue/server-renderer';

import VoiceSelect from '../renderer/components/create/VoiceSelect.vue';
import { createPageContent } from '../renderer/constants/create';
import HomePage from '../renderer/pages/HomePage.vue';
import { appRoutes } from '../renderer/router';

const forbiddenBrandPattern = new RegExp(
    [
        'mi' + 'ao',
        'mi' + 'aoma',
        'mi' + 'aojian',
        '妙' + '码',
        '秒' + '码',
        '妙' + '剪'
    ].join('|'),
    'i'
);
const testDirectory = dirname(fileURLToPath(import.meta.url));
const desktopDirectory = resolve(testDirectory, '..');
const sourceFileExtensions = new Set(['.css', '.mts', '.ts', '.vue']);

const renderCreateScreen = async () => {
    const app = createSSRApp(HomePage, { initialView: 'create' });
    const router = createRouter({
        history: createMemoryHistory(),
        routes: appRoutes
    });

    app.use(router);
    await router.push('/');
    await router.isReady();

    return renderToString(app);
};

const renderComponent = (
    component: Component,
    props?: Record<string, unknown>
) =>
    renderToString(
        createSSRApp({
            render: () => h(component, props)
        })
    );

const collectSourceFiles = (directory: string): string[] =>
    readdirSync(directory).flatMap((entryName) => {
        const entryPath = join(directory, entryName);
        const stats = statSync(entryPath);

        if (stats.isDirectory()) {
            return collectSourceFiles(entryPath);
        }

        return sourceFileExtensions.has(extname(entryName)) ? [entryPath] : [];
    });

describe('CreateScreen', () => {
    it('registers create as the root tab of the shared workspace page', () => {
        expect(appRoutes.some((route) => route.path === '/')).toBe(true);
        expect(appRoutes.some((route) => route.path === '/editor')).toBe(true);
        expect(
            appRoutes.some((route) => route.path === '/editor/:projectId')
        ).toBe(true);

        const rootRoute = appRoutes.find((route) => route.path === '/');
        const workspaceRoute = appRoutes.find(
            (route) => route.path === '/workspace'
        );

        expect(rootRoute?.component).toBe(workspaceRoute?.component);
        expect(rootRoute?.props).toEqual({ initialView: 'create' });
        expect(workspaceRoute?.props).toEqual({ initialView: 'projects' });
    });

    it('renders the create tab with the shared sidebar and hero copy', async () => {
        const html = await renderCreateScreen();

        expect(html).toContain('Magicut');
        expect(html).toContain('智能视频剪辑工具');
        expect(html).toContain('workspace-sidebar-aurora-layer');
        expect(html).toContain('创作');
        expect(html).toContain('aria-current="page"');
        expect(html).toContain('让文字');
        expect(html).toContain('赴一场光影之约');
        expect(html).toContain('顷刻成帧，每一种表达都自有回响');
        expect(html).toContain('gradient-text-motion');
        expect(html).toContain('#E9FFD0');
        expect(html).toContain('#FF92E9');
        expect(html).toContain('#7E62FF');
        expect(html).not.toMatch(forbiddenBrandPattern);
    });

    it('matches the manuscript input panel and content soft aurora layer', async () => {
        const html = await renderCreateScreen();

        expect(html).toContain('h-[390px] w-[1340px]');
        expect(html).toContain('rounded-[30px]');
        expect(html).toContain('border-2 border-[#3A3945]');
        expect(html).toContain('输入文稿');
        expect(html).toContain('上传口播音频');
        expect(html).toContain('输入/粘贴视频文稿，为你生成精彩视频');
        expect(html).toContain('0 / 10000');
        expect(html).toContain('aria-label="配音"');
        expect(html).not.toContain('<select');
        expect(html).toContain('create-voice-select-trigger');
        expect(html).toContain('温婉学姐');
        expect(html).toContain('创建');
        expect(html).toContain('textarea');
        expect(html).toContain('maxlength="10000"');
        expect(html).toContain('create-main-soft-aurora-layer');
        expect(html).toContain('soft-aurora-container');
        expect(html).not.toMatch(forbiddenBrandPattern);
    });

    it('keeps the SoftAurora visual layer backed by explicit style tokens and motion', () => {
        const softAuroraSource = readFileSync(
            resolve(
                desktopDirectory,
                'renderer/components/reactbits/SoftAurora/SoftAurora.vue'
            ),
            'utf8'
        );

        expect(softAuroraSource).toContain('--soft-aurora-band-height');
        expect(softAuroraSource).toContain('--soft-aurora-color-1');
        expect(softAuroraSource).toContain('mix-blend-mode: screen');
        expect(softAuroraSource).toContain('soft-aurora-flow');
        expect(softAuroraSource).toContain('soft-aurora-drift');
    });

    it('renders the custom voice menu from the creation dropdown frame', async () => {
        const html = await renderComponent(VoiceSelect, {
            defaultOpen: true,
            labelPrefix: createPageContent.voiceLabelPrefix,
            options: createPageContent.voiceOptions,
            value: '温婉学姐'
        });

        expect(html).toContain('create-voice-select-trigger');
        expect(html).toContain('w-[278px]');
        expect(html).toContain('h-[58px]');
        expect(html).toContain('border-[#6B5B80]');
        expect(html).toContain('top-[68px]');
        expect(html).toContain('h-[202px]');
        expect(html).toContain('rounded-[16px]');
        expect(html).toContain('bg-[#1E1E27F2]');
        expect(html).toContain('border-[#3B3948]');
        expect(html).toContain('role="listbox"');
        expect(html).toContain('role="option"');
        expect(html).toContain(
            'bg-[linear-gradient(90deg,#8B6AF7_0%,#BF40FF_55%,#F05F73_100%)]'
        );
        expect(html).toContain('柔和亲切 · 适合知识口播');
        expect(html).toContain('清晰正式 · 适合资讯解说');
        expect(html).toContain('低沉可靠 · 适合商业叙事');
        expect(html).toContain('明快有力 · 适合教程种草');
        expect(html.indexOf('新闻播报')).toBeLessThan(html.indexOf('沉稳男声'));
        expect(html).not.toMatch(forbiddenBrandPattern);
    });

    it('keeps desktop source files free of previous project brand terms', () => {
        const sourceFiles = [
            ...collectSourceFiles(resolve(desktopDirectory, 'renderer')),
            ...collectSourceFiles(testDirectory)
        ];
        const matches = sourceFiles.flatMap((sourceFile) => {
            const content = readFileSync(sourceFile, 'utf8');
            const match = content.match(forbiddenBrandPattern);

            return match ? [`${sourceFile}: ${match[0]}`] : [];
        });

        expect(matches).toEqual([]);
    });
});
