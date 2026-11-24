import { useEffect, useRef, useState } from "react";
import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css";
import styles from "../Status/Status.module.scss";
import {
    BUCKET_CLASS,
    getCityLabel,
    getDomainLabel,
} from "../../data/constants.ts";
import type { DomainHealthReport } from "../../api.ts";
import StatusTooltip from "../StatusTooltip/StatusTooltip.tsx";
import { useLanguage } from "../../i18n.ts";

interface DomainStatusProps {
    domain: string;
    report?: DomainHealthReport;
    registerRow: (domain: string, el: HTMLDivElement | null) => void;
    onScroll: (el: HTMLDivElement) => void;
}

const DomainStatus: React.FC<DomainStatusProps> = ({
    domain,
    report,
    registerRow,
    onScroll,
}) => {
    const { t, tf } = useLanguage();
    const requestsRef = useRef<HTMLDivElement>(null);
    const [isBig, setIsBig] = useState(false);
    const buckets = report?.buckets ?? [];
    const health = report?.health ?? "stable";

    useEffect(() => {
        const el = requestsRef.current;
        if (el) el.scrollLeft = el.scrollWidth;
    }, [report]);

    useEffect(() => {
        const measure = () => {
            const el = requestsRef.current;
            if (el) setIsBig(el.scrollWidth <= el.clientWidth + 1);
        };
        measure();
        window.addEventListener("resize", measure);
        return () => window.removeEventListener("resize", measure);
    }, [report]);

    const setRef = (el: HTMLDivElement | null) => {
        requestsRef.current = el;
        registerRow(domain, el);
    };

    return (
        <div className={styles.domainSection}>
            <div className={styles.domainTitle}>
                <span className={`${styles.statusCircle} ${styles[health]}`} />
                <h4>{getDomainLabel(domain)}</h4>
            </div>
            <div
                className={`${styles.requests} ${isBig ? styles.big : ""}`}
                ref={setRef}
                onScroll={(e) => onScroll(e.currentTarget)}
            >
                {buckets.map((bucket, index) => (
                    <Tippy
                        key={`${bucket.time}-${index}`}
                        content={
                            <StatusTooltip
                                time={bucket.time}
                                summary={tf("domainAvgTime", {
                                    value: `${bucket.totalTimeAvg.toFixed(2)} ${t("unitMs")}`,
                                })}
                                lines={bucket.problems.map((r, i) => ({
                                    key: String(i),
                                    country: r.country,
                                    label: r.city
                                        ? getCityLabel(r.city)
                                        : t("domainUnknownCity"),
                                    result:
                                        r.statusCode !== null
                                            ? tf("domainStatusCode", {
                                                  code: r.statusCode,
                                              })
                                            : t("domainUnknownStatus"),
                                    value:
                                        r.totalTime !== null
                                            ? `${r.totalTime} ${t("unitMs")}`
                                            : null,
                                }))}
                            />
                        }
                    >
                        <div
                            className={`${styles.requestBlock} ${styles[BUCKET_CLASS[bucket.status]]}`}
                        />
                    </Tippy>
                ))}
            </div>
        </div>
    );
};

export default DomainStatus;
