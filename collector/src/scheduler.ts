const HOUR_MS = 60 * 60 * 1000;
const HOUR_SETTLE_MS = 5 * 60 * 1000;

const timers = new Set<ReturnType<typeof setTimeout>>();
let stopped = false;

export function every(
    name: string,
    intervalMs: number,
    job: () => Promise<void>,
    runImmediately = true
): void {
    const run = guarded(name, job);
    if (runImmediately) run();
    timers.add(setInterval(run, intervalMs));
}

export function everyClockHour(name: string, job: () => Promise<void>): void {
    const run = guarded(name, job);
    run();
    const arm = (): void => {
        const timer = setTimeout(
            () => {
                timers.delete(timer);
                run();
                arm();
            },
            HOUR_MS - (Date.now() % HOUR_MS) + HOUR_SETTLE_MS
        );
        timers.add(timer);
    };
    arm();
}

export function loop(
    name: string,
    pauseMs: number,
    job: () => Promise<void>
): void {
    const tick = async (): Promise<void> => {
        if (stopped) return;
        await job().catch((err) => console.error(`${name} failed:`, err));
        if (stopped) return;
        const timer = setTimeout(() => {
            timers.delete(timer);
            tick();
        }, pauseMs);
        timers.add(timer);
    };
    tick();
}

export function stopAll(): void {
    stopped = true;
    for (const timer of timers) clearTimeout(timer);
    timers.clear();
}

export function lastCompletedHour(): Date {
    return new Date(Math.floor(Date.now() / HOUR_MS) * HOUR_MS - HOUR_MS);
}

function guarded(name: string, job: () => Promise<void>): () => void {
    let running = false;
    return () => {
        if (stopped) return;
        if (running) {
            console.log(
                `[SCHEDULER] Skipping ${name}: previous run is still in progress`
            );
            return;
        }
        running = true;
        job()
            .catch((err) => console.error(`${name} failed:`, err))
            .finally(() => {
                running = false;
            });
    };
}
