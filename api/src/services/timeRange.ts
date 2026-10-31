import { and, gte, lte, type SQL, sql } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { z } from "zod";

const HOURLY_THRESHOLD_MS = 48 * 60 * 60 * 1000;

const TIME_RANGE_CONFIG = {
    month: { interval: "30 day", spanMs: 30 * 24 * 60 * 60 * 1000 },
    week: { interval: "7 day", spanMs: 7 * 24 * 60 * 60 * 1000 },
    day: { interval: "1 day", spanMs: 24 * 60 * 60 * 1000 },
    "3hour": { interval: "3 hour", spanMs: 3 * 60 * 60 * 1000 },
} as const;

export const timeRangeSchema = z.object({
    timeRange: z.enum(["month", "week", "day", "3hour"]).catch("3hour"),
    dateFrom: z.coerce.date().optional().catch(undefined),
    dateTo: z.coerce.date().optional().catch(undefined),
});

export function resolveTimeRange({
    timeRange,
    dateFrom,
    dateTo,
}: z.infer<typeof timeRangeSchema>): {
    hourly: boolean;
    filter: (createdAt: AnyPgColumn) => SQL | undefined;
} {
    if (dateFrom && dateTo && dateFrom < dateTo) {
        return {
            hourly:
                dateTo.getTime() - dateFrom.getTime() >= HOURLY_THRESHOLD_MS,
            filter: (createdAt) =>
                and(gte(createdAt, dateFrom), lte(createdAt, dateTo)),
        };
    }

    const { interval, spanMs } = TIME_RANGE_CONFIG[timeRange];
    return {
        hourly: spanMs >= HOURLY_THRESHOLD_MS,
        filter: (createdAt) =>
            gte(createdAt, sql`now() - ${interval}::interval`),
    };
}
