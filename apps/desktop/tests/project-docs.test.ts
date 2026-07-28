import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = join(process.cwd(), '..', '..');
const designDocPath =
    'docs/superpowers/specs/2026-06-23-video-creation-agent-design.md';
const planDocPath = 'docs/superpowers/plans/2026-06-23-video-creation-agent.md';
const forbiddenLegacyPattern = new RegExp(
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

const readRepoFile = (relativePath: string) =>
    readFileSync(join(repoRoot, relativePath), 'utf8');

describe('video creation agent docs', () => {
    it('documents local model environment variables without real secrets', () => {
        const envExample = readRepoFile('.env.example');
        const gitignore = readRepoFile('.gitignore');

        expect(envExample).toContain('LLM_MODEL=doubao-seed-2.0-pro');
        expect(envExample).toContain('TTS_MODEL=seed-tts-2.0');
        expect(envExample).toContain(
            'BASE_URL=https://ark.cn-beijing.volces.com/api/plan/v3'
        );
        expect(envExample).toContain(
            'API_KEY=replace-with-your-volcengine-ark-api-key'
        );
        expect(envExample).not.toMatch(forbiddenLegacyPattern);

        expect(gitignore).toContain('# Local environment secrets');
        expect(gitignore).toContain('.env');
        expect(gitignore).toContain('.env.local');
        expect(gitignore).toContain('.env.*');
        expect(gitignore).toContain('!.env.example');
        expect(gitignore).toContain('.dependencygraph');
        expect(gitignore).not.toMatch(forbiddenLegacyPattern);
    });

    it('adds Magicut and Vue oriented video creation agent specs', () => {
        const designDoc = readRepoFile(designDocPath);
        const planDoc = readRepoFile(planDocPath);
        const docs = `${designDoc}\n${planDoc}`;

        expect(designDoc).toContain('# Magicut 视频创作智能体设计');
        expect(planDoc).toContain(
            '# Magicut 视频创作智能体 Implementation Plan'
        );
        expect(docs).toContain('VideoProject JSON');
        expect(docs).toContain('LangGraphJS');
        expect(docs).toContain('SQLite');
        expect(docs).toContain('AgentRunEvent');
        expect(docs).toContain('ChatOpenAI');
        expect(docs).toContain('volcengine-tts-provider');
        expect(docs).toContain('@magicut/video-project');
        expect(docs).toContain('apps/desktop/renderer/pages/EditorScreen.vue');
        expect(docs).toContain(
            'apps/desktop/renderer/components/create/CreateInputPanel.vue'
        );
        expect(docs).toContain('window.magicutAPI.videoProject');
        expect(docs).not.toContain('.' + 'tsx');
        expect(docs).not.toContain('Mi' + 'aojian');
        expect(docs).not.toContain(`window.${'mi' + 'aoma'}API`);
        expect(docs).not.toMatch(forbiddenLegacyPattern);
    });
});
