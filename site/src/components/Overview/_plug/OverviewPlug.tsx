import React from "react";
import Button from "../../Button/Button.tsx";
import { useLanguage } from "../../../i18n.ts";
import styles from "./OverviewPlug.module.scss";

const OverviewPlug: React.FC = () => {
    const { t } = useLanguage();
    return (
        <div className={styles.overviewContainer}>
            <div className={styles.leftPart}>
                <div className={styles.statusBadge}></div>
                <div className={styles.chartArea}>
                    <div className={styles.donut}></div>
                </div>
            </div>
            <div className={styles.rightPart}>
                <div className={styles.tabsWrapper}>
                    <Button active>{t("overviewTabLoadTime")}</Button>
                    <Button>Ping</Button>
                </div>
                <div className={styles.chartWrapper}></div>
                <div className={styles.avgWrapper}>
                    <span className={styles.avgLabel}>{t("overviewAvgLoad")}</span>
                    <div className={styles.avgValue}></div>
                </div>
            </div>
        </div>
    );
};

export default OverviewPlug;
