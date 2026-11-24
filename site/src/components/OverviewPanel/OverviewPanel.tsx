import { type ComponentProps, type ReactNode, useState } from "react";
import { useLanguage } from "../../i18n.ts";
import Button from "../Button/Button.tsx";
import LazyMount from "../LazyMount/LazyMount.tsx";
import styles from "../Overview/_content/OverviewChart/OverviewChart.module.scss";
import overview from "../Overview/Overview.module.scss";
import OverviewDonut from "../OverviewDonut/OverviewDonut.tsx";

const OverviewPanel = ({
    donut,
    tabs,
}: {
    donut: ComponentProps<typeof OverviewDonut>;
    tabs: {
        label: string;
        avgLabel: string;
        avg: number | null;
        chart: ReactNode;
    }[];
}) => {
    const { t } = useLanguage();
    const [active, setActive] = useState(0);
    const { avgLabel, avg, chart } = tabs[active];

    return (
        <div className={overview.overviewContainer}>
            <div className={overview.leftPart}>
                <OverviewDonut {...donut} />
            </div>
            <div className={overview.rightPart}>
                <div className={styles.container}>
                    <div className={styles.tabsWrapper}>
                        {tabs.map(({ label }, index) => (
                            <Button
                                key={label}
                                active={index === active}
                                onClick={() => setActive(index)}
                            >
                                {label}
                            </Button>
                        ))}
                    </div>
                    <div className={styles.chartWrapper}>
                        <LazyMount key={active} fill>
                            {chart}
                        </LazyMount>
                    </div>
                    <div className={styles.avgWrapper}>
                        <span className={styles.avgLabel}>{avgLabel}</span>
                        <span className={styles.avgValue}>
                            {avg === null ? "—" : avg.toFixed(0)}
                            <small>{t("unitMs")}</small>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OverviewPanel;
