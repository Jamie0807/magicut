import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { Component } from 'vue';
import { createSSRApp, h } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';

import { sampleVideoProject } from '@magicut/video-project';
import { renderToString } from '@vue/server-renderer';

import ProjectDeleteConfirmDialog from '../renderer/components/workspace/ProjectDeleteConfirmDialog.vue';
import WorkspaceProjectCard from '../renderer/components/workspace/WorkspaceProjectCard.vue';
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

const renderWorkspaceScreen = async (props?: Record<string, unknown>) => {
    const app = createSSRApp(HomePage, props);
    const router = createRouter({
        history: createMemoryHistory(),
        routes: appRoutes
    });

    app.use(router);
    await router.push('/workspace');
    await router.isReady();

    return renderToString(app);
};

const renderComponent = (
    component: Component,
    props?: Record<string, unknown>
) => {
    const app = createSSRApp({
        render: () => h(component, props)
    });
    const router = createRouter({
        history: createMemoryHistory(),
        routes: appRoutes
    });

    app.use(router);

    return renderToString(app);
};

describe('WorkspaceScreen', () => {
    it('registers /workspace as the projects tab of the shared workspace page', () => {
        expect(appRoutes.some((route) => route.path === '/workspace')).toBe(
            true
        );
        expect(
            appRoutes.some((route) => route.path === '/editor/:projectId')
        ).toBe(true);

        const rootRoute = appRoutes.find((route) => route.path === '/');
        const workspaceRoute = appRoutes.find(
            (route) => route.path === '/workspace'
        );

        expect(rootRoute?.component).toBe(workspaceRoute?.component);
        expect(workspaceRoute?.props).toEqual({ initialView: 'projects' });
    });

    it('renders the Magicut workspace page', async () => {
        const html = await renderWorkspaceScreen();

        expect(html).toContain('Magicut');
        expect(html).toContain('智能视频剪辑工具');
        expect(html).toContain('所有项目');
        expect(html).toContain('创建、查看和继续编辑你的智能视频项目');
        expect(html).toContain('创建新作品');
        expect(html).not.toContain('前端 AI 进阶路线：3 个月从调接口到架构师');
        expect(html).not.toContain('618 直播高光混剪：从长视频自动提炼爆点');
        expect(html).not.toContain('href="/editor/101"');
        expect(html).not.toMatch(forbiddenBrandPattern);
    });

    it('uses the create card as an in-page tab switch and project cards as editor links', async () => {
        const html = await renderWorkspaceScreen();

        expect(html).toContain('type="button"');
        expect(html).toContain('aria-label="创建新作品"');
        expect(html).not.toContain('href="/editor/101"');
    });

    it('renders workspace navigation and visual project cards', async () => {
        const html = await renderWorkspaceScreen({
            initialProjects: [
                {
                    id: 'project_real_001',
                    title: '真实生成的视频项目',
                    createdAt: '创建时间 2026-06-23',
                    coverImageUrl: '/covers/project-real.jpg',
                    href: '/editor/project_real_001'
                }
            ]
        });

        expect(html).toContain('首页');
        expect(html).toContain('创作');
        expect(html).toContain('项目');
        expect(html).toContain('aria-current="page"');
        expect(html).toContain('workspace-dot-field-layer');
        expect(html).toContain('spotlight-card');
        expect(html).toContain('alt="真实生成的视频项目"');
        expect(html).not.toContain(
            'alt="SaaS 新功能发布短片：一分钟讲清核心卖点"'
        );
    });

    it('keeps create and project content mounted to avoid visual reinitialization flashes', async () => {
        const html = await renderWorkspaceScreen();

        expect(html).toContain('workspace-view-stack');
        expect(html).toContain('data-workspace-view="create"');
        expect(html).toContain('data-workspace-view="projects"');
        expect(html).toContain('opacity-100');
        expect(html).toContain('opacity-0');
        expect(html).toContain('create-main-soft-aurora-layer');
        expect(html).toContain('workspace-dot-field-layer');
    });

    it('renders project cards with a separate delete button that does not replace navigation', async () => {
        const html = await renderComponent(WorkspaceProjectCard, {
            project: {
                id: 'project_real_001',
                title: '真实生成的视频项目',
                createdAt: '创建时间 2026-06-23',
                coverImageUrl: '/covers/project-real.jpg',
                href: '/editor/project_real_001'
            }
        });

        expect(html).toContain('href="/editor/project_real_001"');
        expect(html).toContain('data-client-route="true"');
        expect(html).toContain('aria-label="打开项目：真实生成的视频项目"');
        expect(html).toContain('aria-label="删除项目"');
        expect(html).toContain('trash-2');
    });

    it('renders an accessible project delete confirmation dialog component', async () => {
        const dialogSource = readFileSync(
            resolve(
                __dirname,
                '../renderer/components/workspace/ProjectDeleteConfirmDialog.vue'
            ),
            'utf8'
        );
        const html = await renderComponent(ProjectDeleteConfirmDialog, {
            errorMessage: '删除失败，请稍后重试',
            isDeleting: false,
            project: {
                id: 'project_real_001',
                title: '真实生成的视频项目',
                createdAt: '创建时间 2026-06-23',
                coverImageUrl: '/covers/project-real.jpg',
                href: '/editor/project_real_001'
            }
        });

        expect(html).toContain('role="dialog"');
        expect(html).toContain('aria-modal="true"');
        expect(html).toContain('aria-labelledby="project-delete-title"');
        expect(html).toContain('aria-describedby="project-delete-description"');
        expect(html).toContain('确认删除项目');
        expect(html).toContain('真实生成的视频项目');
        expect(html).toContain('取消');
        expect(html).toContain('确认删除');
        expect(html).toContain('删除失败，请稍后重试');
        expect(dialogSource).toContain('previousActiveElement');
        expect(dialogSource).toContain('cancelButtonRef');
        expect(dialogSource).toContain("event.key !== 'Escape'");
    });

    it('maps real VideoProject files to workspace project cards', async () => {
        const { mapVideoProjectFileToWorkspaceProject } = await import(
            '../renderer/mappers/workspace-projects'
        );
        const project = structuredClone(sampleVideoProject);
        project.project.id = 'project_real_001';
        project.project.title = '真实生成的视频项目';
        project.project.createdAt = '2026-06-23T08:30:00.000Z';

        expect(
            mapVideoProjectFileToWorkspaceProject({
                filePath:
                    '/Users/jamie/Library/video-projects/project_real_001.magicut.json',
                project
            })
        ).toMatchObject({
            createdAt: '创建时间 2026-06-23',
            href: '/editor/project_real_001',
            id: 'project_real_001',
            title: '真实生成的视频项目'
        });
    });

    it('loads real workspace project data and refreshes after agent completion', () => {
        const workspaceSource = readFileSync(
            resolve(__dirname, '../renderer/pages/HomePage.vue'),
            'utf8'
        );

        expect(workspaceSource).toContain('loadWorkspaceProjects');
        expect(workspaceSource).toContain(
            'window.magicutAPI.videoProject.list'
        );
        expect(workspaceSource).toContain('workspaceProjectsFromStore');
        expect(workspaceSource).toContain("event.type === 'run.completed'");
        expect(workspaceSource).not.toContain(':projects="workspaceProjects"');
    });

    it('uses the project delete dialog before deleting a real workspace project', () => {
        const workspaceSource = readFileSync(
            resolve(__dirname, '../renderer/pages/HomePage.vue'),
            'utf8'
        );

        expect(workspaceSource).toContain('ProjectDeleteConfirmDialog');
        expect(workspaceSource).toContain('projectPendingDeletion.value');
        expect(workspaceSource).toContain('handleProjectDeleteConfirm');
        expect(workspaceSource).not.toContain('window.confirm');
        expect(workspaceSource).toContain(
            'window.magicutAPI.videoProject.delete'
        );
        expect(workspaceSource).toContain('workspaceProjectsFromStore.value');
    });
});
