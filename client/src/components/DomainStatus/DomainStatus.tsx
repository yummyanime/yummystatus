import { useRef } from "react";
import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css";
import useResize from "../../hooks/useResize.tsx";
import styles from "../Status/Status.module.scss";
import {
    cityTranslations,
    getBucketColor,
    getDomainHealth,
    getDomainLabel,
    isRelevantStatus,
    SLOW_RESPONSE_MS,
} from "../../data/constants.ts";
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

type LogResult = GroupedLog["results"][number];

const isProblematicResult = (r: LogResult): boolean =>
    isRelevantStatus(r.status_code) &&
    (r.status_code !== 200 ||
        r.total_time === null ||
        (r.total_time !== null && r.total_time > SLOW_RESPONSE_MS));

const getStatusColor = (log: GroupedLog) => styles[getBucketColor(log.results)];

const DomainStatus: React.FC<DomainStatusProps> = ({ domain, logs }) => {
    const requestsRef = useRef<HTMLDivElement>(null);
    const width = useResize(requestsRef);

    const blockBasis = 10;
    const blockGap = 4;
    const maxBlocks =
        width > 0 ? Math.floor(width / (blockBasis + blockGap)) : 0;
    const visibleLogs = maxBlocks > 0 ? logs.slice(-maxBlocks) : [];

    const health = getDomainHealth(
        logs.flatMap((log) =>
            log.results.map((r) => ({
                created_at: log.created_at,
                status_code: r.status_code ?? undefined,
                total_time: r.total_time ?? undefined,
            }))
        )
    );

    return (
        <div className={styles.domainSection}>
            <div className={styles.domainTitle}>
                <span className={`${styles.statusCircle} ${styles[health]}`} />
                <h4>{getDomainLabel(domain)}</h4>
            </div>
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
                                    {log.results.filter(isProblematicResult).length > 0 ? (
                                        <div>
                                            <div>Проблемные города:</div>
                                            {log.results
                                                .filter(isProblematicResult)
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
