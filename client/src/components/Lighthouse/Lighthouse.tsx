import React, { useEffect, useState, useCallback, useMemo } from "react";
import LhSummary from "./_content/LhSummary/LhSummary.tsx";
import LhChart from "./_content/LhChart/LhChart.tsx";
import LhTable from "./_content/LhTable/LhTable.tsx";
import LighthousePlug from "./_plug/LighthousePlug.tsx";
import ToggleSwitch from "../ToggleSwitch/ToggleSwitch.tsx";
import { useDashboardSettings } from "../../context/DashboardSettingsContext.tsx";
import {
    averageByHour,
    groupLogs,
    type LighthouseLog,
} from "./lighthouseMetrics.ts";
import styles from "./Lighthouse.module.scss";

interface LighthouseProps {
    domain: string;
}

type Strategy = "mobile" | "desktop";

const Lighthouse: React.FC<LighthouseProps> = ({ domain }) => {
    const { timeRange, dateRange, effectiveTimeRange } = useDashboardSettings();
    const [strategy, setStrategy] = useState<Strategy>(
        () => (localStorage.getItem("lighthouseStrategy") as Strategy) || "mobile"
    );
    const [logs, setLogs] = useState<LighthouseLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [hasData, setHasData] = useState(false);

    const handleStrategy = (value: Strategy) => {
        setStrategy(value);
        localStorage.setItem("lighthouseStrategy", value);
    };

    const buildQuery = useCallback(() => {
        const params = new URLSearchParams();
        if (dateRange) {
            params.set("dateFrom", dateRange.from);
            params.set("dateTo", dateRange.to);
        } else {
            params.set("timeRange", timeRange);
        }
        params.set("domain", domain);
        params.set("strategy", strategy);
        return params.toString();
    }, [dateRange, timeRange, domain, strategy]);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);

        const fetchAll = async () => {
            try {
                const logsRes = await fetch(`/lighthouse-logs?${buildQuery()}`);

                if (!cancelled && logsRes.ok) {
                    const data: LighthouseLog[] = await logsRes.json();
                    setLogs(data);
                    if (data.length > 0) setHasData(true);
                }
            } catch (e) {
                console.error("Error fetching Lighthouse data:", e);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchAll();
        return () => {
            cancelled = true;
        };
    }, [buildQuery]);

    const pages = useMemo(() => {
        const grouped = groupLogs(logs, (l) => l.url_path ?? "");
        return [...grouped]
            .map(([path, pageLogs]) => ({ path, logs: pageLogs }))
            .sort((a, b) => a.path.localeCompare(b.path));
    }, [logs]);

    const averaged = useMemo(() => averageByHour(logs), [logs]);

    if (loading) {
        return <LighthousePlug />;
    }

    if (!hasData && logs.length === 0) {
        return null;
    }

    return (
        <div className={styles.lighthouse}>
            <div className={styles.header}>
                <ToggleSwitch
                    label={strategy === "desktop" ? "ПК" : "Телефон"}
                    checked={strategy === "desktop"}
                    onChange={(checked) => handleStrategy(checked ? "desktop" : "mobile")}
                />
            </div>

            <LhSummary logs={logs} />

            <div className={styles.divider} />

            <LhTable pages={pages} timeRange={effectiveTimeRange} />

            <div className={styles.divider} />

            <LhChart logs={averaged} timeRange={effectiveTimeRange} />
        </div>
    );
};

export default Lighthouse;
