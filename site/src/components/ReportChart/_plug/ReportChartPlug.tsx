import React from "react";
import { useLanguage } from "../../../i18n.ts";
import styles from "./ReportChartPlug.module.scss";

const ReportChartPlug: React.FC = () => {
    const { t } = useLanguage();

    return (
        <div className={styles.grid}>
            <div className={styles.chartCard}>
                <div className={styles.chartHeader}>
                    <span className={styles.chartLabel}>
                        {t("reportChartTitle")}
                    </span>
                </div>
                <div className={styles.chartWrapper}></div>
            </div>
            <div className={styles.reasonsCard}>
                <span className={styles.reasonsTitle}>
                    {t("reportPopularReasons")}
                </span>
                <div className={styles.reasonsList}>
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className={styles.reasonItem}></div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ReportChartPlug;
