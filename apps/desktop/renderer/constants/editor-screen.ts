import type {
    AssistantTag,
    RailMode,
    StoryboardItem,
    TimelineAudioClip,
    TimelineHistoryAction,
    TimelineLayout,
    TimelineToolAction,
    TimelineTrack,
    TimelineVideoClip
} from '../types/editor-screen';

export const editorHeader = {
    ariaLabel: '智能视频编辑器-画面',
    productName: 'Magicut',
    productDescription: '智能视频剪辑工具',
    homeHref: '/workspace',
    homeLabel: '返回工作台',
    title: '口播短片自动剪辑工程',
    status: '2 分钟前更新 · 已自动保存',
    primaryAction: '渲染导出'
};

export const storyboardSummary = {
    title: '文稿字幕',
    meta: '8 段分镜 · 00:30 · 当前 00:04-00:08'
};

export const storyboardItems: StoryboardItem[] = [
    {
        title: '分镜 01',
        time: '00:00-00:04',
        body: '开场把原始素材拖入时间线，\n系统开始识别画面节奏。',
        tone: 'default'
    },
    {
        title: '分镜 02',
        time: '00:04-00:08',
        body: 'AI 自动挑选高光片段，\n同步生成第一版字幕。',
        tone: 'current'
    },
    {
        title: '分镜 03',
        time: '00:08-00:12',
        body: '保留讲述者正面镜头，\n切入产品操作录屏。',
        tone: 'default'
    },
    {
        title: '分镜 04',
        time: '00:12-00:17',
        body: '字幕强调关键学习路线，\n画面进入轻微推近。',
        tone: 'default'
    },
    {
        title: '分镜 05',
        time: '00:17-00:24',
        body: '加入节奏点转场，\n背景音乐降低 20%。',
        tone: 'default'
    },
    {
        title: '分镜 06',
        time: '00:24-00:30',
        body: '结尾给出行动建议，\n停留在导出预览状态。',
        tone: 'default'
    }
];

export const previewPanel = {
    timecode: '00:00:00 / 00:01:27',
    imageAlt: '当前口播短片的视频预览画面'
};

export const assistantPanel = {
    timestamp: '6月10日 17:42',
    contextTitle: '0:00-0:25 开场问题',
    contextSummary:
        '大家好，很多前端同学现在都在焦虑一件事：\nAI 到底应该怎么学。我先问一下大家，如果...',
    analysis:
        '我来分析你的文稿，这是一份关于“前端 AI 进阶学习路线”的教学内容，时间线清晰、结构完整。让我先加载制片技能来完成方案设计。\n\n我已经加载了制片技能。现在分析你的文稿：\n\n这是一份完整的技术教学口播稿，主题聚焦“前端 AI 进阶学习路线”，包含 4 个时间段的内容：\n\n•  开场问题引入（0:00-0:25）\n•  为什么不能直接学 AI（0:25-0:55）\n•  三个月学习路线详解（0:55-2:45）\n•  收尾总结（2:45-3:05）',
    returnAction: '回到底部',
    quickEditTitle: '快捷调整',
    quickEditPlaceholder: '输入你的任何想法',
    linkedShot: '分镜 01'
};

export const assistantTags: AssistantTag[] = [
    { label: '视频画面', value: '智能匹配素材' },
    { label: '旁白配音', value: '温婉学姐' },
    { label: '创作倾向', value: 'AI 智能创作（默认）' }
];

export const railModes: RailMode[] = [
    {
        label: '画面',
        icon: 'image',
        mode: 'visual'
    },
    {
        label: '口播',
        icon: 'mic',
        mode: 'voice'
    },
    {
        label: '字幕',
        icon: 'captions',
        mode: 'subtitle'
    },
    {
        label: '音乐',
        icon: 'music',
        mode: 'music'
    }
];

export const timelinePanel = {
    title: '时间线',
    timecode: '00:00:00 / 00:01:27'
};

export const timelineLayout: TimelineLayout = {
    sectionHeightClassName: 'h-[320px]',
    contentGridClassName: 'grid-cols-[200px_minmax(0,1fr)]',
    contentRowsClassName:
        'grid-rows-[30px_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]',
    contentMinWidthClassName: 'min-w-[1721px]',
    titleBarHeightClassName: 'h-[52px]'
};

export const timelineHistoryActions: TimelineHistoryAction[] = [
    { label: '撤销', icon: 'undo-2' },
    { label: '重做', icon: 'redo-2' }
];

export const timelineToolActions: TimelineToolAction[] = [
    { label: '分割', icon: 'scissors', tone: 'default' },
    { label: '吸附', icon: 'magnet', tone: 'active' },
    { label: '联动', icon: 'link', tone: 'default' },
    { label: '显示波形', icon: 'audio-lines', tone: 'default' }
];

export const timelineTracks: TimelineTrack[] = [
    {
        icon: 'image',
        title: '视频 1',
        meta: '5 个分镜',
        tone: 'primary'
    },
    {
        icon: 'mic',
        title: '配音',
        meta: 'IndexTTS2 + 旁白',
        tone: 'muted'
    },
    {
        icon: 'captions',
        title: '字幕',
        meta: 'Whisper 已对齐',
        tone: 'primary'
    }
];

export const timelineTicks = [
    '00:00',
    '00:10',
    '00:20',
    '00:30',
    '00:40',
    '00:50',
    '01:00',
    '01:10',
    '01:20'
];

export const timelineVideoClips: TimelineVideoClip[] = [
    {
        label: '分镜01',
        widthClassName: 'w-[215px]',
        colorClassName: 'bg-[#1F6158] border-[#25D0B1]'
    },
    {
        label: '分镜02',
        widthClassName: 'w-[196px]',
        colorClassName: 'bg-[#294673] border-white/20'
    },
    {
        label: '分镜03',
        widthClassName: 'w-[194px]',
        colorClassName: 'bg-[#503984] border-white/20'
    },
    {
        label: '分镜04',
        widthClassName: 'w-[205px]',
        colorClassName: 'bg-[#74313E] border-white/20'
    },
    {
        label: '分镜05',
        widthClassName: 'w-[210px]',
        colorClassName: 'bg-[#3D3F45] border-white/20'
    }
];

export const timelineAudioClips: TimelineAudioClip[] = [
    {
        label: 'IndexTTS2 口播',
        widthClassName: 'w-[420px]',
        tone: 'voice',
        bars: 18
    },
    {
        label: '停顿',
        widthClassName: 'w-[66px]',
        tone: 'pause'
    },
    {
        label: '旁白 02',
        widthClassName: 'w-[330px]',
        tone: 'voice',
        bars: 13
    }
];
