import React from "react";
import OverviewStatus from "./OverviewStatus/OverviewStatus.tsx";
import OverviewChart from "./OverviewChart/OverviewChart.tsx";
import styles from "./Overview.module.scss";
import OverviewPlug from "./OverviewPlug.tsx";

interface Log {
    created_at: string;
    domain?: string;
    status_code?: number;
    total_time?: number;
}

interface OverviewProps {
    allLogs: Log[];
    loading: boolean;
    timeRange: string;
}

const Overview: React.FC<OverviewProps> = ({ allLogs, loading, timeRange }) => {
    if (loading) return <OverviewPlug />;

    return (
        <div className={styles.overviewContainer}>
            <div className={styles.leftPart}>
                <OverviewStatus allLogs={allLogs} />
            </div>
            <div className={styles.rightPart}>
                <OverviewChart allLogs={allLogs} timeRange={timeRange} />
            </div>
        </div>
    );
};

export default Overview;
