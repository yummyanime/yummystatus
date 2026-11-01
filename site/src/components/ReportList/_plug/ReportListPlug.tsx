import React from "react";
import { useLanguage } from "../../../i18n.ts";
import styles from "./ReportListPlug.module.scss";

const ReportListPlug: React.FC = () => {
    const { t } = useLanguage();

    return (
        <div className={styles.card}>
            <span className={styles.title}>{t("reportListTitle")}</span>
            <div className={styles.list}>
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className={styles.item}></div>
                ))}
            </div>
        </div>
    );
};

export default ReportListPlug;
