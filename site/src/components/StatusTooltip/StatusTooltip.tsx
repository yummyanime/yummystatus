import ReactCountryFlag from "react-country-flag";
import { useLanguage } from "../../i18n.ts";
import styles from "../Status/Status.module.scss";

const StatusTooltip = ({
    time,
    summary,
    lines,
}: {
    time: string | number;
    summary: string | null;
    lines: {
        key: string;
        country: string | null;
        label: string;
        result: string;
        value: string | null;
    }[];
}) => {
    const { t, tf, language } = useLanguage();

    return (
        <div>
            <div className={styles.tooltipHeader}>
                {tf("chartDateTime", {
                    date: new Date(time).toLocaleDateString(language, {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                    }),
                    time: new Date(time).toLocaleTimeString(language, {
                        hour: "2-digit",
                        minute: "2-digit",
                    }),
                })}
            </div>
            <div className={styles.tooltipBody}>
                {summary !== null && <div>{summary}</div>}
                {lines.length > 0 ? (
                    <div>
                        <div>{t("domainProblemCities")}</div>
                        {lines.map(({ key, country, label, result, value }) => (
                            <div key={key}>
                                -{" "}
                                <ReactCountryFlag
                                    countryCode={country || "US"}
                                    svg
                                    style={{ marginRight: "5px" }}
                                />{" "}
                                {label}: {result}
                                {value !== null
                                    ? `; ${tf("domainTime", { value })}`
                                    : ""}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div>{t("domainAllNormal")}</div>
                )}
            </div>
        </div>
    );
};

export default StatusTooltip;
