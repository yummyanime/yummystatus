import React from "react";
import type { HealthReport, HttpLog, PingLog } from "../../api.ts";
import OverviewStatus from "./_content/OverviewStatus/OverviewStatus.tsx";
import OverviewChart from "./_content/OverviewChart/OverviewChart.tsx";
import styles from "./Overview.module.scss";
import OverviewPlug from "./_plug/OverviewPlug.tsx";

interface OverviewProps {
    allLogs: HttpLog[];
    pingLogs: PingLog[];
    health: HealthReport | null;
    loading: boolean;
    timeRange: string;
    domain?: string;
}

const Overview: React.FC<OverviewProps> = ({ allLogs, pingLogs, health, loading, timeRange, domain }) => {
    if (loading || !health) return <OverviewPlug />;

    return (
        <div className={styles.overviewContainer}>
            <div className={styles.leftPart}>
                <OverviewStatus health={health} />
            </div>
            <div className={styles.rightPart}>
                <OverviewChart allLogs={allLogs} pingLogs={pingLogs} timeRange={timeRange} domain={domain} />
            </div>
        </div>
    );
};

export default Overview;
