import type { EditorIconName } from './editor-screen';

export type ConfigMode = 'visual' | 'voice' | 'subtitle' | 'music';

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
};

export type VoiceSlider = {
    label: string;
    value: string;
    icon: Extract<EditorIconName, 'volume-2' | 'gauge'>;
    trackWidthClassName: string;
    progressWidthClassName: string;
    thumbLeftClassName: string;
};

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

export type BasicConfigPanelData = {
    header: {
        title: string;
        subtitle: string;
    };
    section: {
        title: string;
        subtitle: string;
    };
};
