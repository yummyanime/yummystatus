import { zValidator } from "@hono/zod-validator";
import { lighthouseHourlyLogs, lighthouseLogs } from "@yummystatus/db";
import { db } from "@yummystatus/db/client";
import { and, asc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { resolveTimeRange, timeRangeSchema } from "../services/timeRange.ts";

const querySchema = timeRangeSchema.extend({
    domain: z.string().optional(),
    strategy: z.string().optional(),
});

export const lighthouseLogsRoute = new Hono().get(
    "/lighthouse-logs",
    zValidator("query", querySchema),
    async (c) => {
        const query = c.req.valid("query");
        const { hourly, filter } = resolveTimeRange(query);
        const t = hourly ? lighthouseHourlyLogs : lighthouseLogs;

        const rows = await db
            .select({
                domain: t.domain,
                url_path: t.urlPath,
                strategy: t.strategy,
                perf_score: t.perfScore,
                ttfb: t.ttfb,
                lcp: t.lcp,
                fcp: t.fcp,
                speed_index: t.speedIndex,
                tbt: t.tbt,
                tti: t.tti,
                cls: t.cls,
                load_time: t.loadTime,
                field_lcp: t.fieldLcp,
                field_inp: t.fieldInp,
                field_cls: t.fieldCls,
                field_fcp: t.fieldFcp,
                field_ttfb: t.fieldTtfb,
                diagnostics: t.diagnostics,
                created_at: t.createdAt,
            })
            .from(t)
            .where(
                and(
                    filter(t.createdAt),
                    query.domain ? eq(t.domain, query.domain) : undefined,
                    query.strategy ? eq(t.strategy, query.strategy) : undefined
                )
            )
            .orderBy(asc(t.createdAt));

        return c.json(rows);
    }
);
