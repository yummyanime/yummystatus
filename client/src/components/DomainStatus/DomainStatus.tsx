import { useRef } from "react";
import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css";
import useResize from "../../hooks/useResize.tsx";
import styles from "../Status/Status.module.scss";
import { cityTranslations } from "../../data/constants.ts";
import ReactCountryFlag from "react-country-flag";

interface GroupedLog {
    created_at: string;
    total_time_avg: number;
    results: {
        city: string;
        country: string;
        status_code: number | null;
        total_time: number | null;
    }[];
}

interface DomainStatusProps {
    domain: string;
    logs: GroupedLog[];
    timeRange?: string;
}

const getStatusColor = (log: GroupedLog) => {
    const allCountriesUnavailable =
        log.results.length > 0 &&
        log.results.every((r) => Number(r.status_code) === 599);

    const relevantResults = log.results.filter(
        (r) =>
            (allCountriesUnavailable || Number(r.status_code) !== 599) &&
            Number(r.status_code) !== 429
    );

    const quotaExceededCount = log.results.filter(
        (r) => Number(r.status_code) === 429
    ).length;

    if (quotaExceededCount > 0 && relevantResults.length === 0) {
        return styles.grey;
    }

    const captchaCount = relevantResults.filter(
        (r) => Number(r.status_code) === 202
    ).length;

    if (captchaCount > 0) {
        return styles.blue;
    }

    const problematicCountriesCount = relevantResults.filter(
        (r) =>
            r.status_code !== 200 ||
            r.total_time === null ||
            (r.total_time && r.total_time > 1500)
    ).length;

    if (relevantResults.length > 0 && problematicCountriesCount === relevantResults.length) {
        return styles.red;
    }
    if (problematicCountriesCount >= 3) {
        return styles.orange;
    }
    if (problematicCountriesCount === 1) {
        return styles.darkGreen;
    }
    if (problematicCountriesCount >= 2) {
        return styles.yellow;
    }
    return styles.green;
};

const DomainStatus: React.FC<DomainStatusProps> = ({ domain, logs }) => {
    const requestsRef = useRef<HTMLDivElement>(null);
    const width = useResize(requestsRef);

    const blockBasis = 10;
    const blockGap = 4;
    const maxBlocks =
        width > 0 ? Math.floor(width / (blockBasis + blockGap)) : 0;
    const visibleLogs = maxBlocks > 0 ? logs.slice(-maxBlocks) : [];

    return (
        <div className={styles.domainSection}>
            <h4>{domain}</h4>
            <div className={styles.requests} ref={requestsRef}>
                {visibleLogs.map((log, index) => (
                    <Tippy
                        key={`${log.created_at}-${index}`}
                        content={
                            <div>
                                <div className={styles.tooltipHeader}>
                                    {new Date(log.created_at).toLocaleDateString("ru-RU", {
                                        weekday: "long",
                                        day: "numeric",
                                        month: "long",
                                    })} в {new Date(log.created_at).toLocaleTimeString("ru-RU", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                </div>
                                <div className={styles.tooltipBody}>
                                    <div>
                                        Среднее время:{" "}
                                        {log.total_time_avg.toFixed(2)}мс
                                    </div>
                                    {log.results.filter(
                                        (r) =>
                                            r.status_code !== 200 ||
                                            r.total_time === null ||
                                            (r.total_time && r.total_time > 1500) ||
                                            Number(r.status_code) === 429
                                    ).length > 0 ? (
                                        <div>
                                            <div>Проблемные города:</div>
                                            {log.results
                                                .filter(
                                                    (r) =>
                                                        r.status_code !== 200 ||
                                                        r.total_time === null ||
                                                        (r.total_time &&
                                                            r.total_time > 1500) ||
                                                        Number(r.status_code) ===
                                                            429
                                                )
                                                .map((r, i) => (
                                                    <div key={i}>
                                                        -{" "}
                                                        <ReactCountryFlag
                                                            countryCode={
                                                                r.country || "US"
                                                            }
                                                            svg
                                                            style={{
                                                                marginRight: "5px",
                                                            }}
                                                        />{" "}
                                                        {cityTranslations[r.city] ||
                                                            r.city ||
                                                            "Неизвестный город"}
                                                        :{" "}
                                                        {r.status_code !== null
                                                            ? `Статус: ${r.status_code}`
                                                            : "неизвестный статус"}
                                                        {r.total_time !== null
                                                            ? `; Время: ${r.total_time}мс`
                                                            : ""}
                                                    </div>
                                                ))}
                                        </div>
                                    ) : (
                                        <div>Все города в норме</div>
                                    )}
                                </div>
                            </div>
                        }
                    >
                        <div
                            className={`${styles.requestBlock} ${getStatusColor(log)}`}
                        />
                    </Tippy>
                ))}
            </div>
        </div>
    );
};

export default DomainStatus;
