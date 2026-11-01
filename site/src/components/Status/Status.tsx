import { memo, useEffect, useRef } from "react";
import type { HealthReport } from "../../api.ts";
import { domains } from "../../data/constants.ts";
import { useLanguage } from "../../i18n.ts";
import DomainStatus from "../DomainStatus/DomainStatus.tsx";
import StatusPlug from "./_plug/StatusPlug.tsx";
import styles from "./Status.module.scss";

interface StatusProps {
    domain?: string;
    health: HealthReport | null;
    loading: boolean;
}

const Status: React.FC<StatusProps> = ({ domain, health, loading }) => {
    const { t } = useLanguage();
    const rows = useRef<Map<string, HTMLDivElement>>(new Map());
    const leftBtn = useRef<HTMLButtonElement>(null);
    const rightBtn = useRef<HTMLButtonElement>(null);
    const syncing = useRef(false);
    const buttonScroll = useRef(false);
    const buttonTimer = useRef(0);

    const updateEdges = () => {
        let left = false;
        let right = false;
        rows.current.forEach((el) => {
            if (el.scrollLeft > 1) left = true;
            if (el.scrollLeft < el.scrollWidth - el.clientWidth - 1) right = true;
        });
        leftBtn.current?.classList.toggle(styles.canScroll, left);
        rightBtn.current?.classList.toggle(styles.canScroll, right);
    };

    const registerRow = (domainName: string, el: HTMLDivElement | null) => {
        if (el) rows.current.set(domainName, el);
        else rows.current.delete(domainName);
    };

    const syncScroll = (source: HTMLDivElement) => {
        updateEdges();
        if (buttonScroll.current || syncing.current) return;
        syncing.current = true;
        rows.current.forEach((el) => {
            if (el !== source) el.scrollLeft = source.scrollLeft;
        });
        requestAnimationFrame(() => (syncing.current = false));
    };

    const scrollAll = (direction: number) => {
        buttonScroll.current = true;
        rows.current.forEach((el) =>
            el.scrollBy({
                left: direction * el.clientWidth * 0.8,
                behavior: "smooth",
            })
        );
        window.clearTimeout(buttonTimer.current);
        buttonTimer.current = window.setTimeout(() => {
            buttonScroll.current = false;
        }, 500);
    };

    useEffect(() => {
        window.addEventListener("resize", updateEdges);
        return () => window.removeEventListener("resize", updateEdges);
    }, []);

    useEffect(() => {
        updateEdges();
    }, [health]);

    if (loading) return <StatusPlug domain={domain} />;

    return (
        <div>
            <div className={styles.statusContainer}>
                <button
                    ref={leftBtn}
                    type="button"
                    className={`${styles.scrollBtn} ${styles.scrollLeft}`}
                    onClick={() => scrollAll(-1)}
                    aria-label={t("statusScrollLeft")}
                >
                    <span>‹</span>
                </button>
                {domains.map(
                    (d) =>
                        (!domain || domain === d) && (
                            <DomainStatus
                                key={d}
                                domain={d}
                                report={health?.domains.find((entry) => entry.domain === d)}
                                registerRow={registerRow}
                                onScroll={syncScroll}
                            />
                        )
                )}
                <button
                    ref={rightBtn}
                    type="button"
                    className={`${styles.scrollBtn} ${styles.scrollRight}`}
                    onClick={() => scrollAll(1)}
                    aria-label={t("statusScrollRight")}
                >
                    <span>›</span>
                </button>
            </div>
        </div>
    );
};

export default memo(Status);