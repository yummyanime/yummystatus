import { NavLink } from "react-router-dom";
import type { PingLog } from "../../api.ts";
import { getCountryName } from "../../data/constants.ts";
import { groupBy, type NodeView } from "../../data/nodes.ts";
import { useLanguage } from "../../i18n.ts";
import Button from "../Button/Button.tsx";
import Chart from "../Chart/Chart.tsx";
import { nodePingPreset } from "../Chart/chartPresets.ts";
import styles from "../CountryChart/CountryChartItem/CountryChartItem.module.scss";
import { CountryItemHeader } from "../CountryChart/CountryChartItem/CountryChartItem.tsx";
import Flag from "../Flag/Flag.tsx";

const NodeChart = ({
    logs,
    timeRange,
    header,
}: {
    logs: PingLog[];
    timeRange: string;
    header:
        | { node: Pick<NodeView, "key" | "country" | "name"> }
        | { country: string; intervalMinutes: number };
}) => {
    const { t } = useLanguage();
    const cityLogs = groupBy(logs, ({ city }) => city ?? "");

    return (
        <div className={styles.chartCard}>
            <div className={styles.cardHeader}>
                {"node" in header ? (
                    <>
                        <div className={styles.countryIdentifier}>
                            <Flag country={header.node.country} />
                            <p className={styles.itemName}>
                                {header.node.name}
                            </p>
                        </div>
                        <NavLink to={`/vpn/${header.node.key}`}>
                            <Button>{t("commonMore")}</Button>
                        </NavLink>
                    </>
                ) : (
                    <CountryItemHeader
                        countryCode={header.country}
                        countryName={getCountryName(header.country)}
                        intervalMinutes={header.intervalMinutes}
                    />
                )}
            </div>
            <div className={styles.chartContainer}>
                <Chart
                    cityLogs={cityLogs}
                    cities={Object.keys(cityLogs).sort()}
                    timeRange={timeRange}
                    {...nodePingPreset}
                />
            </div>
        </div>
    );
};

export default NodeChart;
