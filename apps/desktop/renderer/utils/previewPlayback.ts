import type { PreviewSegment } from '../types/editor-screen';

export const getPreviewSegmentLocalTimeMs = ({
    currentTimeMs,
    segment
}: {
    currentTimeMs: number;
    segment?: PreviewSegment;
}) => {
    if (!segment) return currentTimeMs;

    const localTimeMs =
        segment.sourceStartMs + Math.max(0, currentTimeMs - segment.startMs);

    return Math.min(
        Math.max(localTimeMs, segment.sourceStartMs),
        segment.sourceEndMs
    );
};

export const isPreviewSegmentSourceExhausted = ({
    currentTimeMs,
    segment
}: {
    currentTimeMs: number;
    segment?: PreviewSegment;
}) => {
    if (!segment) return false;

    const sourceDurationMs = Math.max(
        0,
        segment.sourceEndMs - segment.sourceStartMs
    );

    return currentTimeMs - segment.startMs >= sourceDurationMs;
};
