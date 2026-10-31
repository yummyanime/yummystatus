import { zValidator } from "@hono/zod-validator";
import { httpHourlyLogs, httpLogs } from "@yummystatus/db";
import { db } from "@yummystatus/db/client";
import { and, asc, eq, inArray, isNotNull } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { buildHealthReport } from "../services/health.ts";
import { resolveTimeRange, timeRangeSchema } from "../services/timeRange.ts";

const querySchema = timeRangeSchema.extend({
    domain: z.string().optional(),
    countries: z
        .string()
        .optional()
        .transform((value) => (value ? value.split(",") : undefined)),
});

export const healthRoute = new Hono().get(
    "/health",
    zValidator("query", querySchema),
    async (c) => {
        const query = c.req.valid("query");
        const { hourly, filter } = resolveTimeRange(query);
        const t = hourly ? httpHourlyLogs : httpLogs;

        const rows = await db
            .select({
                domain: t.domain,
                country: t.country,
                city: t.city,
                statusCode: t.statusCode,
                totalTime: t.totalTime,
                createdAt: t.createdAt,
            })
            .from(t)
            .where(
                and(
                    filter(t.createdAt),
                    isNotNull(t.city),
                    query.domain ? eq(t.domain, query.domain) : undefined,
                    query.countries
                        ? inArray(t.country, query.countries)
                        : undefined
                )
            )
            .orderBy(asc(t.createdAt));

        return c.json(buildHealthReport(rows));
    }
);
