import type { PingLog } from "../../api.ts";
import { averageByTime } from "../../data/nodes.ts";
import Chart from "../Chart/Chart.tsx";
import { pingPreset } from "../Chart/chartPresets.ts";

const AVERAGE_SERIES = "average";

const PingAverageChart = ({
    logs,
    timeRange,
}: {
    logs: PingLog[];
    timeRange: string;
}) => (
    <Chart
        cityLogs={{ [AVERAGE_SERIES]: averageByTime(logs) }}
        cities={[AVERAGE_SERIES]}
        timeRange={timeRange}
        hideLegend
        {...pingPreset}
    />
);

export default PingAverageChart;
