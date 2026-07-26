import type {
    BasicConfigPanelData,
    ConfigMode,
    SubtitleConfigData,
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
        title: '字幕设置',
        subtitle: '调整当前字幕轨显示样式'
    },
    visibility: {
        label: '显示字幕',
        enabled: true
    },
    size: {
        label: '字号',
        value: '42 px',
        trackWidthClassName: 'w-[260px]',
        progressWidthClassName: 'w-[92px]',
        thumbLeftClassName: 'left-[80px]'
    },
    style: {
        title: '字幕样式',
        subtitle: '应用到当前字幕轨',
        presets: [
            {
                label: '白字黑边',
                active: true,
                backgroundColor: '#0D201B',
                borderColor: '#F05F73',
                outerTextColor: '#000000',
                innerTextColor: '#F5F7FA'
            },
            {
                label: '经典白字',
                active: false,
                backgroundColor: '#111214',
                borderColor: '#4A4C52',
                outerTextColor: '#35373C',
                innerTextColor: '#F5F7FA'
            },
            {
                label: '黄字黑边',
                active: false,
                backgroundColor: '#111214',
                borderColor: '#343841',
                outerTextColor: '#050505',
                innerTextColor: '#FFD400'
            },
            {
                label: '红字白边',
                active: false,
                backgroundColor: '#111214',
                borderColor: '#343841',
                outerTextColor: '#FFFFFF',
                innerTextColor: '#F05F73'
            },
            {
                label: '青灰字幕',
                active: false,
                backgroundColor: '#111214',
                borderColor: '#343841',
                outerTextColor: '#14181D',
                innerTextColor: '#9ADFE5'
            },
            {
                label: '粉色字幕',
                active: false,
                backgroundColor: '#111214',
                borderColor: '#343841',
                outerTextColor: '#FFFFFF',
                innerTextColor: '#FF6EA5'
            },
            {
                label: '蓝色字幕',
                active: false,
                backgroundColor: '#111214',
                borderColor: '#343841',
                outerTextColor: '#0A0E12',
                innerTextColor: '#24CFF2'
            }
        ],
        activePresetLabel: '白字黑边'
    }
} satisfies SubtitleConfigData;

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
