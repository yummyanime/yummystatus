import { useEffect, useRef, useState } from "react";
import { type TimeQuery, timeQuery } from "../api.ts";
import { useDashboardSettings } from "../context/DashboardSettingsContext.tsx";
import { useDataStatus } from "../context/DataStatusContext.tsx";

export function useDashboardData<T>(load: (query: TimeQuery) => Promise<T>) {
    const { timeRange, dateRange, autoRefresh } = useDashboardSettings();
    const { setStatus } = useDataStatus();
    const [data, setData] = useState<T | null>(null);
    const latest = useRef({ load, autoRefresh });
    latest.current = { load, autoRefresh };

    useEffect(() => {
        let active = true;
        let loaded = false;
        setData(null);
        setStatus("dashboard", "loading");

        const refresh = async () => {
            try {
                const result = await latest.current.load(
                    timeQuery(timeRange, dateRange)
                );
                if (!active) return;
                loaded = true;
                setData(result);
                setStatus("dashboard", "success");
            } catch (e) {
                console.error("Error fetching data:", e);
                if (active) setStatus("dashboard", loaded ? "stale" : "error");
            }
        };
        const onVisible = () => {
            if (
                latest.current.autoRefresh &&
                document.visibilityState === "visible"
            ) {
                refresh();
            }
        };

        refresh();
        document.addEventListener("visibilitychange", onVisible);
        return () => {
            active = false;
            document.removeEventListener("visibilitychange", onVisible);
        };
    }, [timeRange, dateRange, setStatus]);

    return data;
}
