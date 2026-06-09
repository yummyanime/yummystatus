import React, { useMemo } from "react";
import {
    getMetric,
    rate,
    RATING_COLORS,
    formatMetric,
    type LighthouseLog,
    type LighthouseMetricKey,
} from "../../lighthouseMetrics.ts";
import styles from "./LhSummary.module.scss";

export interface ScreenshotData {
    image: string | null;
    url_path?: string;
    updated_at?: string;
}

interface LhSummaryProps {
    logs: LighthouseLog[];
    strategy: string;
    screenshot: ScreenshotData | null;
}

// Метрики, выносимые в карточки сводки (по приоритету для пользователя).
const SUMMARY_KEYS: LighthouseMetricKey[] = ["perf_score", "lcp", "cls", "ttfb"];

const avgOf = (
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

const latestOf = (
    logs: LighthouseLog[],
    key: keyof LighthouseLog
): number | null => {
    for (let i = logs.length - 1; i >= 0; i--) {
        const v = logs[i][key] as number | null | undefined;
        if (v !== null && v !== undefined && Number.isFinite(v)) return v;
    }
    return null;
};

// Тренд: среднее второй половины периода против первой.
const trendOf = (
    logs: LighthouseLog[],
    key: keyof LighthouseLog
): number | null => {
    if (logs.length < 4) return null;
    const mid = Math.floor(logs.length / 2);
    const first = avgOf(logs.slice(0, mid), key);
    const second = avgOf(logs.slice(mid), key);
    if (first === null || second === null || first === 0) return null;
    return ((second - first) / Math.abs(first)) * 100;
};

const formatBytes = (v: number | null | undefined): string => {
    if (v === null || v === undefined || !Number.isFinite(v)) return "—";
    if (v >= 1024 * 1024) return `${(v / (1024 * 1024)).toFixed(1)} МБ`;
    if (v >= 1024) return `${(v / 1024).toFixed(0)} КБ`;
    return `${Math.round(v)} Б`;
};

const formatMs = (v: number | null | undefined): string =>
    v === null || v === undefined || !Number.isFinite(v)
        ? "—"
        : `${Math.round(v)} мс`;

const LhSummary: React.FC<LhSummaryProps> = ({ logs, strategy, screenshot }) => {
    const cards = useMemo(
        () =>
            SUMMARY_KEYS.map((key) => {
                const metric = getMetric(key);
                const avg = avgOf(logs, metric.key);
                const p75 = metric.fieldKey ? latestOf(logs, metric.fieldKey) : null;
                const trend = trendOf(logs, metric.key);
                const rating = rate(metric, avg);
                // «улучшение» зависит от направления метрики
                let improving: boolean | null = null;
                if (trend !== null && Math.abs(trend) >= 1) {
                    improving = metric.higherIsBetter ? trend > 0 : trend < 0;
                }
                return { metric, avg, p75, trend, rating, improving };
            }),
        [logs]
    );

    const diagnostics = useMemo<Record<string, number> | null>(() => {
        for (let i = logs.length - 1; i >= 0; i--) {
            const d = logs[i].diagnostics;
            if (d && typeof d === "object") return d;
        }
        return null;
    }, [logs]);

    const updatedLabel = screenshot?.updated_at
        ? new Date(screenshot.updated_at).toLocaleString("ru-RU", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
          })
        : null;

    return (
        <div className={styles.summary}>
            <div className={styles.left}>
                <div className={styles.cards}>
                    {cards.map(({ metric, avg, p75, trend, rating, improving }) => (
                        <div key={metric.key} className={styles.card}>
                            <div className={styles.cardHead}>
                                <span className={styles.cardLabel}>{metric.label}</span>
                                <span
                                    className={styles.dot}
                                    style={{ backgroundColor: RATING_COLORS[rating] }}
                                />
                            </div>
                            <span
                                className={styles.cardValue}
                                style={{ color: RATING_COLORS[rating] }}
                            >
                                {formatMetric(metric, avg)}
                            </span>
                            {p75 !== null ? (
                                <span className={styles.cardP75}>
                                    p75 {formatMetric(metric, p75)}
                                </span>
                            ) : (
                                <span className={styles.cardP75muted}>поле n/a</span>
                            )}
                            {improving !== null && trend !== null ? (
                                <span
                                    className={styles.cardTrend}
                                    style={{
                                        color: improving
                                            ? RATING_COLORS.good
                                            : RATING_COLORS.poor,
                                    }}
                                >
                                    {trend > 0 ? "▲" : "▼"} {Math.abs(trend).toFixed(0)}%
                                </span>
                            ) : (
                                <span className={styles.cardTrendMuted}>—</span>
                            )}
                        </div>
                    ))}
                </div>

                {diagnostics ? (
                    <div className={styles.diagnostics}>
                        <span className={styles.diagItem}>
                            JS <b>{formatMs(diagnostics.bootup_time)}</b>
                        </span>
                        <span className={styles.diagItem}>
                            Main-thread <b>{formatMs(diagnostics.mainthread_work)}</b>
                        </span>
                        <span className={styles.diagItem}>
                            Вес <b>{formatBytes(diagnostics.total_byte_weight)}</b>
                        </span>
                        <span className={styles.diagItem}>
                            DOM <b>{diagnostics.dom_size ?? "—"}</b>
                        </span>
                        <span className={styles.diagItem}>
                            A11y <b>{diagnostics.accessibility ?? "—"}</b>
                        </span>
                        <span className={styles.diagItem}>
                            SEO <b>{diagnostics.seo ?? "—"}</b>
                        </span>
                        <span className={styles.diagItem}>
                            BP <b>{diagnostics.best_practices ?? "—"}</b>
                        </span>
                    </div>
                ) : null}
            </div>

            <div className={styles.screenshot}>
                {screenshot?.image ? (
                    <>
                        <img src={screenshot.image} alt="Скриншот страницы" />
                        <span className={styles.shotMeta}>
                            {strategy === "desktop" ? "🖥" : "📱"} {strategy}
                            {updatedLabel ? ` · ${updatedLabel}` : ""}
                        </span>
                    </>
                ) : (
                    <div className={styles.shotPlaceholder}>Скриншот пока не получен</div>
                )}
            </div>
        </div>
    );
};

export default LhSummary;
