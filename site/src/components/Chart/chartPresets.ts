import { getCityLabel } from "../../data/constants.ts";
import { t, type Dictionary } from "../../i18n.ts";
import type { HttpLog } from "../../api.ts";
import type {
    ChartLog,
    ChartProps,
    ChartTooltipCell,
    ChartTooltipContext,
} from "./Chart.tsx";

const msCell = (
    id: string,
    label: string,
    value: number | null | undefined,
    digits = 0
): ChartTooltipCell => ({
    id,
    label,
    value:
        value === null || value === undefined || !Number.isFinite(Number(value))
            ? "N/A"
            : Number(value).toFixed(digits),
});

const avgOf = <TLog>(
    logs: TLog[],
    getField: (log: TLog) => number | null | undefined
): number | null => {
    let sum = 0;
    let count = 0;
    for (const log of logs) {
        const v = getField(log);
        if (v !== null && v !== undefined && Number.isFinite(Number(v))) {
            sum += Number(v);
            count += 1;
        }
    }
    return count > 0 ? sum / count : null;
};

export interface PingLog extends ChartLog {
    rtt_avg?: number | null;
    rtt_min?: number | null;
    rtt_max?: number | null;
    packet_loss?: number | null;
    total_time?: number | null;
}

type ChartConfig<TLog extends ChartLog> = Pick<
    ChartProps<TLog>,
    "getValue" | "getLabel" | "isUnreliable" | "renderTooltip"
>;

const serverTimingKeys: Record<string, keyof Dictionary> = {
    db: "chartTimingDb",
    database: "chartTimingDb",
    app: "chartTimingApp",
    template: "chartTimingTemplate",
    templates: "chartTimingTemplates",
    render: "chartTimingRender",
    rendering: "chartTimingRender",
    data: "chartTimingData",
    cache: "chartTimingCache",
    auth: "chartTimingAuth",
    session: "chartTimingSession",
    bootstrap: "chartTimingBootstrap",
    init: "chartTimingBootstrap",
    routing: "chartTimingRouting",
    queue: "chartTimingQueue",
    total: "chartTimingTotal",
};

const serverTimingNames: Record<string, string> = {
    sql: "SQL",
    php: "PHP",
    redis: "Redis",
    memcached: "Memcached",
    api: "API",
    middleware: "Middleware",
};

const serverTimingLabel = (metric: string): string => {
    const name = metric.toLowerCase();
    const key = serverTimingKeys[name];
    return key ? t(key) : serverTimingNames[name] || metric;
};

export const httpRequestTimePreset: ChartConfig<HttpLog> = {
    getValue: (log) => log.total_time,
    getLabel: getCityLabel,
    isUnreliable: (log) => Boolean(log.unreliable),
    renderTooltip: ({ point }: ChartTooltipContext<HttpLog>): ChartTooltipCell[] => {
        const log = point.representative;
        const logs = point.logs;
        const cells: ChartTooltipCell[] = [
            {
                id: "status",
                label: t("chartStatus"),
                value: String(log.status_code ?? "N/A"),
                bold: true,
            },
            msCell("total", t("chartTotal"), point.y),
            msCell("dns", "DNS", avgOf(logs, (l) => l.dns_time)),
            msCell("tcp", "TCP", avgOf(logs, (l) => l.tcp_time)),
            msCell("tls", "TLS", avgOf(logs, (l) => l.tls_time)),
            msCell("ttfb", "TTFB", avgOf(logs, (l) => l.first_byte_time)),
            msCell("download", t("chartDownload"), avgOf(logs, (l) => l.download_time)),
        ];
        const serverTimingMetrics = new Set<string>();
        for (const l of logs) {
            if (l.server_timing && typeof l.server_timing === "object") {
                for (const metric of Object.keys(l.server_timing)) {
                    serverTimingMetrics.add(metric);
                }
            }
        }
        for (const metric of serverTimingMetrics) {
            const avg = avgOf(logs, (l) =>
                l.server_timing && typeof l.server_timing === "object"
                    ? l.server_timing[metric]
                    : undefined
            );
            cells.push(msCell(`st:${metric.toLowerCase()}`, serverTimingLabel(metric), avg));
        }
        return cells;
    },
};

export const pingPreset: ChartConfig<PingLog> = {
    getValue: (log) => log.total_time ?? log.rtt_avg,
    getLabel: getCityLabel,
    renderTooltip: ({ point }: ChartTooltipContext<PingLog>): ChartTooltipCell[] => {
        const log = point.representative;
        return [
            msCell("avg", t("chartAverage"), point.y, 1),
            msCell("min", t("chartMin"), log.rtt_min, 1),
            msCell("max", t("chartMax"), log.rtt_max, 1),
            {
                id: "loss",
                label: t("chartLoss"),
                value:
                    log.packet_loss !== undefined && log.packet_loss !== null
                        ? `${Number(log.packet_loss).toFixed(0)}%`
                        : "N/A",
                bold: true,
            },
        ];
    },
};

export interface BackendMetricPoint extends ChartLog {
    total_time?: number | null;
}

export const backendMetricPreset: ChartConfig<BackendMetricPoint> = {
    getValue: (log) => log.total_time,
    getLabel: serverTimingLabel,
    renderTooltip: ({ point }: ChartTooltipContext<BackendMetricPoint>): ChartTooltipCell[] => [
        msCell("value", t("chartValue"), point.y),
    ],
};

// Точка графика Lighthouse: одна метрика, общая для Lab и CrUX-серий.
export interface LighthousePoint extends ChartLog {
    value?: number | null;
}

// digits=3 для безразмерного CLS, иначе целые миллисекунды/баллы.
// valueLabel — общий заголовок колонки (имя метрики), чтобы Lab и CrUX
// p75 стояли в одном столбце, а их подписи (Lab/CrUX) — в строках.
export const makeLighthousePreset = (
    digits: number,
    valueLabel: string
): ChartConfig<LighthousePoint> => ({
    getValue: (log) => log.value,
    renderTooltip: ({ point }: ChartTooltipContext<LighthousePoint>): ChartTooltipCell[] => [
        msCell("value", valueLabel, point.y, digits),
    ],
});
