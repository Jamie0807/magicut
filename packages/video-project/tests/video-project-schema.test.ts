import { describe, expect, it } from 'vitest';

import {
    assertVideoProject,
    sampleVideoProject,
    validateVideoProject,
    type VideoProject
} from '../src';

describe('VideoProject schema', () => {
    it('accepts a valid editable video project fixture', () => {
        const result = validateVideoProject(sampleVideoProject);

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.schemaVersion).toBe('1.0.0');
            expect(result.data.canvas.width).toBe(1920);
            expect(result.data.tracks.map((track) => track.kind)).toEqual([
                'video',
                'voice',
                'subtitle',
                'music'
            ]);
        }
    });

    it('rejects clips whose end time is not after the start time', () => {
        const invalidProject: VideoProject =
            structuredClone(sampleVideoProject);
        const firstClip = invalidProject.tracks[0]?.clips[0];

        if (!firstClip) {
            throw new Error('sample fixture must include a video clip');
        }

        firstClip.endMs = firstClip.startMs;

        const result = validateVideoProject(invalidProject);

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.issues.join('\n')).toContain(
                'Clip endMs must be greater than startMs'
            );
        }
    });

    it('rejects clip asset references that do not exist in project assets', () => {
        const invalidProject: VideoProject =
            structuredClone(sampleVideoProject);
        const firstClip = invalidProject.tracks[0]?.clips[0];

        if (!firstClip || firstClip.kind !== 'video') {
            throw new Error('sample fixture must include a video clip');
        }

        firstClip.assetId = 'video_asset_missing';

        const result = validateVideoProject(invalidProject);

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.issues.join('\n')).toContain(
                'Video clip references missing asset'
            );
        }
    });

    it('rejects a voice clip inside the video track', () => {
        const invalidProject: VideoProject =
            structuredClone(sampleVideoProject);
        const voiceClip = invalidProject.tracks[1]?.clips[0];

        if (!voiceClip || voiceClip.kind !== 'voice') {
            throw new Error('sample fixture must include a voice clip');
        }

        invalidProject.tracks[0]?.clips.push(voiceClip);

        expect(() => assertVideoProject(invalidProject)).toThrow(
            'Track video contains invalid clip kind voice'
        );
    });
});
