import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import type { Component } from 'vue';
import { createSSRApp, h } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';

import { sampleVideoProject, type VideoProject } from '@magicut/video-project';
import { renderToString } from '@vue/server-renderer';

import ConfigPanel from '../renderer/components/config/ConfigPanel.vue';
import ConfigPresetSwatch from '../renderer/components/config/shared/ConfigPresetSwatch.vue';
import ModeRail from '../renderer/components/editor/ModeRail.vue';
import PreviewPanel from '../renderer/components/editor/PreviewPanel.vue';
import TimelinePanel from '../renderer/components/editor/TimelinePanel.vue';
import { editorConfigMode } from '../renderer/constants/config';
import EditorScreen from '../renderer/pages/EditorScreen.vue';
import { appRoutes } from '../renderer/router';
import type { PreviewSegment } from '../renderer/types/editor-screen';
import { createConfigModeSelectionHandler } from '../renderer/utils/configModeSelection';
import { advancePlaybackTime } from '../renderer/utils/editorPlayback';
import {
    getPreviewSegmentLocalTimeMs,
    isPreviewSegmentSourceExhausted
} from '../renderer/utils/previewPlayback';
import { calculateTimelinePointerTimeMs } from '../renderer/utils/timelinePointer';

const renderEditorScreen = async (props?: Record<string, unknown>) => {
    const app = createSSRApp(EditorScreen, props);
    const router = createRouter({
        history: createMemoryHistory(),
        routes: appRoutes
    });

    app.use(router);
    await router.push('/editor');
    await router.isReady();

    return renderToString(app);
};
const renderComponent = (
    component: Component,
    props?: Record<string, unknown>
) =>
    renderToString(
        createSSRApp({
            render: () => h(component, props)
        })
    );

const forbiddenBrandPattern = new RegExp(
    [
        'mi' + 'ao',
        'mi' + 'aoma',
        'mi' + 'aojian',
        '妙' + '码',
        '秒' + '码',
        '妙' + '剪'
    ].join('|'),
    'i'
);

describe('EditorScreen', () => {
    it('renders the smart video editor workspace', async () => {
        const html = await renderEditorScreen();

        expect(html).toContain('智能视频编辑器');
        expect(html).toContain('Magicut');
        expect(html).toContain('口播短片自动剪辑工程');
        expect(html).toContain('2 分钟前更新 · 已自动保存');
        expect(html).toContain('文稿字幕');
        expect(html).toContain('9 段分镜 · 01:30 · 当前 00:08-00:20');
        expect(html).toContain('视频预览');
        expect(html).toContain('口播配音');
        expect(html).toContain('为当前分镜生成旁白音轨');
        expect(html).toContain('生成口播音轨');
        expect(html).not.toMatch(forbiddenBrandPattern);
    });

    it('uses the loaded project title as an editable editor header title', async () => {
        const project = structuredClone(sampleVideoProject);
        project.project.title = '真实生成的项目标题';

        const html = await renderEditorScreen({ project });

        expect(html).toContain('aria-label="项目标题"');
        expect(html).toContain('value="真实生成的项目标题"');
        expect(html).not.toContain('口播短片自动剪辑工程</h1>');
    });

    it('renders project media through the preview panel and playback controls', async () => {
        const html = await renderComponent(PreviewPanel, {
            currentTimeMs: 1000,
            data: {
                alt: '真实视频画面',
                durationMs: 8000,
                segments: [
                    {
                        alt: '第一段真实视频',
                        endMs: 8000,
                        id: 'video_clip_001',
                        posterSource:
                            'magicut-media://project/project_real/thumbnail/thumbnail_asset_001',
                        source: 'magicut-media://project/project_real/video/video_asset_001',
                        sourceEndMs: 8000,
                        sourceStartMs: 0,
                        startMs: 0,
                        subtitleCues: [
                            {
                                endMs: 3000,
                                id: 'subtitle_clip_001',
                                startMs: 0,
                                text: '真实字幕'
                            }
                        ],
                        voiceCues: [
                            {
                                endMs: 3000,
                                id: 'voice_clip_001',
                                source: 'magicut-media://project/project_real/voice/voice_asset_001',
                                startMs: 0
                            }
                        ],
                        voiceSource:
                            'magicut-media://project/project_real/voice/voice_asset_001'
                    }
                ],
                source: 'magicut-media://project/project_real/video/video_asset_001',
                type: 'video'
            },
            isPlaying: true
        });

        expect(html).toContain('data-preview-source="project-video"');
        expect(html).toContain(
            'src="magicut-media://project/project_real/video/video_asset_001"'
        );
        expect(html).toContain(
            'poster="magicut-media://project/project_real/thumbnail/thumbnail_asset_001"'
        );
        expect(html).toContain(
            'src="magicut-media://project/project_real/voice/voice_asset_001"'
        );
        expect(html).toContain('data-preview-subtitle="true"');
        expect(html).toContain('真实字幕');
        expect(html).toContain('aria-label="暂停预览"');
    });

    it('wires preview playback into storyboard and timeline state', () => {
        const editorSource = readFileSync(
            resolve(__dirname, '../renderer/pages/EditorScreen.vue'),
            'utf8'
        );

        expect(editorSource).toContain('currentTimeMs');
        expect(editorSource).toContain('isPreviewPlaying');
        expect(editorSource).toContain('createPlaybackStoryboard');
        expect(editorSource).toContain('createTimelinePlayhead');
        expect(editorSource).toContain('@toggle-playback');
    });

    it('wires timeline seek and storyboard seek through the editor screen', () => {
        const editorSource = readFileSync(
            resolve(__dirname, '../renderer/pages/EditorScreen.vue'),
            'utf8'
        );

        expect(editorSource).toContain('committedTimeMs');
        expect(editorSource).toContain('previewTimeMs');
        expect(editorSource).toContain('hoverPreviewTimeMs');
        expect(editorSource).toContain('timelineHoverTimeMs');
        expect(editorSource).toContain('commitPreviewTime');
        expect(editorSource).toContain('previewTimelineTime');
        expect(editorSource).toContain('clearTimelineHoverTime');
        expect(editorSource).toContain('@seek="commitPreviewTime"');
        expect(editorSource).toContain(
            '@pointer-time-commit="commitPreviewTime"'
        );
        expect(editorSource).toContain(':hover-time-ms="timelineHoverTimeMs"');
        expect(editorSource).toContain(
            '@pointer-time-clear="clearTimelineHoverTime"'
        );
        expect(editorSource).toContain(
            '@pointer-time-preview="previewTimelineTime"'
        );
    });

    it('wires project title changes through the editor screen save flow', () => {
        const headerSource = readFileSync(
            resolve(
                __dirname,
                '../renderer/components/editor/EditorHeader.vue'
            ),
            'utf8'
        );
        const editorSource = readFileSync(
            resolve(__dirname, '../renderer/pages/EditorScreen.vue'),
            'utf8'
        );

        expect(headerSource).toContain('defineEmits');
        expect(headerSource).toContain('titleChange');
        expect(headerSource).toContain("event.key === 'Escape'");
        expect(editorSource).toContain('handleProjectTitleChange');
        expect(editorSource).toContain('window.magicutAPI.videoProject.create');
        expect(editorSource).toContain('刚刚更新 · 已自动保存');
        expect(editorSource).toContain('标题保存失败');
    });

    it('uses voice config as the default renderer strategy', () => {
        expect(editorConfigMode).toBe('voice');
    });

    it('renders playable voice previews and adjustable voice parameters', async () => {
        const html = await renderComponent(ConfigPanel, { mode: 'voice' });

        for (const label of ['温婉学姐', '沉稳男声', '新闻播报', '活力讲解']) {
            expect(html).toContain(`aria-label="试听${label}"`);
            expect(html).toContain(`data-voice-preview="${label}"`);
        }

        expect(html).toContain('data-voice-preview-audio="true"');
        expect(html).toContain('/voice-previews/');
        expect(html).toContain('type="range"');
        expect(html).toContain('aria-label="音量"');
        expect(html).toContain('aria-label="语速"');
        expect(html).toContain('value="82"');
        expect(html).toContain('value="1.05"');
    });

    it('wires the voice generation button to regenerate all narration clips', () => {
        const editorSource = readFileSync(
            resolve(__dirname, '../renderer/pages/EditorScreen.vue'),
            'utf8'
        );
        const configPanelSource = readFileSync(
            resolve(__dirname, '../renderer/components/config/ConfigPanel.vue'),
            'utf8'
        );
        const voicePanelSource = readFileSync(
            resolve(
                __dirname,
                '../renderer/components/config/voice/VoiceConfigPanel.vue'
            ),
            'utf8'
        );
        const primaryButtonSource = readFileSync(
            resolve(
                __dirname,
                '../renderer/components/config/shared/ConfigPrimaryButton.vue'
            ),
            'utf8'
        );

        expect(editorSource).toContain('handleRegenerateVoices');
        expect(editorSource).toContain(
            'window.magicutAPI.videoAgent.regenerateVoices'
        );
        expect(editorSource).toContain(
            '@regenerate-voices="handleRegenerateVoices"'
        );
        expect(configPanelSource).toContain('regenerateVoices');
        expect(voicePanelSource).toContain('onRegenerateVoices');
        expect(voicePanelSource).toContain('selectedPreset.voiceType');
        expect(primaryButtonSource).toContain('disabled');
        expect(primaryButtonSource).toContain('@click');
    });

    it('stops the voice preset preview when editor preview playback starts', () => {
        const editorSource = readFileSync(
            resolve(__dirname, '../renderer/pages/EditorScreen.vue'),
            'utf8'
        );
        const configPanelSource = readFileSync(
            resolve(__dirname, '../renderer/components/config/ConfigPanel.vue'),
            'utf8'
        );
        const voicePanelSource = readFileSync(
            resolve(
                __dirname,
                '../renderer/components/config/voice/VoiceConfigPanel.vue'
            ),
            'utf8'
        );

        expect(editorSource).toContain('voicePreviewStopSignal');
        expect(editorSource).toContain('voicePreviewStopSignal.value += 1');
        expect(configPanelSource).toContain('voicePreviewStopSignal');
        expect(voicePanelSource).toContain(
            'props.context.voicePreviewStopSignal'
        );
        expect(voicePanelSource).toContain('audio.pause()');
    });

    it('links the editor logo back to the workspace', async () => {
        const html = await renderEditorScreen();

        expect(html).toContain('aria-label="返回工作台"');
        expect(html).toContain('href="/workspace"');
        expect(html).toContain('group-hover:hidden');
        expect(html).toContain('group-hover:grid');
        expect(html).toContain('group-focus-visible:hidden');
        expect(html).toContain('group-focus-visible:grid');
        expect(html).not.toMatch(forbiddenBrandPattern);
    });

    it('switches config panel strategies by mode', async () => {
        const voiceHtml = await renderComponent(ConfigPanel, { mode: 'voice' });
        const visualHtml = await renderComponent(ConfigPanel, {
            mode: 'visual'
        });
        const subtitleHtml = await renderComponent(ConfigPanel, {
            mode: 'subtitle'
        });
        const musicHtml = await renderComponent(ConfigPanel, { mode: 'music' });
        const panelHtml = [voiceHtml, visualHtml, subtitleHtml, musicHtml].join(
            ''
        );

        expect(voiceHtml).toContain('口播配音');
        expect(voiceHtml).toContain('选择音色');
        expect(voiceHtml).toContain('温婉学姐');
        expect(voiceHtml).toContain('自定义音色库');
        expect(voiceHtml).toContain('参数调整');
        expect(visualHtml).toContain('快捷调整');
        expect(visualHtml).toContain('输入你的任何想法');
        expect(visualHtml).toContain('aria-hidden="true"');
        expect(subtitleHtml).toContain('字幕设置');
        expect(subtitleHtml).toContain('显示字幕');
        expect(musicHtml).toContain('音乐设置');
        expect(panelHtml).not.toMatch(forbiddenBrandPattern);
    });

    it('shows the persisted creation conversation in the visual config rail', async () => {
        const project: VideoProject = structuredClone(sampleVideoProject);
        project.ai.conversation = [
            {
                blocks: [
                    {
                        text: '我会先把文稿拆成镜头目标，再匹配本地素材。',
                        type: 'paragraph'
                    }
                ],
                content: '我会先把文稿拆成镜头目标，再匹配本地素材。',
                createdAt: '2026-06-23T08:00:01.000Z',
                nodeName: 'creative_brief',
                role: 'assistant',
                sequence: 1,
                sourceEventType: 'model.stream.completed',
                tone: 'completed'
            },
            {
                blocks: [
                    {
                        items: [
                            {
                                detail: '生成分镜并等待确认',
                                label: '02 创建分镜',
                                status: 'completed'
                            }
                        ],
                        type: 'progress'
                    }
                ],
                content: '执行流程已更新',
                createdAt: '2026-06-23T08:00:02.000Z',
                role: 'system',
                sequence: 2,
                sourceEventType: 'run.progress',
                tone: 'completed'
            },
            {
                blocks: [
                    {
                        columns: ['分镜', '画面意图', '口播字幕', '时长'],
                        rows: [
                            [
                                '开场问题',
                                '横屏口播画面',
                                '很多前端同学都在焦虑 AI 怎么学。',
                                '8.0s'
                            ]
                        ],
                        type: 'table'
                    }
                ],
                content: '请确认分镜方案',
                createdAt: '2026-06-23T08:00:03.000Z',
                role: 'assistant',
                sequence: 3,
                sourceEventType: 'approval.required',
                tone: 'waiting'
            },
            {
                content: '确认这个分镜方案，继续生成视频。',
                createdAt: '2026-06-23T08:00:04.000Z',
                role: 'user',
                sequence: 4,
                sourceEventType: 'user.reply'
            }
        ];

        const html = await renderEditorScreen({
            initialMode: 'visual',
            project
        });

        expect(html).toContain('data-visual-conversation-feed="true"');
        expect(html).toContain('创建过程');
        expect(html).toContain('4 条');
        expect(html).toContain('我会先把文稿拆成镜头目标，再匹配本地素材。');
        expect(html).toContain('02 创建分镜');
        expect(html).toContain('生成分镜并等待确认');
        expect(html).toContain('状态：已完成');
        expect(html).toContain('开场问题');
        expect(html).toContain('横屏口播画面');
        expect(html).toContain('确认这个分镜方案，继续生成视频。');
        expect(html).toContain('data-visual-conversation-message="user"');
        expect(html).toContain('data-visual-conversation-message="assistant"');
        expect(html).toContain('data-visual-conversation-message="system"');
        expect(html).not.toContain('这是一份完整的技术教学口播稿');
    });

    it('keeps the visual config static analysis fallback without a persisted conversation', async () => {
        const html = await renderComponent(ConfigPanel, { mode: 'visual' });

        expect(html).not.toContain('data-visual-conversation-feed="true"');
        expect(html).toContain('这是一份完整的技术教学口播稿');
    });

    it('uses a real textarea composer in the visual config rail', async () => {
        const html = await renderComponent(ConfigPanel, { mode: 'visual' });

        expect(html).not.toContain('回到底部');
        expect(html).toContain('textarea');
        expect(html).toContain('aria-label="输入快捷调整"');
        expect(html).toContain('placeholder="输入你的任何想法"');
        expect(html).toContain('resize-none');
    });

    it('links the active scene into the quick adjustment composer', async () => {
        const html = await renderEditorScreen({
            initialMode: 'visual',
            project: sampleVideoProject
        });

        expect(html).toContain('data-selected-scene-id="scene_001"');
        expect(html).toContain('分镜 01');
        expect(html).toContain('aria-label="发送快捷调整"');
        expect(html).toContain('disabled');
        expect(html).toContain('pb-[14px]');
    });

    it('hides the linked scene chip when no scene is selected', async () => {
        const html = await renderComponent(ConfigPanel, { mode: 'visual' });

        expect(html).not.toContain('data-selected-scene-id');
        expect(html).toContain('aria-hidden="true"');
    });

    it('wires scene selection and regeneration through the editor screen', () => {
        const editorSource = readFileSync(
            resolve(__dirname, '../renderer/pages/EditorScreen.vue'),
            'utf8'
        );
        const scriptPanelSource = readFileSync(
            resolve(__dirname, '../renderer/components/editor/ScriptPanel.vue'),
            'utf8'
        );
        const timelinePanelSource = readFileSync(
            resolve(
                __dirname,
                '../renderer/components/editor/TimelinePanel.vue'
            ),
            'utf8'
        );
        const visualPanelSource = readFileSync(
            resolve(
                __dirname,
                '../renderer/components/config/visual/VisualConfigPanel.vue'
            ),
            'utf8'
        );

        expect(editorSource).toContain('handleSceneSelect');
        expect(editorSource).toContain('handleRegenerateScene');
        expect(editorSource).toContain('applySceneRegenerationStreamEvent');
        expect(editorSource).toContain(
            'createSceneRegenerationPendingConversation'
        );
        expect(editorSource).toContain(
            'window.magicutAPI.videoAgent.regenerateScene'
        );
        expect(editorSource).toContain('@scene-select="handleSceneSelect"');
        expect(editorSource).toContain(
            '@regenerate-scene="handleRegenerateScene"'
        );
        expect(scriptPanelSource).toContain('sceneSelect');
        expect(scriptPanelSource).toContain('data-storyboard-scene-id');
        expect(timelinePanelSource).toContain('sceneSelect');
        expect(timelinePanelSource).toContain('data-timeline-scene-id');
        expect(visualPanelSource).toContain('onRegenerateScene');
        expect(visualPanelSource).toContain('prompt.value.trim()');
    });

    it('renders music settings with current track and recommendations', async () => {
        const html = await renderComponent(ConfigPanel, { mode: 'music' });

        expect(html).toContain('音乐设置');
        expect(html).toContain('控制背景音乐与推荐曲库');
        expect(html).toContain('开启');
        expect(html).toContain('当前音乐');
        expect(html).toContain('Eutopia');
        expect(html).toContain('Mika Chen');
        expect(html).toContain('偏慢 · 02:01 · 已对齐时间线');
        expect(html).toContain('音量');
        expect(html).toContain('60%');
        expect(html).toContain('推荐音乐');
        expect(html).toContain('全部');
        expect(html).toContain('平静');
        expect(html).toContain('欢快');
        expect(html).toContain('励志');
        expect(html).toContain('抒情');
        expect(html).toContain('更多');
        expect(html).toContain('使用中');
        expect(html).toContain('eutopia.png');
        expect(html).toContain('卡农（经典钢琴版）');
        expect(html).toContain('通用 日常 平和');
        expect(html).toContain('Ylang Ylang');
        expect(html).toContain('温馨治愈音乐之一');
        expect(html).toContain('My Treasure');
        expect(html).not.toContain('移除');
        expect(html).not.toContain('应用音乐');
        expect(html).not.toMatch(forbiddenBrandPattern);
    });

    it('renders subtitle settings controls and preset swatches', async () => {
        const html = await renderComponent(ConfigPanel, { mode: 'subtitle' });

        expect(html).toContain('字幕设置');
        expect(html).toContain('调整当前字幕轨显示样式');
        expect(html).toContain('显示字幕');
        expect(html).toContain('aria-pressed="true"');
        expect(html).toContain('42 px');
        expect(html).toContain('w-[260px]');
        expect(html).toContain('字幕样式');
        expect(html).toContain('应用到当前字幕轨');
        expect(html).toContain('白字黑边');
        expect(html).toContain('经典白字');
        expect(html).toContain('黄字黑边');
        expect(html).toContain('红字白边');
        expect(html).toContain('青灰字幕');
        expect(html).toContain('粉色字幕');
        expect(html).toContain('蓝色字幕');
        expect(html).not.toMatch(forbiddenBrandPattern);
    });

    it('keeps seven subtitle presets with one active style', async () => {
        const html = await renderComponent(ConfigPanel, { mode: 'subtitle' });
        const presetCount =
            html.match(/data-testid="subtitle-preset"/g)?.length ?? 0;
        const activePresetCount =
            html.match(/data-testid="subtitle-preset" data-active="true"/g)
                ?.length ?? 0;
        const inactivePresetCount =
            html.match(/data-testid="subtitle-preset" data-active="false"/g)
                ?.length ?? 0;

        expect(html).toContain('aria-label="显示字幕" aria-pressed="true"');
        expect(presetCount).toBe(7);
        expect(activePresetCount).toBe(1);
        expect(inactivePresetCount).toBe(6);
    });

    it('positions subtitle preset glyph layers', async () => {
        const html = await renderComponent(ConfigPresetSwatch, {
            label: '白字黑边',
            active: true,
            backgroundColor: '#0D201B',
            borderColor: '#F05F73',
            outerTextColor: '#000000',
            innerTextColor: '#F5F7FA'
        });

        expect(html).toContain('absolute top-[6px] left-[8px]');
        expect(html).toContain('absolute top-[6px] left-[10px]');
        expect(html).not.toContain('grid h-[20px] place-items-center');
    });

    it('reuses the shared slider track for voice and subtitle sliders', async () => {
        const voiceHtml = await renderComponent(ConfigPanel, { mode: 'voice' });
        const subtitleHtml = await renderComponent(ConfigPanel, {
            mode: 'subtitle'
        });
        const trackMarkup =
            'absolute top-[5px] left-0 h-[6px] w-full rounded-full bg-[#30343C]';

        expect(voiceHtml).toContain(trackMarkup);
        expect(subtitleHtml).toContain(trackMarkup);
    });

    it('renders mode rail buttons with active state and switch affordances', async () => {
        const html = await renderComponent(ModeRail, { activeMode: 'voice' });

        expect(html).toContain('data-mode="visual"');
        expect(html).toContain('data-mode="voice"');
        expect(html).toContain('data-mode="subtitle"');
        expect(html).toContain('data-mode="music"');
        expect(html).toContain('aria-current="page"');
        expect(html).toContain('cursor-pointer');
        expect(html).toContain('transition-all');
        expect(html).toContain('hover:-translate-y-[1px]');
        expect(html).toContain('hover:bg-white/5');
    });

    it('routes the selected config mode through the rail selection handler', () => {
        const onModeChange = vi.fn();
        const selectMode = createConfigModeSelectionHandler(onModeChange);

        selectMode('subtitle');
        expect(onModeChange).toHaveBeenCalledWith('subtitle');
    });

    it('keeps the compact editor layout and timeline structure', async () => {
        const html = await renderEditorScreen();

        expect(html).toContain(
            'grid-cols-[300px_minmax(420px,1fr)_320px_59px]'
        );
        expect(html).toContain('grid-cols-[200px_minmax(0,1fr)]');
        expect(html).toContain('grid-rows-[30px_50px_50px_50px_50px]');
        expect(html).toContain('min-w-[1728px]');
        expect(html).toContain('w-[1728px]');
        expect(html).toContain('h-[272px]');
        expect(html).toContain('h-[42px]');
        expect(html).toContain('overflow-x-auto');
        expect(html).toContain('absolute top-[35px] h-[237px] w-5');
        expect(html).toContain('data-playhead-progress="0"');
        expect(html).toContain('data-playhead-scroll-left="0"');
        expect(html).toContain('left:calc(200px - 9px);');
        expect(html).toContain('transform:translateX(0px);');
        expect(html).toContain('will-change-transform');
        expect(html).toContain('[app-region:drag]');
        expect(html).toContain('[app-region:no-drag]');
        expect(html).not.toContain('absolute top-[45px] left-[195px]');
    });

    it('renders timeline hover playhead with a readable time label', async () => {
        const html = await renderComponent(TimelinePanel, {
            data: {
                clipsByTrack: {
                    music: [],
                    subtitle: [],
                    video: [],
                    voice: []
                },
                layout: {
                    contentGridClassName: 'grid-cols-[200px_minmax(0,1fr)]',
                    contentMinWidthClassName: 'min-w-[1728px] w-[1728px]',
                    contentRowsClassName:
                        'grid-rows-[30px_50px_50px_50px_50px]',
                    contentWidthPx: 1728,
                    sectionHeightClassName: 'h-[272px]',
                    tickWidthClassName: 'w-[192px]',
                    tickWidthPx: 192,
                    titleBarHeightClassName: 'h-[42px]'
                },
                panel: {
                    timecode: '00:00 - 01:30',
                    title: '时间线'
                },
                playhead: {
                    currentTimeMs: 0,
                    progress: 0
                },
                ticks: ['00:00'],
                tracks: []
            },
            durationMs: 90_000,
            hoverTimeMs: 45_000
        });

        expect(html).toContain('data-timeline-hover-playhead="true"');
        expect(html).toContain('data-hover-time-ms="45000"');
        expect(html).toContain('00:45');
        expect(html).toContain('translateX(864px)');
    });

    it('maps timeline pointer coordinates to preview time', () => {
        expect(
            calculateTimelinePointerTimeMs({
                clientX: 300,
                contentWidthPx: 1728,
                durationMs: 90_000,
                scrollContainerLeft: 200,
                scrollLeft: 0
            })
        ).toBe(5_208);
        expect(
            calculateTimelinePointerTimeMs({
                clientX: 50,
                contentWidthPx: 1728,
                durationMs: 90_000,
                scrollContainerLeft: 200,
                scrollLeft: 0
            })
        ).toBe(0);
        expect(
            calculateTimelinePointerTimeMs({
                clientX: 1_000,
                contentWidthPx: 1728,
                durationMs: 90_000,
                scrollContainerLeft: 200,
                scrollLeft: 1_000
            })
        ).toBe(90_000);
    });

    it('freezes a short source video on its last frame until the next segment', () => {
        const segment: PreviewSegment = {
            alt: '短视频分镜',
            endMs: 10_000,
            id: 'segment_short_video',
            source: 'magicut-media://project/project_preview/video/video_short',
            sourceEndMs: 5_000,
            sourceStartMs: 0,
            startMs: 0,
            subtitleCues: []
        };

        expect(
            getPreviewSegmentLocalTimeMs({
                currentTimeMs: 7_500,
                segment
            })
        ).toBe(5_000);
    });

    it('detects when a video source is shorter than its segment', () => {
        const segment: PreviewSegment = {
            alt: '短视频分镜',
            endMs: 10_000,
            id: 'segment_short_video',
            source: 'magicut-media://project/project_preview/video/video_short',
            sourceEndMs: 5_000,
            sourceStartMs: 1_000,
            startMs: 0,
            subtitleCues: []
        };

        expect(
            isPreviewSegmentSourceExhausted({
                currentTimeMs: 3_999,
                segment
            })
        ).toBe(false);
        expect(
            isPreviewSegmentSourceExhausted({
                currentTimeMs: 4_000,
                segment
            })
        ).toBe(true);
    });

    it('advances playback time from the actual animation frame delta', () => {
        expect(
            advancePlaybackTime({
                currentTimeMs: 8_000,
                durationMs: 90_000,
                elapsedMs: 16.7
            })
        ).toBe(8_016.7);
        expect(
            advancePlaybackTime({
                currentTimeMs: 89_990,
                durationMs: 90_000,
                elapsedMs: 50
            })
        ).toBe(90_000);
    });

    it('renders accessible editing controls', async () => {
        const html = await renderEditorScreen();

        expect(html).toContain('aria-label="播放预览"');
        expect(html).toContain('aria-label="预览音量"');
        expect(html).toContain('aria-label="放大预览"');
        expect(html).not.toContain('aria-label="撤销"');
        expect(html).not.toContain('aria-label="重做"');
        expect(html).not.toContain('aria-label="分割"');
        expect(html).not.toContain('aria-label="联动"');
        expect(html).toContain('aria-label="吸附"');
        expect(html).toContain('aria-label="波纹"');
    });

    it('renders four compact scene-aligned timeline tracks with continuous clips', async () => {
        const html = await renderEditorScreen();
        const countMatches = (pattern: RegExp) =>
            html.match(pattern)?.length ?? 0;

        expect(html).toContain('视频 1');
        expect(html).toContain('配音');
        expect(html).toContain('字幕');
        expect(html).toContain('音乐');
        expect(html).toContain('9 个分镜');
        expect(html).toContain('9 段旁白');
        expect(html).toContain('18 段字幕');
        expect(html).toContain('Eutopia · 全片背景音乐');
        expect(html).toContain('分镜09');
        expect(html).toContain('旁白09');
        expect(html).toContain('字幕09');

        expect(countMatches(/data-timeline-track="video"/g)).toBe(1);
        expect(countMatches(/data-timeline-track="voice"/g)).toBe(1);
        expect(countMatches(/data-timeline-track="subtitle"/g)).toBe(1);
        expect(countMatches(/data-timeline-track="music"/g)).toBe(1);
        expect(countMatches(/data-timeline-clip-kind="video"/g)).toBe(9);
        expect(countMatches(/data-timeline-clip-kind="voice"/g)).toBe(9);
        expect(countMatches(/data-timeline-clip-kind="subtitle"/g)).toBe(18);
        expect(countMatches(/data-timeline-clip-kind="music"/g)).toBe(1);

        expect(html).toContain('data-duration-seconds="8"');
        expect(html).toContain('data-duration-seconds="15"');
        expect(html).toContain('data-width-px="154"');
        expect(html).toContain('data-width-px="288"');
        expect(html).toContain('字幕02-02');
        expect(html).toContain('h-[28px]');
        expect(html).not.toContain('h-[38px]');
        expect(html).toContain('text-[11px]');
        expect(html).not.toContain('text-sm font-extrabold text-[#F5F7FA]');
        expect(html).toContain('h-3 w-0.5 shrink-0');
        expect(html).toContain('h-3 w-3 shrink-0 text-[#F6B84B]');
        expect(html).toContain('h-3 w-3 shrink-0 text-[#8EA2FF]');
        expect(html).toContain('ml-auto flex gap-[2px]');
        expect(html).toContain('h-2 w-2 rounded');
        expect(html).toContain('data-waveform-size="compact"');
        expect(html).toContain('w-[2px] rounded-full bg-[#BFFFE266]');
        expect(html).toContain('rounded-md border');
        expect(html).toContain('w-[192px]');
        expect(html).toContain('w-[1728px]');
        expect(html).toContain('gap-0');
        expect(html).not.toContain('gap-[15px] px-3');
        expect(html).not.toContain('gap-3 px-3');
        expect(html).not.toContain('w-[760px]');
    });
});
