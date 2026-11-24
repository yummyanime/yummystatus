import { Link } from "react-router-dom";
import type { BucketStatus, HealthLevel } from "../../api.ts";
import { useLanguage } from "../../i18n.ts";
import Flag from "../Flag/Flag.tsx";
import status from "../Status/Status.module.scss";
import StatusBlocks from "../StatusBlocks/StatusBlocks.tsx";
import styles from "./Tile.module.scss";

const Tile = ({
    to,
    level,
    country,
    name,
    ms,
    buckets,
    group,
    label,
}: {
    to: string;
    level: HealthLevel;
    country?: string;
    name: string;
    ms: number | null;
    buckets: BucketStatus[];
    group?: string;
    label: string;
}) => {
    const { t } = useLanguage();

    return (
        <Link to={to} className={`${styles.tile} ${status[level]}`}>
            <div className={styles.header}>
                {country ? (
                    <Flag country={country} />
                ) : (
                    <span
                        className={`${status.statusCircle} ${status[level]}`}
                    />
                )}
                <span className={styles.name}>{name}</span>
                <span className={styles.ms}>
                    {ms === null ? "—" : `${ms.toFixed(0)} ${t("unitMs")}`}
                </span>
            </div>
            <StatusBlocks buckets={buckets} />
            <div className={styles.footer}>
                <span>{group}</span>
                <span>{label}</span>
            </div>
        </Link>
    );
};

export default Tile;
