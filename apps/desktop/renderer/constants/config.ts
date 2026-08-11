import {
    defaultVideoAgentVoiceSettings,
    videoAgentVoiceOptions
} from '../../shared/video-agent-voices';
import type {
    ConfigMode,
    MusicConfigData,
    SubtitleConfigData,
    SubtitleSettings,
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

const voicePreviewAudioUrls = Object.fromEntries(
    videoAgentVoiceOptions.map((option) => [
        option.label,
        new URL(
            `../assets/voice-previews/${option.previewAudioFileName}`,
            import.meta.url
        ).href
    ])
) as Record<(typeof videoAgentVoiceOptions)[number]['label'], string>;

const createVoicePreset = ({
    description,
    label,
    selected,
    voiceType
}: {
    description: string;
    label: (typeof videoAgentVoiceOptions)[number]['label'];
    selected: boolean;
    voiceType: string;
}) => ({
    title: label,
    description,
    selected,
    actionIcon: 'play' as const,
    previewAudioUrl: voicePreviewAudioUrls[label],
    voiceType
});

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
        createVoicePreset({
            description: '自然女声 · 推荐',
            label: '温婉学姐',
            selected: true,
            voiceType: 'zh_female_wenroushunv_uranus_bigtts'
        }),
        createVoicePreset({
            description: '低频清晰',
            label: '沉稳男声',
            selected: false,
            voiceType: 'zh_male_gaolengchenwen_uranus_bigtts'
        }),
        createVoicePreset({
            description: '稳重正式',
            label: '新闻播报',
            selected: false,
            voiceType: 'zh_male_cixingjieshuonan_uranus_bigtts'
        }),
        createVoicePreset({
            description: '节奏明快',
            label: '活力讲解',
            selected: false,
            voiceType: 'zh_male_huolixiaoge_uranus_bigtts'
        })
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
            max: 100,
            min: 0,
            numericValue: Math.round(
                defaultVideoAgentVoiceSettings.voiceVolume * 100
            ),
            step: 1,
            trackWidthClassName: 'w-[250px]',
            progressWidthClassName: 'w-[186px]',
            thumbLeftClassName: 'left-[178px]'
        },
        {
            label: '语速',
            value: '1.05x',
            icon: 'gauge',
            max: 2,
            min: 0.5,
            numericValue: defaultVideoAgentVoiceSettings.voiceSpeed,
            step: 0.05,
            trackWidthClassName: 'w-[250px]',
            progressWidthClassName: 'w-[154px]',
            thumbLeftClassName: 'left-[146px]'
        }
    ],
    actionLabel: '生成口播音轨'
} satisfies VoiceConfigData;

export const defaultSubtitleSettings = {
    fontSizePx: 24,
    isVisible: true,
    outlineColor: '#000000',
    presetLabel: '白字黑边',
    textColor: '#F5F7FA'
} as const satisfies SubtitleSettings;

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
        max: 72,
        min: 12,
        numericValue: 42,
        step: 1,
        value: '42 px',
        trackWidthClassName: 'w-[260px]',
        progressWidthClassName: 'w-[130px]',
        thumbLeftClassName: 'left-[122px]'
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
        title: '音乐设置',
        subtitle: '控制背景音乐与推荐曲库',
        toggleLabel: '开启',
        toggleEnabled: true
    },
    current: {
        sectionTitle: '当前音乐',
        trackTitle: 'Eutopia',
        artistLine: 'Mika Chen · 平静 / 社会题材',
        metaLine: '偏慢 · 02:01 · 已对齐时间线',
        coverImageUrl: new URL('../assets/music/eutopia.png', import.meta.url)
            .href
    },
    volume: {
        label: '音量',
        value: '60%',
        icon: 'volume-2',
        trackWidthClassName: 'w-[260px]',
        progressWidthClassName: 'w-[156px]',
        thumbLeftClassName: 'left-[148px]'
    },
    recommendations: {
        title: '推荐音乐',
        categories: [
            { label: '全部', active: false },
            { label: '平静', active: true },
            { label: '欢快', active: false },
            { label: '励志', active: false },
            { label: '抒情', active: false },
            { label: '更多', active: false }
        ],
        tracks: [
            {
                title: 'Eutopia',
                meta: '平静 | 适合社会题材 | 偏慢 | 02:01',
                active: true,
                statusLabel: '使用中',
                coverImageUrl: new URL(
                    '../assets/music/eutopia.png',
                    import.meta.url
                ).href
            },
            {
                title: '卡农（经典钢琴版）',
                meta: '平静 | 适合通用题材 | 偏快 | 01:43',
                active: false,
                coverImageUrl: new URL(
                    '../assets/music/canon.png',
                    import.meta.url
                ).href
            },
            {
                title: '通用 日常 平和',
                meta: '平静 | 适合通用题材 | 适中 | 00:20',
                active: false,
                coverImageUrl: new URL(
                    '../assets/music/plain-day.png',
                    import.meta.url
                ).href
            },
            {
                title: 'Ylang Ylang',
                meta: '平静 | 适合财经题材 | 偏慢 | 03:33',
                active: false,
                coverImageUrl: new URL(
                    '../assets/music/ylang-ylang.png',
                    import.meta.url
                ).href
            },
            {
                title: '温馨治愈音乐之一',
                meta: '平静 | 适合社会题材 | 偏快 | 00:57',
                active: false,
                coverImageUrl: new URL(
                    '../assets/music/warm-healing.png',
                    import.meta.url
                ).href
            },
            {
                title: 'My Treasure',
                meta: '平静 | 适合通用题材 | 偏快 | 01:25',
                active: false,
                coverImageUrl: new URL(
                    '../assets/music/my-treasure.png',
                    import.meta.url
                ).href
            }
        ]
    }
} satisfies MusicConfigData;
