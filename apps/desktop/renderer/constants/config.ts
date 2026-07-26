import type {
    BasicConfigPanelData,
    ConfigMode,
    VisualConfigData,
    VoiceConfigData
} from '../types/config';

import { assistantPanel, assistantTags } from './editor-screen';

export const editorConfigMode: ConfigMode = 'voice';

export const visualConfigPanel = {
    timestamp: assistantPanel.timestamp,
    contextTitle: assistantPanel.contextTitle,
    contextSummary: assistantPanel.contextSummary,
    tags: assistantTags,
    analysis: assistantPanel.analysis,
    returnAction: assistantPanel.returnAction,
    quickAdjust: {
        title: assistantPanel.quickEditTitle,
        placeholder: assistantPanel.quickEditPlaceholder,
        linkedShot: assistantPanel.linkedShot
    }
} satisfies VisualConfigData;

export const voiceConfigPanel = {
    header: {
        title: '口播配音',
        subtitle: '为当前分镜生成旁白音轨'
    },
    section: {
        title: '选择音色',
        subtitle: '系统音色与自定义音色库 · 支持试听'
    },
    presets: [
        {
            title: '温婉学姐',
            description: '自然女声 · 推荐',
            selected: true,
            actionIcon: 'play'
        },
        {
            title: '沉稳男声',
            description: '低频清晰',
            selected: false,
            actionIcon: 'play'
        },
        {
            title: '新闻播报',
            description: '稳重正式',
            selected: false,
            actionIcon: 'play'
        },
        {
            title: '活力讲解',
            description: '节奏明快',
            selected: false,
            actionIcon: 'play'
        }
    ],
    uploadCard: {
        title: '自定义音色库',
        description: '上传 10 s 内音频，保存后可直接作为音色使用',
        buttonIcon: 'plus'
    },
    sliders: [
        {
            label: '音量',
            value: '82%',
            icon: 'volume-2',
            trackWidthClassName: 'w-[250px]',
            progressWidthClassName: 'w-[186px]',
            thumbLeftClassName: 'left-[178px]'
        },
        {
            label: '语速',
            value: '1.05x',
            icon: 'gauge',
            trackWidthClassName: 'w-[250px]',
            progressWidthClassName: 'w-[154px]',
            thumbLeftClassName: 'left-[146px]'
        }
    ],
    actionLabel: '生成口播音轨'
} satisfies VoiceConfigData;

export const subtitleConfigPanel = {
    header: {
        title: '字幕',
        subtitle: '识别文稿节奏并对齐字幕节拍'
    },
    section: {
        title: '字幕样式',
        subtitle: '统一样式、断句和关键字高亮'
    }
} satisfies BasicConfigPanelData;

export const musicConfigPanel = {
    header: {
        title: '音乐',
        subtitle: '为成片选择合适的背景音乐'
    },
    section: {
        title: '音乐库',
        subtitle: '支持氛围、节奏和情绪筛选'
    }
} satisfies BasicConfigPanelData;
