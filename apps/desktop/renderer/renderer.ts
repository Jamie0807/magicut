import { createApp } from 'vue';

import './index.css';

import App from './App.vue';
import { createAppRouter } from './router';

createApp(App).use(createAppRouter()).mount('#app');
