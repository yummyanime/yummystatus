import type { ComponentProps } from "react";
import type { PingLog } from "../../api.ts";
import { getCountryName } from "../../data/constants.ts";
import { isLocal, meanRtt } from "../../data/nodes.ts";
import { useLanguage } from "../../i18n.ts";
import OverviewPanel from "../OverviewPanel/OverviewPanel.tsx";
import PingAverageChart from "../PingAverageChart/PingAverageChart.tsx";

const NodeOverview = ({
    logs,
    donut,
    timeRange,
}: {
    logs: PingLog[];
    donut: ComponentProps<typeof OverviewPanel>["donut"];
    timeRange: string;
}) => {
    const { t } = useLanguage();

    return (
        <OverviewPanel
            donut={donut}
            tabs={[
                {
                    country: "RU",
                    rows: logs.filter((log) => !isLocal(log)),
                    avgLabel: t("overviewAvgPingRu"),
                },
                {
                    country: "DE",
                    rows: logs.filter(isLocal),
                    avgLabel: t("overviewAvgPingDe"),
                },
            ].map(({ country, rows, avgLabel }) => ({
                label: getCountryName(country),
                avgLabel,
                avg: meanRtt(rows),
                chart: <PingAverageChart logs={rows} timeRange={timeRange} />,
            }))}
        />
    );
};

export default NodeOverview;
