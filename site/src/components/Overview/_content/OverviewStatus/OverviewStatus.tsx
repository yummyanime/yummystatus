import React from "react";
import type { BucketStatus, HealthReport } from "../../../../api.ts";
import { HEALTH_LABEL } from "../../../../data/constants.ts";
import styles from "./OverviewStatus.module.scss";

interface OverviewStatusProps {
    health: HealthReport;
}

const COLOR_VALUE: Record<BucketStatus, string> = {
    UP: "var(--color-green)",
    DEGRADED_LOW: "var(--color-dark-green)",
    DEGRADED_MEDIUM: "var(--color-yellow)",
    DEGRADED_HIGH: "#fd7e14",
    DOWN: "var(--color-red)",
    PROBE_ERROR: "#adb5bd",
    CAPTCHA: "var(--color-blue)",
};

const COLOR_LABEL: Record<BucketStatus, string> = {
    UP: "В норме",
    DEGRADED_LOW: "1 город с проблемой",
    DEGRADED_MEDIUM: "2 города с проблемами",
    DEGRADED_HIGH: "3+ городов с проблемами",
    DOWN: "Полная недоступность",
    CAPTCHA: "Капча",
    PROBE_ERROR: "Сбой измерителя",
};

const COLOR_ORDER: BucketStatus[] = [
    "UP",
    "DEGRADED_LOW",
    "DEGRADED_MEDIUM",
    "DEGRADED_HIGH",
    "DOWN",
    "CAPTCHA",
    "PROBE_ERROR",
];

const OverviewStatus: React.FC<OverviewStatusProps> = ({ health }) => {
    const counts = health.statusCounts;
    const total = COLOR_ORDER.reduce((sum, c) => sum + counts[c], 0);

    let cumulative = 0;
    const segments = COLOR_ORDER.filter((c) => counts[c] > 0).map((c) => {
        const pct = (counts[c] / total) * 100;
        const segment = { color: c, offset: 25 - cumulative, pct };
        cumulative += pct;
        return segment;
    });

    return (
        <div className={styles.container}>
            <div className={`${styles.statusBadge} ${styles[health.health]}`}>
                {HEALTH_LABEL[health.health]}
            </div>

            <div className={styles.chartArea}>
                <svg className={styles.donut} viewBox="-2 -2 40 40">
                    <circle
                        className={styles.track}
                        cx="18"
                        cy="18"
                        r="15.9155"
                        fill="none"
                    />
                    {segments.map((s) => (
                        <circle
                            key={s.color}
                            cx="18"
                            cy="18"
                            r="15.9155"
                            fill="none"
                            strokeDasharray={`${s.pct} ${100 - s.pct}`}
                            strokeDashoffset={s.offset}
                            style={{ stroke: COLOR_VALUE[s.color] }}
                        >
                            <title>{`${COLOR_LABEL[s.color]}: ${counts[s.color]}`}</title>
                        </circle>
                    ))}
                    <text className={styles.donutTotal} x="18" y="16">
                        {total}
                    </text>
                    <text className={styles.donutCaption} x="18" y="23">
                        замеров
                    </text>
                </svg>
            </div>
        </div>
    );
};

export default OverviewStatus;
