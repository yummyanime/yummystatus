import React from "react";
import styles from "./OverviewPlug.module.scss";

const OverviewPlug: React.FC = () => {
    return (
        <div className={styles.overviewContainer}>
            <div className={styles.leftPart}>
                <div className={styles.container}>
                    <div className={styles.statusBadge}></div>
                </div>
            </div>
            <div className={styles.rightPart}>
                <div className={styles.container}>
                    <div className={styles.chartWrapper}></div>
                    <div className={styles.avgWrapper}>
                        <div className={styles.avgLabel}></div>
                        <div className={styles.avgValue}></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OverviewPlug;
