import { useState, useEffect, useMemo, useDeferredValue } from "react";
import { useParams } from "react-router-dom";
import styles from "./Dashboard.module.scss";
import Menu from "../Menu/Menu.tsx";
import Status from "../Status/Status.tsx";
import Overview from "../Overview/Overview.tsx";
import { useDataStatus } from "../../context/DataStatusContext.tsx";
import { useDashboardSettings } from "../../context/DashboardSettingsContext.tsx";
import CountryChart from "../CountryChart/CountryChart.tsx";
import Lighthouse from "../Lighthouse/Lighthouse.tsx";
import { CHART_SPIKE_MS, isBareView } from "../../data/constants.ts";
import {
    api,
    timeQuery,
    withCreatedAt,
    type HealthReport,
    type HttpLog,
    type LocationGroups,
    type PingLog,
} from "../../api.ts";

interface CityLogs {
    [city: string]: HttpLog[];
}

interface CountryLogs {
    [country: string]: CityLogs;
}

const allowedCountries = ["RU", "UA", "BY"];

const processCityLogs = (cityLogsMap: CityLogs): CityLogs => {
    const filteredLogs: CityLogs = {};
    for (const city in cityLogsMap) {
        const cityLogs = cityLogsMap[city];
        let lastValidLog: HttpLog | null = null;

        const processedLogs = cityLogs.map((log, i) => {
            const isHighPing = (log.total_time ?? 0) > CHART_SPIKE_MS;
            let isUnreliable = false;

            if (isHighPing) {
                const prev = cityLogs[i - 1];
                const isPrevHigh = (prev?.total_time ?? 0) > CHART_SPIKE_MS;

                if (!isPrevHigh) {
                    isUnreliable = true;
                }
            }

            if (isUnreliable) {
                if (lastValidLog) {
                    return {
                        ...log,
                        total_time: lastValidLog.total_time,
                        download_time: lastValidLog.download_time,
                        first_byte_time: lastValidLog.first_byte_time,
                        dns_time: lastValidLog.dns_time,
                        tls_time: lastValidLog.tls_time,
                        tcp_time: lastValidLog.tcp_time,
                        server_timing: lastValidLog.server_timing,
                        unreliable: true,
                    };
                } else {
                    const firstValid = cityLogs.find(
                        (l) => (l.total_time ?? 0) <= CHART_SPIKE_MS
                    );
                    if (firstValid) {
                        return {
                            ...log,
                            total_time: firstValid.total_time,
                            download_time: firstValid.download_time,
                            first_byte_time: firstValid.first_byte_time,
                            dns_time: firstValid.dns_time,
                            tls_time: firstValid.tls_time,
                            tcp_time: firstValid.tcp_time,
                            server_timing: firstValid.server_timing,
                            unreliable: true,
                        };
                    }
                }
            } else if (!isHighPing) {
                lastValidLog = log;
            }
            return log;
        });

        filteredLogs[city] = processedLogs;
    }
    return filteredLogs;
};

const Dashboard = () => {
    const [rawHttpLogs, setRawHttpLogs] = useState<CountryLogs>({});
    const [locationGroups, setLocationGroups] = useState<LocationGroups | null>(null);
    const [rawDomainLogs, setRawDomainLogs] = useState<{
        [domain: string]: CityLogs;
    }>({});
    const [loading, setLoading] = useState(true);
    const { setStatus } = useDataStatus();
    const {
        timeRange,
        autoRefresh,
        hideUnreliable,
        dateRange,
        effectiveTimeRange,
    } = useDashboardSettings();
    const { domain } = useParams<{ domain: string }>();
    const [allLogs, setAllLogs] = useState<HttpLog[]>([]);
    const [pingLogs, setPingLogs] = useState<PingLog[]>([]);
    const [health, setHealth] = useState<HealthReport | null>(null);

    const fetchData = async () => {
        const query = timeQuery(timeRange, dateRange);
        try {
            const [logsResponse, healthResponse, locationsResponse] =
                await Promise.all([
                    api["http-logs"].$get({
                        query: domain ? { ...query, domain } : query,
                    }),
                    api.health.$get({
                        query: domain
                            ? { ...query, domain }
                            : { ...query, countries: allowedCountries.join(",") },
                    }),
                    domain ? api.locations.$get() : null,
                ]);

            for (const response of [
                logsResponse,
                healthResponse,
                locationsResponse,
            ]) {
                if (response && !response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
            }

            const data = await logsResponse.json();
            setHealth(await healthResponse.json());
            if (locationsResponse) {
                setLocationGroups(await locationsResponse.json());
            }

            if (Array.isArray(data)) {
                const domainLogsData: { [domain: string]: CityLogs } = {};
                for (const log of withCreatedAt(data)) {
                    if (
                        log.domain &&
                        log.city &&
                        log.country &&
                        allowedCountries.includes(log.country)
                    ) {
                        const domainLogs = (domainLogsData[log.domain] ??= {});
                        (domainLogs[log.city] ??= []).push(log);
                    }
                }
                setRawDomainLogs(domainLogsData);
                setAllLogs(
                    Object.values(domainLogsData).flatMap((domainData) =>
                        Object.values(domainData).flat()
                    )
                );
            } else {
                const logsData: CountryLogs = {};
                for (const [country, countryData] of Object.entries(data)) {
                    logsData[country] = {};
                    for (const [city, cityData] of Object.entries(countryData)) {
                        logsData[country][city] = withCreatedAt(cityData).map(
                            (log) => ({
                                ...log,
                                domain: domain ?? null,
                                country,
                                city,
                            })
                        );
                    }
                }
                setRawHttpLogs(logsData);
                setAllLogs(
                    Object.values(logsData).flatMap((countryData) =>
                        Object.values(countryData).flat()
                    )
                );
            }

            try {
                const pingResponse = await api["ping-logs"].$get({
                    query: domain ? { ...query, domain } : query,
                });
                if (pingResponse.ok) {
                    setPingLogs(withCreatedAt(await pingResponse.json()));
                }
            } catch (e) {
                console.error("Error fetching ping data:", e);
            }

            setStatus("dashboard", "success");
        } catch (e) {
            console.error("Error fetching data:", e);
            if (
                Object.keys(rawHttpLogs).length > 0 ||
                Object.keys(rawDomainLogs).length > 0
            ) {
                setStatus("dashboard", "stale");
            } else {
                setStatus("dashboard", "error");
            }
        } finally {
            setLoading(false);
        }
    };

    const deferredHideUnreliable = useDeferredValue(hideUnreliable);

    const httpLogs = useMemo(() => {
        if (!deferredHideUnreliable) return rawHttpLogs;
        const result: CountryLogs = {};
        for (const country in rawHttpLogs) {
            result[country] = processCityLogs(rawHttpLogs[country]);
        }
        return result;
    }, [rawHttpLogs, deferredHideUnreliable]);

    const domainLogs = useMemo(() => {
        if (!deferredHideUnreliable) return rawDomainLogs;
        const result: { [domain: string]: CityLogs } = {};
        for (const domainKey in rawDomainLogs) {
            result[domainKey] = processCityLogs(rawDomainLogs[domainKey]);
        }
        return result;
    }, [rawDomainLogs, deferredHideUnreliable]);

    useEffect(() => {
        setLoading(true);
        setStatus("dashboard", "loading");
        fetchData();
    }, [domain, timeRange, dateRange?.from, dateRange?.to]);

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                fetchData();
            }
        };

        if (autoRefresh) {
            document.addEventListener("visibilitychange", handleVisibilityChange);
        }

        return () => {
            document.removeEventListener(
                "visibilitychange",
                handleVisibilityChange
            );
        };
    }, [domain, timeRange, autoRefresh, dateRange?.from, dateRange?.to]);

    const controls = isBareView() ? null : (
        <div className={styles.controls}>
            <Menu />
        </div>
    );

    if (!domain) {
        return (
            <div className={styles.dashboard} style={{ marginBottom: "140px" }}>
                {controls}
                <Overview
                    allLogs={allLogs}
                    pingLogs={pingLogs}
                    health={health}
                    loading={loading}
                    timeRange={effectiveTimeRange}
                    domain={domain}
                />
                <Status
                    health={health}
                    loading={loading}
                />
                <CountryChart
                    type="domain"
                    domainLogs={domainLogs}
                    timeRange={effectiveTimeRange}
                    loading={loading}
                />
            </div>
        );
    }

    return (
        <div className={styles.dashboard}>
            {controls}
            <Overview
                allLogs={allLogs}
                pingLogs={pingLogs}
                health={health}
                loading={loading}
                timeRange={effectiveTimeRange}
                domain={domain}
            />
            <Status
                health={health}
                domain={domain}
                loading={loading}
            />
            <CountryChart
                type="country"
                locationGroups={locationGroups}
                httpLogs={httpLogs}
                timeRange={effectiveTimeRange}
                loading={loading}
            />
            <Lighthouse domain={domain} />
        </div>
    );
};

export default Dashboard;
