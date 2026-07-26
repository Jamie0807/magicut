import type { ConfigMode } from './config';

export type EditorIconName =
    | 'arrow-down'
    | 'arrow-up'
    | 'audio-lines'
    | 'captions'
    | 'chevron-up'
    | 'check'
    | 'download'
    | 'gauge'
    | 'image'
    | 'link'
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
    icon: Extract<EditorIconName, 'image' | 'mic' | 'captions'>;
    title: string;
    meta: string;
    tone: 'primary' | 'muted';
};

export type TimelineHistoryAction = {
    label: string;
    icon: Extract<EditorIconName, 'undo-2' | 'redo-2'>;
};

export type TimelineToolAction = {
    label: string;
    icon: Extract<
        EditorIconName,
        'scissors' | 'magnet' | 'link' | 'audio-lines'
    >;
    tone: 'default' | 'active';
};

export type TimelineVideoClip = {
    label: string;
    widthClassName: string;
    colorClassName: string;
};

export type TimelineAudioClip = {
    label: string;
    widthClassName: string;
    tone: 'voice' | 'pause';
    bars?: number;
};

export type TimelineLayout = {
    sectionHeightClassName: string;
    contentGridClassName: string;
    contentRowsClassName: string;
    contentMinWidthClassName: string;
    titleBarHeightClassName: string;
};
