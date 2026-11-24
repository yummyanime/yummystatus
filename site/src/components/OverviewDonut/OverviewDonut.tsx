import type { HealthLevel } from "../../api.ts";
import styles from "./OverviewDonut.module.scss";

type Segment = { key: string; color: string; label: string; count: number };

const OverviewDonut = ({
    level,
    badge,
    caption,
    segments,
}: {
    level: HealthLevel;
    badge: string;
    caption: string;
    segments: Segment[];
}) => {
    const total = segments.reduce((sum, { count }) => sum + count, 0);

    let cumulative = 0;
    const arcs = segments
        .filter(({ count }) => count > 0)
        .map((segment) => {
            const pct = (segment.count / total) * 100;
            const arc = { ...segment, offset: 25 - cumulative, pct };
            cumulative += pct;
            return arc;
        });

    return (
        <div className={styles.container}>
            <div className={`${styles.statusBadge} ${styles[level]}`}>
                {badge}
            </div>

            <div className={styles.chartArea}>
                <svg
                    className={styles.donut}
                    viewBox="-2 -2 40 40"
                    role="img"
                    aria-label={badge}
                >
                    <circle
                        className={styles.track}
                        cx="18"
                        cy="18"
                        r="15.9155"
                        fill="none"
                    />
                    {arcs.map((arc) => (
                        <circle
                            key={arc.key}
                            cx="18"
                            cy="18"
                            r="15.9155"
                            fill="none"
                            strokeDasharray={`${arc.pct} ${100 - arc.pct}`}
                            strokeDashoffset={arc.offset}
                            style={{ stroke: arc.color }}
                        >
                            <title>{`${arc.label}: ${arc.count}`}</title>
                        </circle>
                    ))}
                    <text className={styles.donutTotal} x="18" y="16">
                        {total}
                    </text>
                    <text className={styles.donutCaption} x="18" y="23">
                        {caption}
                    </text>
                </svg>
            </div>
        </div>
    );
};

export default OverviewDonut;
