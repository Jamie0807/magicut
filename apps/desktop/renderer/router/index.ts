import { createRouter, createWebHashHistory } from 'vue-router';

import EditorScreen from '../pages/EditorScreen.vue';

export const router = createRouter({
    history: createWebHashHistory(),
    routes: [
        {
            path: '/',
            component: EditorScreen
        }
    ]
});
