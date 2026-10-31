import { DOMAINS, IGNORED_ERROR_CODES } from "../../../domains.ts";

const SLOW_RESPONSE_MS = 1500;

const OK_CODES: ReadonlySet<number> = new Set([200, 202]);
const CAPTCHA_CODES: ReadonlySet<number> = new Set([202, 307]);

export type HealthLevel = "stable" | "warning" | "critical";

export type BucketStatus =
    | "UP"
    | "DEGRADED_LOW"
    | "DEGRADED_MEDIUM"
    | "DEGRADED_HIGH"
    | "DOWN"
    | "CAPTCHA"
    | "PROBE_ERROR";

export interface StatusRow {
    domain: string | null;
    country: string | null;
    city: string | null;
    statusCode: number | null;
    totalTime: number | null;
    createdAt: Date | null;
}

export interface Bucket {
    time: string;
    status: BucketStatus;
    rows: StatusRow[];
}

export interface HealthBucket {
    time: string;
    status: BucketStatus;
    totalTimeAvg: number;
    problems: {
        country: string | null;
        city: string | null;
        statusCode: number | null;
        totalTime: number | null;
    }[];
}

export interface DomainHealthReport {
    domain: string;
    label: string;
    health: HealthLevel;
    measurements: number;
    failures: number;
    failureCodes: Record<string, number>;
    buckets: HealthBucket[];
}

export interface HealthReport {
    updatedAt: string;
    health: HealthLevel;
    statusCounts: Record<BucketStatus, number>;
    measurements: number;
    failures: number;
    countries: string[];
    failuresByCountry: Record<string, number>;
    domains: DomainHealthReport[];
}

export function toBuckets(rows: StatusRow[]): Bucket[] {
    const byMinute = new Map<string, StatusRow[]>();
    for (const row of rows) {
        const key = row.createdAt?.toISOString().substring(0, 16) ?? "";
        const bucket = byMinute.get(key);
        if (bucket) bucket.push(row);
        else byMinute.set(key, [row]);
    }
    return [...byMinute.values()].map((bucketRows) => ({
        time: bucketRows[0]?.createdAt?.toISOString() ?? "",
        status: getBucketStatus(bucketRows),
        rows: bucketRows,
    }));
}

export function buildHealthReport(rows: StatusRow[]): HealthReport {
    const byDomain = new Map<string, StatusRow[]>();
    for (const row of rows) {
        const domain = row.domain ?? "unknown";
        const domainRows = byDomain.get(domain);
        if (domainRows) domainRows.push(row);
        else byDomain.set(domain, [row]);
    }

    const statusCounts: Record<BucketStatus, number> = {
        UP: 0,
        DEGRADED_LOW: 0,
        DEGRADED_MEDIUM: 0,
        DEGRADED_HIGH: 0,
        DOWN: 0,
        CAPTCHA: 0,
        PROBE_ERROR: 0,
    };
    const domains: DomainHealthReport[] = [];
    for (const [domain, domainRows] of byDomain) {
        const buckets = toBuckets(domainRows);
        for (const bucket of buckets) statusCounts[bucket.status] += 1;
        domains.push(buildDomainReport(domain, domainRows, buckets));
    }

    const relevant = rows.filter(isRelevant);
    const failed = relevant.filter(isFailure);
    const failuresByCountry: Record<string, number> = {};
    for (const row of failed) {
        if (row.country) {
            failuresByCountry[row.country] =
                (failuresByCountry[row.country] ?? 0) + 1;
        }
    }

    return {
        updatedAt: new Date().toISOString(),
        health: worstHealth(domains.map((entry) => entry.health)),
        statusCounts,
        measurements: relevant.length,
        failures: failed.length,
        countries: [...new Set(relevant.flatMap((row) => row.country ?? []))],
        failuresByCountry,
        domains,
    };
}

function getDomainHealth(rows: StatusRow[]): HealthLevel {
    const relevant = rows.filter(isRelevant);
    if (relevant.length === 0) return "stable";

    const errorRate =
        (relevant.filter(isFailure).length / relevant.length) * 100;
    const last = relevant.slice(-3);
    const lastThreeFailed = last.length >= 3 && last.every(isFailure);
    const lastTwoFailed = last.length >= 2 && last.slice(-2).every(isFailure);

    if (errorRate >= 20 || lastThreeFailed) return "critical";
    if (errorRate >= 5 || lastTwoFailed) return "warning";
    return "stable";
}

function buildDomainReport(
    domain: string,
    rows: StatusRow[],
    buckets: Bucket[]
): DomainHealthReport {
    const relevant = rows.filter(isRelevant);
    const failed = relevant.filter(isFailure);
    const failureCodes: Record<string, number> = {};
    for (const row of failed) {
        const code = String(row.statusCode ?? 0);
        failureCodes[code] = (failureCodes[code] ?? 0) + 1;
    }

    return {
        domain,
        label: DOMAINS.find((entry) => entry.name === domain)?.label ?? domain,
        health: getDomainHealth(rows),
        measurements: relevant.length,
        failures: failed.length,
        failureCodes,
        buckets: buckets.map((bucket) => ({
            time: bucket.time,
            status: bucket.status,
            totalTimeAvg:
                bucket.rows.reduce(
                    (sum, row) => sum + (row.totalTime ?? 0),
                    0
                ) / bucket.rows.length,
            problems: bucket.rows
                .filter((row) => isRelevant(row) && isProblematic(row))
                .map(({ country, city, statusCode, totalTime }) => ({
                    country,
                    city,
                    statusCode,
                    totalTime,
                })),
        })),
    };
}

function getBucketStatus(rows: StatusRow[]): BucketStatus {
    const relevant = rows.filter(isRelevant);
    if (relevant.length === 0) return "PROBE_ERROR";
    if (relevant.some((row) => CAPTCHA_CODES.has(Number(row.statusCode)))) {
        return "CAPTCHA";
    }

    const problematic = relevant.filter(isProblematic).length;
    if (problematic === relevant.length) return "DOWN";
    if (problematic >= 3) return "DEGRADED_HIGH";
    if (problematic === 2) return "DEGRADED_MEDIUM";
    if (problematic === 1) return "DEGRADED_LOW";
    return "UP";
}

function worstHealth(levels: HealthLevel[]): HealthLevel {
    if (levels.includes("critical")) return "critical";
    return levels.includes("warning") ? "warning" : "stable";
}

function isRelevant(row: StatusRow): boolean {
    return !IGNORED_ERROR_CODES.has(Number(row.statusCode));
}

function isFailure(row: StatusRow): boolean {
    return (
        !OK_CODES.has(Number(row.statusCode)) ||
        (row.totalTime ?? 0) > SLOW_RESPONSE_MS
    );
}

function isProblematic(row: StatusRow): boolean {
    return (
        row.statusCode !== 200 ||
        row.totalTime === null ||
        row.totalTime > SLOW_RESPONSE_MS
    );
}
