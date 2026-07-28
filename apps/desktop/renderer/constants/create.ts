import type { CreatePageContent } from '../types/create';

import { workspaceBrand } from './workspace';

export { workspaceBrand as createBrand };

export const createPageContent = {
    titlePrefix: '让文字',
    titleAccent: '赴一场光影之约',
    titleAccentColors: ['#E9FFD0', '#FF92E9', '#7E62FF'],
    subtitle: '顷刻成帧，每一种表达都自有回响',
    modes: [
        {
            label: '输入文稿',
            tone: 'active',
            widthClassName: 'w-[132px]'
        },
        {
            label: '上传口播音频',
            tone: 'default',
            widthClassName: 'w-[134px]'
        }
    ],
    placeholder: '输入/粘贴视频文稿，为你生成精彩视频',
    maxLength: 10000,
    voiceLabelPrefix: '配音',
    voiceOptions: [
        {
            label: '温婉学姐',
            description: '柔和亲切 · 适合知识口播'
        },
        {
            label: '新闻播报',
            description: '清晰正式 · 适合资讯解说'
        },
        {
            label: '沉稳男声',
            description: '低沉可靠 · 适合商业叙事'
        },
        {
            label: '活力讲解',
            description: '明快有力 · 适合教程种草'
        }
    ],
    actionLabel: '创建'
} satisfies CreatePageContent;
