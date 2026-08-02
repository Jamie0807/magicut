export const calculateTimelinePointerTimeMs = ({
    clientX,
    contentWidthPx,
    durationMs,
    scrollContainerLeft,
    scrollLeft
}: {
    clientX: number;
    contentWidthPx: number;
    durationMs: number;
    scrollContainerLeft: number;
    scrollLeft: number;
}) => {
    if (contentWidthPx <= 0 || durationMs <= 0) return 0;

    const pointerX = clientX - scrollContainerLeft + scrollLeft;
    const clampedPointerX = Math.min(Math.max(pointerX, 0), contentWidthPx);

    return Math.round((clampedPointerX / contentWidthPx) * durationMs);
};

export const formatTimelinePointerTime = (timeMs: number) => {
    const totalSeconds = Math.floor(timeMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(
        2,
        '0'
    )}`;
};
