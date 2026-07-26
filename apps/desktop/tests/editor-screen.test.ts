import { describe, expect, it } from 'vitest';
import { createSSRApp } from 'vue';

import { renderToString } from '@vue/server-renderer';

import EditorScreen from '../renderer/pages/EditorScreen.vue';

const renderEditorScreen = () => renderToString(createSSRApp(EditorScreen));
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
        expect(html).toContain('我来分析你的文稿');
        expect(html).toContain('快捷调整');
        expect(html).not.toMatch(forbiddenBrandPattern);
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
        expect(html).toContain('aria-label="移除关联分镜"');
    });
});
