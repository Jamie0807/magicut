import type { RouteRecordRaw, RouterHistory } from 'vue-router';
import { createRouter, createWebHashHistory } from 'vue-router';

import EditorScreen from '../pages/EditorScreen.vue';
import HomePage from '../pages/HomePage.vue';

export const appRoutes = [
    {
        path: '/',
        component: EditorScreen
    },
    {
        path: '/workspace',
        component: HomePage
    }
] satisfies RouteRecordRaw[];

export const createAppRouter = (
    history: RouterHistory = createWebHashHistory()
) =>
    createRouter({
        history,
        routes: appRoutes
    });
