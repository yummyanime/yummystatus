import React from "react";
import { format } from "date-fns";
import type { OutageData } from "../../api.ts";
import { getReasonLabel } from "../../data/outage.ts";
import { dateLocale, useLanguage } from "../../i18n.ts";
import ReportListPlug from "./_plug/ReportListPlug.tsx";
import styles from "./ReportList.module.scss";

interface ReportListProps {
    data: OutageData | null;
    loading: boolean;
}

const ReportList: React.FC<ReportListProps> = ({ data, loading }) => {
    const { language, t } = useLanguage();

    if (loading) return <ReportListPlug />;

    const reports = data?.reports ?? [];

    return (
        <div className={styles.card}>
            <span className={styles.title}>{t("reportListTitle")}</span>
            {reports.length === 0 ? (
                <div className={styles.empty}>
                    {t("reportNone")}
                </div>
            ) : (
                <ul className={styles.list}>
                    {reports.map((report) => (
                        <li key={report.time} className={styles.item}>
                            <span className={styles.date}>
                                {format(new Date(report.time), "d MMM, HH:mm", {
                                    locale: dateLocale(language),
                                })}
                            </span>
                            <div className={styles.reasons}>
                                {report.reasons.map((reason, i) => (
                                    <span key={i} className={styles.reason}>
                                        {getReasonLabel(reason)}
                                    </span>
                                ))}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default ReportList;
