import type { ConfigMode } from './config';

export type { ConfigMode } from './config';

export type EditorIconName =
    | 'arrow-down'
    | 'arrow-up'
    | 'audio-lines'
    | 'captions'
    | 'chevron-down'
    | 'chevron-up'
    | 'check'
    | 'download'
    | 'ellipsis'
    | 'folder'
    | 'house'
    | 'gauge'
    | 'image'
    | 'link'
    | 'list-video'
    | 'magnet'
    | 'maximize'
    | 'maximize-2'
    | 'mic'
    | 'minus'
    | 'music'
    | 'play'
    | 'plus'
    | 'redo-2'
    | 'scissors'
    | 'send'
    | 'sparkles'
    | 'upload'
    | 'undo-2'
    | 'volume-2'
    | 'x'
    | 'volume';

export type StoryboardCardTone = 'current' | 'default';

export type StoryboardItem = {
    title: string;
    time: string;
    body: string;
    tone: StoryboardCardTone;
};

export type AssistantTag = {
    label: string;
    value: string;
};

export type RailMode = {
    label: string;
    icon: EditorIconName;
    mode: ConfigMode;
};

export type TimelineTrack = {
    id: TimelineTrackKind;
    icon: Extract<EditorIconName, 'image' | 'mic' | 'captions' | 'music'>;
    title: string;
    meta: string;
    tone: 'primary' | 'muted';
};

export type TimelineTrackKind = 'video' | 'voice' | 'subtitle' | 'music';

export type TimelineToolAction = {
    label: string;
    icon: Extract<EditorIconName, 'magnet' | 'audio-lines'>;
    tone: 'default' | 'active';
};

export type TimelineClip = {
    kind: TimelineTrackKind;
    label: string;
    widthPx: number;
    durationSeconds: number;
    colorClassName: string;
    caption?: string;
    showThumbnails?: boolean;
    bars?: number;
};

export type TimelineLayout = {
    sectionHeightClassName: string;
    contentGridClassName: string;
    contentRowsClassName: string;
    contentMinWidthClassName: string;
    titleBarHeightClassName: string;
    tickWidthClassName: string;
    contentWidthPx?: number;
    tickWidthPx?: number;
};

export type StoryboardSummary = {
    title: string;
    meta: string;
};

export type StoryboardData = {
    items: StoryboardItem[];
    summary: StoryboardSummary;
};

export type TimelinePanelSummary = {
    timecode: string;
    title: string;
};

export type TimelineData = {
    clipsByTrack: Record<TimelineTrackKind, TimelineClip[]>;
    layout: TimelineLayout;
    panel: TimelinePanelSummary;
    ticks: string[];
    tracks: TimelineTrack[];
};

export type EditorScreenData = {
    storyboard: StoryboardData;
    timeline: TimelineData;
};
