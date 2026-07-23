import React from "react";
import {
    getBucketColorCounts,
    getGlobalHealth,
    HEALTH_LABEL,
    type BucketColor,
} from "../../../../data/constants.ts";
import styles from "./OverviewStatus.module.scss";

interface Log {
    created_at: string;
    domain?: string;
    status_code?: number;
    total_time?: number;
}

interface OverviewStatusProps {
    allLogs: Log[];
}

const COLOR_VALUE: Record<BucketColor, string> = {
    green: "var(--color-green)",
    darkGreen: "var(--color-dark-green)",
    yellow: "var(--color-yellow)",
    orange: "#fd7e14",
    red: "var(--color-red)",
    grey: "#adb5bd",
    blue: "var(--color-blue)",
};

const COLOR_LABEL: Record<BucketColor, string> = {
    green: "В норме",
    darkGreen: "1 город с проблемой",
    yellow: "2 города с проблемами",
    orange: "3+ городов с проблемами",
    red: "Полная недоступность",
    blue: "Капча",
    grey: "Сбой измерителя",
};

const COLOR_ORDER: BucketColor[] = [
    "green",
    "darkGreen",
    "yellow",
    "orange",
    "red",
    "blue",
    "grey",
];

const OverviewStatus: React.FC<OverviewStatusProps> = ({ allLogs }) => {
    const health = getGlobalHealth(allLogs);
    const counts = getBucketColorCounts(allLogs);
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
            <div className={`${styles.statusBadge} ${styles[health]}`}>
                {HEALTH_LABEL[health]}
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
