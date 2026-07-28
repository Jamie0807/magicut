import { describe, expect, it } from 'vitest';
import { createSSRApp } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';

import { renderToString } from '@vue/server-renderer';

import EditorScreen from '../renderer/pages/EditorScreen.vue';
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

const renderWorkspaceScreen = async () => {
    const app = createSSRApp(HomePage);
    const router = createRouter({
        history: createMemoryHistory(),
        routes: [
            { path: '/', component: EditorScreen },
            { path: '/workspace', component: HomePage }
        ]
    });

    app.use(router);
    await router.push('/workspace');
    await router.isReady();

    return renderToString(app);
};

describe('WorkspaceScreen', () => {
    it('registers a dedicated /workspace route', () => {
        expect(appRoutes.some((route) => route.path === '/workspace')).toBe(
            true
        );
    });

    it('renders the Magicut workspace page', async () => {
        const html = await renderWorkspaceScreen();

        expect(html).toContain('Magicut');
        expect(html).toContain('智能视频剪辑工具');
        expect(html).toContain('所有项目');
        expect(html).toContain('创建、查看和继续编辑你的智能视频项目');
        expect(html).toContain('创建新作品');
        expect(html).toContain('前端 AI 进阶路线：3 个月从调接口到架构师');
        expect(html).toContain('618 直播高光混剪：从长视频自动提炼爆点');
        expect(html).toContain('创建时间 2026-06-10');
        expect(html).toContain('project-ai-advanced.jpg');
        expect(html).toContain('project-livestream.jpg');
        expect(html).not.toMatch(forbiddenBrandPattern);
    });

    it('links create and project cards into the editor route', async () => {
        const html = await renderWorkspaceScreen();

        expect(html).toContain('href="/"');
        expect(html).toContain('aria-label="创建新作品"');
        expect(html).toContain(
            'aria-label="打开项目：前端 AI 进阶路线：3 个月从调接口到架构师"'
        );
    });

    it('renders workspace navigation and visual project cards', async () => {
        const html = await renderWorkspaceScreen();

        expect(html).toContain('首页');
        expect(html).toContain('创作');
        expect(html).toContain('项目');
        expect(html).toContain('aria-current="page"');
        expect(html).toContain('workspace-dot-field-layer');
        expect(html).toContain('spotlight-card');
        expect(html).toContain('alt="SaaS 新功能发布短片：一分钟讲清核心卖点"');
    });
});
