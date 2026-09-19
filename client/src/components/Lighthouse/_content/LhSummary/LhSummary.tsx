import React, { useMemo } from "react";
import {
    getMetric,
    rate,
    RATING_COLORS,
    formatMetric,
    SUMMARY_KEYS,
    avgOf,
    type LighthouseLog,
} from "../../lighthouseMetrics.ts";
import styles from "./LhSummary.module.scss";

interface LhSummaryProps {
    logs: LighthouseLog[];
}

const LhSummary: React.FC<LhSummaryProps> = ({ logs }) => {
    const cards = useMemo(
        () =>
            SUMMARY_KEYS.map((key) => {
                const metric = getMetric(key);
                const avg = avgOf(logs, metric.key);
                const p75 = metric.fieldKey ? avgOf(logs, metric.fieldKey) : null;
                return {
                    metric,
                    avg,
                    p75,
                    rating: rate(metric, avg),
                    p75Rating: rate(metric, p75),
                    hasField: Boolean(metric.fieldKey),
                };
            }),
        [logs]
    );

    return (
        <div className={styles.cards}>
            {cards.map(({ metric, avg, p75, rating, p75Rating, hasField }) => (
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
                    {hasField ? (
                        <>
                            <div className={styles.cardDivider} />
                            <div className={styles.p75Row}>
                                <span className={styles.p75Label}>p75</span>
                                <span
                                    className={styles.p75Value}
                                    style={{ color: RATING_COLORS[p75Rating] }}
                                >
                                    {formatMetric(metric, p75)}
                                </span>
                            </div>
                        </>
                    ) : null}
                </div>
            ))}
        </div>
    );
};

export default LhSummary;
