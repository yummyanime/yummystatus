export interface LighthouseLog {
    created_at: string;
    domain?: string;
    url_path?: string;
    strategy?: string;
    perf_score?: number | null;
    ttfb?: number | null;
    lcp?: number | null;
    fcp?: number | null;
    speed_index?: number | null;
    tbt?: number | null;
    tti?: number | null;
    cls?: number | null;
    load_time?: number | null;
    field_lcp?: number | null;
    field_inp?: number | null;
    field_cls?: number | null;
    field_fcp?: number | null;
    field_ttfb?: number | null;
    diagnostics?: Record<string, number> | null;
}

export type LighthouseMetricKey =
    | "perf_score"
    | "lcp"
    | "ttfb"
    | "cls"
    | "field_inp"
    | "tbt"
    | "fcp"
    | "speed_index"
    | "tti"
    | "load_time";

export type Rating = "good" | "ni" | "poor" | "none";

export interface LighthouseMetric {
    key: LighthouseMetricKey;
    label: string;
    fieldKey?: keyof LighthouseLog;
    unit: "ms" | "score" | "unitless";
    good: number;
    poor: number;
    higherIsBetter?: boolean;
    fieldOnly?: boolean;
}

export const LIGHTHOUSE_METRICS: LighthouseMetric[] = [
    {
        key: "lcp",
        label: "LCP",
        fieldKey: "field_lcp",
        unit: "ms",
        good: 2500,
        poor: 4000,
    },
    {
        key: "ttfb",
        label: "TTFB",
        fieldKey: "field_ttfb",
        unit: "ms",
        good: 800,
        poor: 1800,
    },
    {
        key: "cls",
        label: "CLS",
        fieldKey: "field_cls",
        unit: "unitless",
        good: 0.1,
        poor: 0.25,
    },
    { key: "field_inp", label: "INP", unit: "ms", good: 200, poor: 500, fieldOnly: true },
    { key: "tbt", label: "TBT", unit: "ms", good: 200, poor: 600 },
    {
        key: "fcp",
        label: "FCP",
        fieldKey: "field_fcp",
        unit: "ms",
        good: 1800,
        poor: 3000,
    },
    {
        key: "speed_index",
        label: "Speed Index",
        unit: "ms",
        good: 3400,
        poor: 5800,
    },
    { key: "tti", label: "TTI", unit: "ms", good: 3800, poor: 7300 },
    { key: "load_time", label: "Load", unit: "ms", good: 3000, poor: 6000 },
    {
        key: "perf_score",
        label: "Score",
        unit: "score",
        good: 90,
        poor: 50,
        higherIsBetter: true,
    },
];

export const getMetric = (key: LighthouseMetricKey): LighthouseMetric =>
    LIGHTHOUSE_METRICS.find((m) => m.key === key) ?? LIGHTHOUSE_METRICS[0];

export const rate = (
    metric: LighthouseMetric,
    value: number | null | undefined
): Rating => {
    if (value === null || value === undefined || !Number.isFinite(value)) {
        return "none";
    }
    if (metric.higherIsBetter) {
        if (value >= metric.good) return "good";
        if (value < metric.poor) return "poor";
        return "ni";
    }
    if (value <= metric.good) return "good";
    if (value > metric.poor) return "poor";
    return "ni";
};

export const RATING_COLORS: Record<Rating, string> = {
    good: "#0cce6b",
    ni: "#ffa400",
    poor: "#ff4e42",
    none: "#9aa0a6",
};

export const formatMetric = (
    metric: LighthouseMetric,
    value: number | null | undefined
): string => {
    if (value === null || value === undefined || !Number.isFinite(value)) {
        return "—";
    }
    if (metric.unit === "score") return String(Math.round(value));
    if (metric.unit === "unitless") return value.toFixed(2);
    if (value >= 1000) return `${(value / 1000).toFixed(2)} с`;
    return `${Math.round(value)} мс`;
};

export const metricUnitLabel = (metric: LighthouseMetric): string => {
    if (metric.unit === "score") return "баллов";
    if (metric.unit === "unitless") return "";
    return "мс";
};

export const SUMMARY_KEYS: LighthouseMetricKey[] = [
    "lcp",
    "ttfb",
    "cls",
    "field_inp",
    "tbt",
    "fcp",
    "load_time",
    "perf_score",
];

export const avgOf = (
    logs: LighthouseLog[],
    key: keyof LighthouseLog
): number | null => {
    let sum = 0;
    let count = 0;
    for (const log of logs) {
        const v = log[key] as number | null | undefined;
        if (v !== null && v !== undefined && Number.isFinite(v)) {
            sum += v;
            count += 1;
        }
    }
    return count > 0 ? sum / count : null;
};

const AVERAGED_LOG_KEYS: (keyof LighthouseLog)[] = LIGHTHOUSE_METRICS.flatMap(
    (m) => (m.fieldKey ? [m.key, m.fieldKey] : [m.key])
);

export const groupLogs = <K,>(
    logs: LighthouseLog[],
    keyOf: (log: LighthouseLog) => K
): Map<K, LighthouseLog[]> => {
    const groups = new Map<K, LighthouseLog[]>();
    for (const log of logs) {
        const key = keyOf(log);
        const bucket = groups.get(key);
        if (bucket) bucket.push(log);
        else groups.set(key, [log]);
    }
    return groups;
};

export const averageByHour = (logs: LighthouseLog[]): LighthouseLog[] => {
    const buckets = groupLogs(logs, (l) =>
        Math.floor(Date.parse(l.created_at) / 3_600_000)
    );
    return [...buckets.entries()]
        .sort(([a], [b]) => a - b)
        .map(
            ([hour, bucketLogs]) =>
                ({
                    created_at: new Date(hour * 3_600_000).toISOString(),
                    ...Object.fromEntries(
                        AVERAGED_LOG_KEYS.map((key) => [key, avgOf(bucketLogs, key)])
                    ),
                }) as LighthouseLog
        );
};
