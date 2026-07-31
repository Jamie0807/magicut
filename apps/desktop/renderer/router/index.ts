import type { RouteRecordRaw, RouterHistory } from 'vue-router';
import { createRouter, createWebHashHistory } from 'vue-router';

import EditorProjectRoute from '../pages/EditorProjectRoute.vue';
import EditorScreen from '../pages/EditorScreen.vue';
import HomePage from '../pages/HomePage.vue';

export const appRoutes = [
    {
        path: '/',
        component: HomePage,
        props: {
            initialView: 'create'
        }
    },
    {
        path: '/editor',
        component: EditorScreen
    },
    {
        path: '/editor/:projectId',
        component: EditorProjectRoute
    },
    {
        path: '/workspace',
        component: HomePage,
        props: {
            initialView: 'projects'
        }
    }
] satisfies RouteRecordRaw[];

export const createAppRouter = (
    history: RouterHistory = createWebHashHistory()
) =>
    createRouter({
        history,
        routes: appRoutes
    });
