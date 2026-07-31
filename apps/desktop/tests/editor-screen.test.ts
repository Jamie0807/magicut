import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import type { Component } from 'vue';
import { createSSRApp, h } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';

import { sampleVideoProject } from '@magicut/video-project';
import { renderToString } from '@vue/server-renderer';

import ConfigPanel from '../renderer/components/config/ConfigPanel.vue';
import ConfigPresetSwatch from '../renderer/components/config/shared/ConfigPresetSwatch.vue';
import ModeRail from '../renderer/components/editor/ModeRail.vue';
import { editorConfigMode } from '../renderer/constants/config';
import EditorScreen from '../renderer/pages/EditorScreen.vue';
import { appRoutes } from '../renderer/router';
import { createConfigModeSelectionHandler } from '../renderer/utils/configModeSelection';

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
        expect(visualHtml).toContain('aria-label="移除关联分镜"');
        expect(subtitleHtml).toContain('字幕设置');
        expect(subtitleHtml).toContain('显示字幕');
        expect(musicHtml).toContain('音乐设置');
        expect(panelHtml).not.toMatch(forbiddenBrandPattern);
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
        expect(html).toContain(
            'absolute top-[35px] left-[191px] h-[237px] w-5'
        );
        expect(html).toContain('[app-region:drag]');
        expect(html).toContain('[app-region:no-drag]');
        expect(html).not.toContain('absolute top-[45px] left-[195px]');
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
