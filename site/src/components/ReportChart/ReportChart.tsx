import React, { useMemo } from "react";
import { Bar } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    TimeScale,
    Tooltip,
    type TooltipItem,
} from "chart.js";
import "chartjs-adapter-date-fns";
import { dateLocale, useLanguage } from "../../i18n.ts";
import type { OutageData } from "../../api.ts";
import { getReasonLabel } from "../../data/outage.ts";
import ReportChartPlug from "./_plug/ReportChartPlug.tsx";
import styles from "./ReportChart.module.scss";

ChartJS.register(CategoryScale, LinearScale, BarElement, TimeScale, Tooltip);

interface ReportChartProps {
    data: OutageData | null;
    loading: boolean;
}

const ReportChart: React.FC<ReportChartProps> = ({ data, loading }) => {
    const { t, tf, language } = useLanguage();
    const chartData = useMemo(() => {
        const buckets = data?.buckets ?? [];
        return {
            labels: buckets.map((b) => new Date(b.time)),
            datasets: [
                {
                    label: t("reportChartComplaints"),
                    data: buckets.map((b) => b.count),
                    backgroundColor: "#ff6666",
                    borderRadius: 2,
                    barPercentage: 1,
                    categoryPercentage: 0.9,
                },
            ],
        };
    }, [data, language]);

    const chartOptions = useMemo(
        () => ({
            responsive: true,
            maintainAspectRatio: false,
            animation: false as const,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        title: (items: TooltipItem<"bar">[]) =>
                            items[0]?.label ?? "",
                        label: (item: TooltipItem<"bar">) =>
                            tf("reportChartComplaintsCount", { n: item.parsed.y ?? 0 }),
                    },
                },
            },
            scales: {
                x: {
                    type: "time" as const,
                    adapters: { date: { locale: dateLocale(language) } },
                    time: {
                        unit: "hour" as const,
                        displayFormats: { hour: "HH:mm" },
                        tooltipFormat: "d MMM, HH:mm",
                    },
                    grid: { display: false },
                    ticks: {
                        color: "#aaa",
                        maxRotation: 0,
                        autoSkipPadding: 20,
                    },
                },
                y: {
                    beginAtZero: true,
                    suggestedMax: 10,
                    ticks: { color: "#aaa", precision: 0, maxTicksLimit: 2 },
                    grid: { color: "rgba(255,255,255,0.06)" },
                },
            },
        }),
        [language]
    );

    if (loading) return <ReportChartPlug />;

    const reasons = data?.reasons ?? [];

    return (
        <div className={styles.grid}>
            <div className={styles.chartCard}>
                <div className={styles.chartHeader}>
                    <span className={styles.chartLabel}>
                        {t("reportChartTitle")}
                    </span>
                    {data && (
                        <span className={styles.totalBadge}>
                            {tf("reportChartTotal", { n: data.total })}
                        </span>
                    )}
                </div>
                <div className={styles.chartWrapper}>
                    <Bar data={chartData} options={chartOptions} />
                </div>
            </div>

            <div className={styles.reasonsCard}>
                <span className={styles.reasonsTitle}>
                    {t("reportPopularReasons")}
                </span>
                {reasons.length === 0 ? (
                    <div className={styles.noReasons}>
                        {t("reportNone")}
                    </div>
                ) : (
                    <ul className={styles.reasonsList}>
                        {reasons.map((r) => (
                            <li key={r.reason} className={styles.reasonItem}>
                                <span className={styles.reasonName}>
                                    {getReasonLabel(r.reason)}
                                </span>
                                <span className={styles.reasonCount}>
                                    {r.count}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default ReportChart;
