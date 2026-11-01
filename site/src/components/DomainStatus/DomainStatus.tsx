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
import ReactCountryFlag from "react-country-flag";
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
    const { t, tf, language } = useLanguage();
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
                            <div>
                                <div className={styles.tooltipHeader}>
                                    {tf("chartDateTime", {
                                        date: new Date(bucket.time).toLocaleDateString(language, {
                                            weekday: "long",
                                            day: "numeric",
                                            month: "long",
                                        }),
                                        time: new Date(bucket.time).toLocaleTimeString(language, {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        }),
                                    })}
                                </div>
                                <div className={styles.tooltipBody}>
                                    <div>
                                        {tf("domainAvgTime", {
                                            value: `${bucket.totalTimeAvg.toFixed(2)} ${t("unitMs")}`,
                                        })}
                                    </div>
                                    {bucket.problems.length > 0 ? (
                                        <div>
                                            <div>{t("domainProblemCities")}</div>
                                            {bucket.problems.map((r, i) => (
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
                                                    {r.city
                                                        ? getCityLabel(r.city)
                                                        : t("domainUnknownCity")}
                                                    :{" "}
                                                    {r.statusCode !== null
                                                        ? tf("domainStatusCode", {
                                                              code: r.statusCode,
                                                          })
                                                        : t("domainUnknownStatus")}
                                                    {r.totalTime !== null
                                                        ? `; ${tf("domainTime", { value: `${r.totalTime} ${t("unitMs")}` })}`
                                                        : ""}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div>{t("domainAllNormal")}</div>
                                    )}
                                </div>
                            </div>
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
