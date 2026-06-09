// Сырая запись Lighthouse-замера, как её отдаёт /lighthouse-logs.
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
    | "tbt"
    | "fcp"
    | "speed_index"
    | "tti";

export type Rating = "good" | "ni" | "poor" | "none";

export interface LighthouseMetric {
    key: LighthouseMetricKey;
    label: string;
    // Поле CrUX p75 для второй (пунктирной) линии на графике, если применимо.
    fieldKey?: keyof LighthouseLog;
    unit: "ms" | "score" | "unitless";
    // Пороги в нативных единицах метрики (ms / безразмерные / баллы).
    good: number;
    poor: number;
    // У perf_score «больше — лучше», у остальных — наоборот.
    higherIsBetter?: boolean;
}

export const LIGHTHOUSE_METRICS: LighthouseMetric[] = [
    { key: "lcp", label: "LCP", fieldKey: "field_lcp", unit: "ms", good: 2500, poor: 4000 },
    { key: "ttfb", label: "TTFB", fieldKey: "field_ttfb", unit: "ms", good: 800, poor: 1800 },
    { key: "cls", label: "CLS", fieldKey: "field_cls", unit: "unitless", good: 0.1, poor: 0.25 },
    { key: "tbt", label: "TBT", unit: "ms", good: 200, poor: 600 },
    { key: "fcp", label: "FCP", fieldKey: "field_fcp", unit: "ms", good: 1800, poor: 3000 },
    { key: "speed_index", label: "Speed Index", unit: "ms", good: 3400, poor: 5800 },
    { key: "tti", label: "TTI", unit: "ms", good: 3800, poor: 7300 },
    { key: "perf_score", label: "Score", unit: "score", good: 90, poor: 50, higherIsBetter: true },
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

// Форматирование значения метрики для подписи: мс крупнее 1с → секунды.
export const formatMetric = (
    metric: LighthouseMetric,
    value: number | null | undefined
): string => {
    if (value === null || value === undefined || !Number.isFinite(value)) {
        return "—";
    }
    if (metric.unit === "score") return String(Math.round(value));
    if (metric.unit === "unitless") return value.toFixed(2);
    // ms
    if (value >= 1000) return `${(value / 1000).toFixed(2)} с`;
    return `${Math.round(value)} мс`;
};

export const metricUnitLabel = (metric: LighthouseMetric): string => {
    if (metric.unit === "score") return "баллов";
    if (metric.unit === "unitless") return "";
    return "мс";
};
