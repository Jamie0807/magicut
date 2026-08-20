import type { PreviewSegment } from '../types/editor-screen';

export const getPreviewSegmentLocalTimeMs = ({
    currentTimeMs,
    segment
}: {
    currentTimeMs: number;
    segment?: PreviewSegment;
}) => {
    if (!segment) return currentTimeMs;

    const sourceDurationMs = Math.max(
        1,
        segment.sourceEndMs - segment.sourceStartMs
    );
    const segmentLocalTimeMs = Math.max(0, currentTimeMs - segment.startMs);
    const localTimeMs =
        segment.sourceStartMs + (segmentLocalTimeMs % sourceDurationMs);

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

    void currentTimeMs;

    return false;
};
