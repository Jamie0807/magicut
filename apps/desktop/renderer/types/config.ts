import type { AgentConversationMessage } from '@magicut/video-project';

import type { VideoAgentVoiceSettings } from '../../shared/video-agent-voices';

import type { EditorIconName } from './editor-screen';

export type ConfigMode = 'visual' | 'voice' | 'subtitle' | 'music';

export type ConfigPanelContext = {
    conversation?: AgentConversationMessage[];
    isRegeneratingScene?: boolean;
    isRegeneratingVoices?: boolean;
    musicSettings?: MusicSettings;
    onClearSelectedScene?: () => void;
    onMusicSettingsChange?: (settings: MusicSettings) => void;
    onRegenerateScene?: (input: {
        prompt: string;
        sceneId: string;
    }) => Promise<void> | void;
    onRegenerateVoices?: (input: {
        selectedVoice: string;
        selectedVoiceType?: string;
    }) => Promise<void> | void;
    onSubtitleSettingsChange?: (settings: SubtitleSettings) => void;
    onVoiceSettingsChange?: (settings: VideoAgentVoiceSettings) => void;
    selectedScene?: {
        endMs?: number;
        id: string;
        label: string;
        script: string;
        startMs?: number;
    };
    subtitleSettings?: SubtitleSettings;
    voicePreviewStopSignal?: number;
    voiceSettings?: VideoAgentVoiceSettings;
};

export type ConfigTagPairData = {
    label: string;
    value: string;
};

export type VisualConfigData = {
    timestamp: string;
    contextTitle: string;
    contextSummary: string;
    tags: ConfigTagPairData[];
    analysis: string;
    returnAction: string;
    quickAdjust: {
        title: string;
        placeholder: string;
        linkedShot: string;
    };
};

export type VoicePresetCard = {
    title: string;
    description: string;
    selected: boolean;
    actionIcon: Extract<EditorIconName, 'play'>;
    previewAudioUrl: string;
    voiceType: string;
};

export type SliderTrackConfig = {
    label: string;
    max?: number;
    min?: number;
    numericValue?: number;
    step?: number;
    value: string;
    trackWidthClassName: string;
    progressWidthClassName: string;
    thumbLeftClassName: string;
};

export type SliderRow = SliderTrackConfig & {
    icon?: Extract<EditorIconName, 'volume-2' | 'gauge'>;
};

export type VoiceSlider = SliderRow;

export type VoiceUploadCard = {
    title: string;
    description: string;
    buttonIcon: Extract<EditorIconName, 'plus'>;
};

export type VoiceConfigData = {
    header: {
        title: string;
        subtitle: string;
    };
    section: {
        title: string;
        subtitle: string;
    };
    presets: VoicePresetCard[];
    uploadCard: VoiceUploadCard;
    sliders: VoiceSlider[];
    actionLabel: string;
};

export type SubtitlePreset = {
    label: string;
    active: boolean;
    backgroundColor: string;
    borderColor: string;
    outerTextColor: string;
    innerTextColor: string;
};

export type SubtitleSettings = {
    fontSizePx: number;
    isVisible: boolean;
    outlineColor: string;
    presetLabel: string;
    textColor: string;
};

export type SubtitlePreviewStyle = Omit<SubtitleSettings, 'isVisible'>;

export type SubtitleConfigData = {
    header: {
        title: string;
        subtitle: string;
    };
    visibility: {
        label: string;
        enabled: boolean;
    };
    size: SliderTrackConfig;
    style: {
        title: string;
        subtitle: string;
        presets: SubtitlePreset[];
        activePresetLabel: string;
    };
};

export type MusicCategoryChip = {
    label: string;
    active: boolean;
};

export type MusicTrack = {
    active: boolean;
    coverImageUrl: string;
    durationLabel: string;
    durationMs: number;
    id: string;
    mood: string;
    scenes: string[];
    sourceUrl: string;
    tempo: string;
    title: string;
    meta: string;
    statusLabel?: string;
};

export type MusicSettings = {
    enabled: boolean;
    selectedTrackId: string;
    volume: number;
};

export type MusicConfigData = {
    header: {
        title: string;
        subtitle: string;
        toggleLabel: string;
        toggleEnabled: boolean;
    };
    current: {
        sectionTitle: string;
        trackTitle: string;
        artistLine: string;
        metaLine: string;
        coverImageUrl: string;
    };
    volume: SliderRow;
    recommendations: {
        title: string;
        categories: MusicCategoryChip[];
        tracks: MusicTrack[];
    };
};
