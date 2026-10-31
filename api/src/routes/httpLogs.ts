import { zValidator } from "@hono/zod-validator";
import { httpHourlyLogs, httpLogs } from "@yummystatus/db";
import { db } from "@yummystatus/db/client";
import { and, asc, eq, isNotNull } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { resolveTimeRange, timeRangeSchema } from "../services/timeRange.ts";

const querySchema = timeRangeSchema.extend({
    domain: z.string().optional(),
});

export const httpLogsRoute = new Hono().get(
    "/http-logs",
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
                status_code: t.statusCode,
                created_at: t.createdAt,
                total_time: t.totalTime,
                download_time: t.downloadTime,
                first_byte_time: t.firstByteTime,
                dns_time: t.dnsTime,
                tls_time: t.tlsTime,
                tcp_time: t.tcpTime,
                server_timing: t.serverTiming,
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

        if (!query.domain) return c.json(rows);

        const logsByCountryCity: Record<
            string,
            Record<
                string,
                Omit<(typeof rows)[number], "domain" | "country" | "city">[]
            >
        > = {};
        for (const { domain, country, city, ...logData } of rows) {
            const byCity = logsByCountryCity[String(country)] ?? {};
            logsByCountryCity[String(country)] = byCity;
            const cityLogs = byCity[String(city)] ?? [];
            byCity[String(city)] = cityLogs;
            cityLogs.push(logData);
        }
        return c.json(logsByCountryCity);
    }
);
