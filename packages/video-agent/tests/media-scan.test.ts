import { chmod, mkdtemp, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { extractKeyframes } from '../src/media/extract-keyframes';
import { probeMedia } from '../src/media/probe-media';

const createExecutableScript = async ({
    content,
    directory,
    name
}: {
    content: string;
    directory: string;
    name: string;
}) => {
    const scriptPath = path.join(directory, name);
    await writeFile(scriptPath, content, 'utf8');
    await chmod(scriptPath, 0o755);

    return scriptPath;
};

describe('media scan tools', () => {
    let tempDirectory: string;
    let videoPath: string;

    beforeEach(async () => {
        tempDirectory = await mkdtemp(path.join(tmpdir(), 'magicut-media-'));
        videoPath = path.join(tempDirectory, 'fixture.mp4');
        await writeFile(videoPath, 'fake video content', 'utf8');
    });

    afterEach(async () => {
        await rm(tempDirectory, { force: true, recursive: true });
    });

    it('probes video duration, dimensions, frame rate, and codec', async () => {
        const ffprobePath = await createExecutableScript({
            content: `#!/usr/bin/env node
const filePath = process.argv.at(-1);
if (!filePath?.endsWith('fixture.mp4')) {
  process.exit(2);
}
process.stdout.write(JSON.stringify({
  format: { duration: '1.25' },
  streams: [{
    codec_name: 'h264',
    codec_type: 'video',
    duration: '1.00',
    r_frame_rate: '24000/1000',
    width: 160,
    height: 90
  }]
}));
`,
            directory: tempDirectory,
            name: 'ffprobe'
        });

        const metadata = await probeMedia({
            ffprobePath,
            filePath: videoPath
        });

        expect(metadata).toEqual({
            codecName: 'h264',
            durationMs: 1000,
            filePath: videoPath,
            fps: 24,
            height: 90,
            width: 160
        });
    });

    it('extracts keyframe image files into the output directory', async () => {
        const ffmpegPath = await createExecutableScript({
            content: `#!/usr/bin/env node
const { mkdirSync, writeFileSync } = require('node:fs');
const path = require('node:path');
const framesIndex = process.argv.indexOf('-frames:v');
const frameCount = Number(process.argv[framesIndex + 1]);
const pattern = process.argv.at(-1);
mkdirSync(path.dirname(pattern), { recursive: true });
for (let index = 1; index <= frameCount; index += 1) {
  const fileName = pattern.replace('%03d', String(index).padStart(3, '0'));
  writeFileSync(fileName, 'image-' + index);
}
`,
            directory: tempDirectory,
            name: 'ffmpeg'
        });
        const outputDirectory = path.join(tempDirectory, 'keyframes');

        const keyframes = await extractKeyframes({
            ffmpegPath,
            filePath: videoPath,
            frameCount: 2,
            outputDirectory
        });

        expect(keyframes).toEqual([
            {
                index: 1,
                path: path.join(outputDirectory, 'keyframe-001.jpg'),
                timestampMs: 0
            },
            {
                index: 2,
                path: path.join(outputDirectory, 'keyframe-002.jpg'),
                timestampMs: 0
            }
        ]);

        const imageStats = await stat(keyframes[0]!.path);
        expect(imageStats.size).toBeGreaterThan(0);

        const generatedFiles = await readdir(outputDirectory);
        expect(generatedFiles).toEqual([
            'keyframe-001.jpg',
            'keyframe-002.jpg'
        ]);
    });

    it('rejects invalid keyframe counts before calling ffmpeg', async () => {
        await expect(
            extractKeyframes({
                ffmpegPath: 'missing-ffmpeg',
                filePath: videoPath,
                frameCount: 0,
                outputDirectory: path.join(tempDirectory, 'keyframes')
            })
        ).rejects.toThrow('frameCount must be greater than 0');
    });
});
