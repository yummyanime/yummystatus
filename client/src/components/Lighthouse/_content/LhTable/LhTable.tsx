import cn from "classnames";
import type React from "react";
import { useMemo } from "react";
import {
    avgOf,
    formatMetric,
    getMetric,
    type LighthouseLog,
    RATING_COLORS,
    rate,
    SUMMARY_KEYS,
} from "../../lighthouseMetrics.ts";
import styles from "./LhTable.module.scss";

interface LhTableProps {
    pages: { path: string; logs: LighthouseLog[] }[];
    selected: string | null;
    onSelect: (path: string | null) => void;
}

const LhTable: React.FC<LhTableProps> = ({ pages, selected, onSelect }) => {
    const rows = useMemo(
        () =>
            [
                {
                    path: null,
                    label: "Все страницы",
                    logs: pages.flatMap((p) => p.logs),
                },
                ...pages.map((p) => ({ ...p, label: p.path })),
            ].map((row) => ({
                ...row,
                averages: SUMMARY_KEYS.map((key) => ({
                    metric: getMetric(key),
                    avg: avgOf(row.logs, key),
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
                    {rows.map((row) => (
                        <tr
                            key={row.path ?? "all"}
                            onClick={() => onSelect(row.path)}
                            className={cn(
                                styles.row,
                                row.path === null && styles.total,
                                row.path === selected && styles.selected
                            )}
                        >
                            <td>{row.label}</td>
                            {row.averages.map(({ metric, avg }) => (
                                <td
                                    key={metric.key}
                                    style={{
                                        color: RATING_COLORS[rate(metric, avg)],
                                    }}
                                >
                                    {formatMetric(metric, avg)}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default LhTable;
