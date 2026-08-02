export const advancePlaybackTime = ({
    currentTimeMs,
    durationMs,
    elapsedMs
}: {
    currentTimeMs: number;
    durationMs: number;
    elapsedMs: number;
}) => Math.min(currentTimeMs + Math.max(0, elapsedMs), durationMs);

export const createAnimationClock = (
    onFrame: (elapsedMs: number) => boolean
) => {
    let frameId = 0;
    let isStopped = false;
    let lastTimeMs = window.performance.now();

    const tick = (timeMs: number) => {
        if (isStopped) return;

        const elapsedMs = timeMs - lastTimeMs;
        lastTimeMs = timeMs;
        isStopped = onFrame(elapsedMs);

        if (isStopped) return;

        frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);

    return () => {
        isStopped = true;
        window.cancelAnimationFrame(frameId);
    };
};
