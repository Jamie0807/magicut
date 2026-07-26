import { describe, expect, it, vi } from 'vitest';
import type { Component } from 'vue';
import { createSSRApp, h } from 'vue';

import { renderToString } from '@vue/server-renderer';

import ConfigPanel from '../renderer/components/config/ConfigPanel.vue';
import ModeRail from '../renderer/components/editor/ModeRail.vue';
import { editorConfigMode } from '../renderer/constants/config';
import EditorScreen from '../renderer/pages/EditorScreen.vue';
import { createConfigModeSelectionHandler } from '../renderer/utils/configModeSelection';

const renderEditorScreen = () => renderToString(createSSRApp(EditorScreen));
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
        expect(html).toContain('8 段分镜 · 00:30 · 当前 00:04-00:08');
        expect(html).toContain('视频预览');
        expect(html).toContain('口播配音');
        expect(html).toContain('为当前分镜生成旁白音轨');
        expect(html).toContain('生成口播音轨');
        expect(html).not.toMatch(forbiddenBrandPattern);
    });

    it('uses voice config as the default renderer strategy', () => {
        expect(editorConfigMode).toBe('voice');
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
        expect(subtitleHtml).toContain('字幕样式');
        expect(musicHtml).toContain('音乐库');
        expect(panelHtml).not.toMatch(forbiddenBrandPattern);
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
        expect(html).toContain(
            'grid-rows-[30px_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]'
        );
        expect(html).toContain('min-w-[1721px]');
        expect(html).toContain('h-[320px]');
        expect(html).toContain('h-[52px]');
        expect(html).toContain('[app-region:drag]');
        expect(html).toContain('[app-region:no-drag]');
    });

    it('renders accessible editing controls', async () => {
        const html = await renderEditorScreen();

        expect(html).toContain('aria-label="播放预览"');
        expect(html).toContain('aria-label="预览音量"');
        expect(html).toContain('aria-label="放大预览"');
        expect(html).toContain('aria-label="撤销"');
        expect(html).toContain('aria-label="重做"');
        expect(html).toContain('aria-label="分割"');
        expect(html).toContain('aria-label="联动"');
        expect(html).toContain('aria-label="显示波形"');
    });
});
