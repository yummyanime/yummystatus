import { format } from "date-fns";
import type { NodeEvent } from "../../api.ts";
import { formatFailedProbe } from "../../data/nodes.ts";
import { dateLocale, useLanguage } from "../../i18n.ts";
import styles from "../ReportList/ReportList.module.scss";

const EVENT_LABEL = {
    dns_removed: "nodeEventDnsRemoved",
    dns_restored: "nodeEventDnsRestored",
    group_down: "nodeEventGroupDown",
    down: "nodeEventDown",
    up: "nodeEventUp",
} as const;

const NodeEvents = ({ events }: { events: NodeEvent[] }) => {
    const { language, t, tf } = useLanguage();

    return (
        <div className={styles.card}>
            <span className={styles.title}>{t("nodeEventsTitle")}</span>
            {events.length === 0 ? (
                <div className={styles.empty}>{t("nodeEventsNone")}</div>
            ) : (
                <ul className={styles.list}>
                    {events.map(({ id, type, details, createdAt }) => (
                        <li key={id} className={styles.item}>
                            <span className={styles.date}>
                                {format(new Date(createdAt), "d MMM, HH:mm", {
                                    locale: dateLocale(language),
                                })}
                            </span>
                            <div className={styles.reasons}>
                                <span className={styles.reason}>
                                    {t(EVENT_LABEL[type])}
                                </span>
                                {details.failed.length > 0 && (
                                    <span className={styles.reason}>
                                        {tf("nodeEventFailed", {
                                            cities: details.failed
                                                .map(formatFailedProbe)
                                                .join(", "),
                                        })}
                                    </span>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default NodeEvents;
