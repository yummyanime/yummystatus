import { zValidator } from "@hono/zod-validator";
import { httpLogs } from "@yummystatus/db";
import { db } from "@yummystatus/db/client";
import { and, asc, gte, inArray, isNotNull, sql } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { DOMAINS } from "../../../domains.ts";
import {
    type BucketStatus,
    type StatusRow,
    toBuckets,
} from "../services/health.ts";

const PROBE_ERROR_CODE = 900;
const SUMMARY_COUNTRIES = ["RU", "UA", "BY"];

const querySchema = z.object({
    count: z.coerce
        .number()
        .catch(24)
        .transform((value) =>
            Math.min(Math.max(Math.trunc(value) || 24, 1), 500)
        ),
});

const UP_STATUSES: ReadonlySet<BucketStatus> = new Set([
    "UP",
    "DEGRADED_LOW",
    "DEGRADED_MEDIUM",
    "DEGRADED_HIGH",
    "CAPTCHA",
]);

export const statusSummaryRoute = new Hono().get(
    "/status-summary",
    zValidator("query", querySchema),
    async (c) => {
        const { count } = c.req.valid("query");

        const rows = await db
            .select({
                domain: httpLogs.domain,
                country: httpLogs.country,
                city: httpLogs.city,
                statusCode: httpLogs.statusCode,
                totalTime: httpLogs.totalTime,
                createdAt: httpLogs.createdAt,
            })
            .from(httpLogs)
            .where(
                and(
                    gte(
                        httpLogs.createdAt,
                        sql`now() - ${"24 hour"}::interval`
                    ),
                    isNotNull(httpLogs.city),
                    inArray(httpLogs.country, SUMMARY_COUNTRIES)
                )
            )
            .orderBy(asc(httpLogs.createdAt));

        const domains = DOMAINS.flatMap(({ name }) => {
            const logs = rows.filter((row) => row.domain === name);
            return logs.length > 0 ? [summarize(name, logs, count)] : [];
        });

        return c.json({ updatedAt: new Date().toISOString(), domains });
    }
);

function summarize(domain: string, logs: StatusRow[], count: number) {
    const statuses = toBuckets(logs).map((bucket) => bucket.status);

    const considered = statuses.filter((status) => status !== "PROBE_ERROR");
    const upCount = considered.filter((status) =>
        UP_STATUSES.has(status)
    ).length;

    const validTimes = logs.flatMap((log) =>
        Number(log.statusCode) < PROBE_ERROR_CODE && log.totalTime !== null
            ? [log.totalTime]
            : []
    );

    return {
        domain,
        current: statuses[statuses.length - 1] ?? "PROBE_ERROR",
        heartbeats: statuses.slice(-count),
        ...(considered.length > 0 && {
            uptime24h: upCount / considered.length,
        }),
        ...(validTimes.length > 0 && {
            avgResponseMs: Math.round(
                validTimes.reduce((a, b) => a + b, 0) / validTimes.length
            ),
        }),
    };
}
