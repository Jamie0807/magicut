export type VideoAgentVoiceOption = {
    description: string;
    label: string;
    voiceType: string;
};

export const videoAgentVoiceOptions = [
    {
        label: '温婉学姐',
        description: '柔和亲切 · 适合知识口播',
        voiceType: 'zh_female_wenroushunv_uranus_bigtts'
    },
    {
        label: '新闻播报',
        description: '清晰正式 · 适合资讯解说',
        voiceType: 'zh_male_cixingjieshuonan_uranus_bigtts'
    },
    {
        label: '沉稳男声',
        description: '低沉可靠 · 适合商业叙事',
        voiceType: 'zh_male_gaolengchenwen_uranus_bigtts'
    },
    {
        label: '活力讲解',
        description: '明快有力 · 适合教程种草',
        voiceType: 'zh_male_huolixiaoge_uranus_bigtts'
    }
] as const satisfies readonly VideoAgentVoiceOption[];

export const defaultVideoAgentVoice = videoAgentVoiceOptions[0];
