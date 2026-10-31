import { zValidator } from "@hono/zod-validator";
import { pingHourlyLogs, pingLogs } from "@yummystatus/db";
import { db } from "@yummystatus/db/client";
import { and, asc, eq, isNotNull } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { resolveTimeRange, timeRangeSchema } from "../services/timeRange.ts";

const querySchema = timeRangeSchema.extend({
    domain: z.string().optional(),
});

export const pingLogsRoute = new Hono().get(
    "/ping-logs",
    zValidator("query", querySchema),
    async (c) => {
        const query = c.req.valid("query");
        const { hourly, filter } = resolveTimeRange(query);
        const t = hourly ? pingHourlyLogs : pingLogs;

        const rows = await db
            .select({
                domain: t.domain,
                country: t.country,
                city: t.city,
                rtt_avg: t.rttAvg,
                rtt_min: t.rttMin,
                rtt_max: t.rttMax,
                packet_loss: t.packetLoss,
                created_at: t.createdAt,
            })
            .from(t)
            .where(
                and(
                    filter(t.createdAt),
                    isNotNull(t.city),
                    query.domain ? eq(t.domain, query.domain) : undefined
                )
            )
            .orderBy(asc(t.createdAt));

        return c.json(rows);
    }
);
