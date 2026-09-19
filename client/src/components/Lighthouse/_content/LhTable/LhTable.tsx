import cn from "classnames";
import React, { useMemo, useState } from "react";
import {
    avgOf,
    formatMetric,
    getMetric,
    type LighthouseLog,
    RATING_COLORS,
    rate,
    SUMMARY_KEYS,
} from "../../lighthouseMetrics.ts";
import LhChart from "../LhChart/LhChart.tsx";
import styles from "./LhTable.module.scss";

interface LhTableProps {
    pages: { path: string; logs: LighthouseLog[] }[];
    timeRange: string;
}

const LhTable: React.FC<LhTableProps> = ({ pages, timeRange }) => {
    const [expanded, setExpanded] = useState<string | null>(null);

    const rows = useMemo(
        () =>
            pages.map((page) => ({
                ...page,
                averages: SUMMARY_KEYS.map((key) => ({
                    metric: getMetric(key),
                    avg: avgOf(page.logs, key),
                })),
            })),
        [pages]
    );

    return (
        <div className={styles.wrapper}>
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>Страница</th>
                        {SUMMARY_KEYS.map((key) => (
                            <th key={key}>{getMetric(key).label}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => {
                        const isActive = expanded === row.path;
                        return (
                            <React.Fragment key={row.path}>
                                <tr
                                    className={cn(
                                        styles.row,
                                        isActive && styles.active
                                    )}
                                    onClick={() =>
                                        setExpanded(isActive ? null : row.path)
                                    }
                                >
                                    <td>{row.path}</td>
                                    {row.averages.map(({ metric, avg }) => (
                                        <td
                                            key={metric.key}
                                            style={{
                                                color: RATING_COLORS[
                                                    rate(metric, avg)
                                                ],
                                            }}
                                        >
                                            {formatMetric(metric, avg)}
                                        </td>
                                    ))}
                                </tr>
                                {isActive ? (
                                    <tr className={styles.chartRow}>
                                        <td colSpan={SUMMARY_KEYS.length + 1}>
                                            <LhChart
                                                logs={row.logs}
                                                timeRange={timeRange}
                                            />
                                        </td>
                                    </tr>
                                ) : null}
                            </React.Fragment>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default LhTable;
