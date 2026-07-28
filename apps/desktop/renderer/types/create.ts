export type CreateModeTone = 'active' | 'default';

export type CreateModeOption = {
    label: string;
    tone: CreateModeTone;
    widthClassName: string;
};

export type CreateVoiceOption = {
    label: string;
    description: string;
};

export type CreatePageContent = {
    titlePrefix: string;
    titleAccent: string;
    titleAccentColors: string[];
    subtitle: string;
    modes: CreateModeOption[];
    placeholder: string;
    maxLength: number;
    voiceLabelPrefix: string;
    voiceOptions: CreateVoiceOption[];
    actionLabel: string;
};
