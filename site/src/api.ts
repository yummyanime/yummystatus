import type { AppType } from "@yummystatus/api";
import { hc, type InferResponseType } from "hono/client";

export const api = hc<AppType>("/").api;

type WithCreatedAt<T extends { created_at: string | null }> = Omit<
    T,
    "created_at"
> & { created_at: string };

type HttpLogsResponse = InferResponseType<(typeof api)["http-logs"]["$get"]>;
type HttpRow = Extract<HttpLogsResponse, unknown[]>[number];

export type HttpLog = WithCreatedAt<HttpRow> & { unreliable?: boolean };
export type PingLog = WithCreatedAt<
    InferResponseType<(typeof api)["ping-logs"]["$get"]>[number]
>;
export type LighthouseLog = WithCreatedAt<
    InferResponseType<(typeof api)["lighthouse-logs"]["$get"]>[number]
>;
export type LocationGroups = InferResponseType<typeof api.locations.$get>;
export type OutageData = InferResponseType<
    (typeof api)["outage-reports"]["$get"]
>;
export type HealthReport = InferResponseType<typeof api.health.$get>;
export type DomainHealthReport = HealthReport["domains"][number];
export type HealthLevel = HealthReport["health"];
export type BucketStatus = DomainHealthReport["buckets"][number]["status"];

type TimeRange = NonNullable<
    Parameters<typeof api.health.$get>[0]
>["query"]["timeRange"];

export const timeQuery = (
    timeRange: string,
    dateRange: { from: string; to: string } | null
) => ({
    timeRange: timeRange as TimeRange,
    ...(dateRange && { dateFrom: dateRange.from, dateTo: dateRange.to }),
});

export const withCreatedAt = <T extends { created_at: string | null }>(
    rows: T[]
) =>
    rows.flatMap((row) =>
        row.created_at === null ? [] : [{ ...row, created_at: row.created_at }]
    );
