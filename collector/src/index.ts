import { closeDb } from "@yummystatus/db/client";
import { locationGroups } from "../../domains.ts";
import { cleanupOldLogs } from "./cleanup.ts";
import { aggregateHourlyHttp, httpCheckAndSave } from "./http.ts";
import {
    aggregateHourlyLighthouse,
    lighthouseCheckAndSave,
} from "./lighthouse.ts";
import { aggregateHourlyPing, pingCheckAndSave } from "./ping.ts";
import {
    every,
    everyClockHour,
    lastCompletedHour,
    loop,
    stopAll,
} from "./scheduler.ts";

const MINUTE_MS = 60 * 1000;

const server = Bun.serve({
    port: 8080,
    fetch: (req) =>
        new URL(req.url).pathname === "/livez"
            ? new Response("ok\n")
            : new Response("not found\n", { status: 404 }),
});
console.log(`Collector health endpoint listening on :${server.port}`);

every("http-2min", 2 * MINUTE_MS, () =>
    httpCheckAndSave(locationGroups["2min"], 2 * MINUTE_MS)
);
every(
    "http-6min",
    6 * MINUTE_MS,
    () => httpCheckAndSave(locationGroups["6min"], 6 * MINUTE_MS),
    false
);
every("ping", 2 * MINUTE_MS, () => pingCheckAndSave(2 * MINUTE_MS));
loop("lighthouse", MINUTE_MS, lighthouseCheckAndSave);
everyClockHour("aggregate-http", () =>
    aggregateHourlyHttp(lastCompletedHour())
);
everyClockHour("aggregate-ping", () =>
    aggregateHourlyPing(lastCompletedHour())
);
everyClockHour("aggregate-lighthouse", () =>
    aggregateHourlyLighthouse(lastCompletedHour())
);
every("cleanup", 60 * MINUTE_MS, cleanupOldLogs);

for (const signal of ["SIGTERM", "SIGINT"] as const) {
    process.on(signal, () => shutdown(signal));
}

async function shutdown(signal: string): Promise<void> {
    console.log(`Received ${signal}, shutting down`);
    stopAll();
    await server.stop();
    await closeDb();
    process.exit(0);
}
