import { api, type TimeQuery, withCreatedAt } from "../../api.ts";
import { useDashboardSettings } from "../../context/DashboardSettingsContext.tsx";
import {
    ALLOWED_COUNTRIES,
    getDomainGroups,
    getDomainLabel,
    HEALTH_LABEL,
} from "../../data/constants.ts";
import {
    aggregateLevel,
    isLocal,
    levelLabel,
    levelSegments,
    loadNodes,
    mean,
    meanRtt,
    nodeBuckets,
    nodeLabel,
} from "../../data/nodes.ts";
import { useDashboardData } from "../../hooks/useDashboardData.ts";
import { useLanguage } from "../../i18n.ts";
import Chart from "../Chart/Chart.tsx";
import { httpRequestTimePreset } from "../Chart/chartPresets.ts";
import DashboardFrame from "../DashboardFrame/DashboardFrame.tsx";
import Group from "../Group/Group.tsx";
import OverviewPlug from "../Overview/_plug/OverviewPlug.tsx";
import OverviewPanel from "../OverviewPanel/OverviewPanel.tsx";
import PingAverageChart from "../PingAverageChart/PingAverageChart.tsx";
import TilePlug from "../Tile/_plug/TilePlug.tsx";
import Tile from "../Tile/Tile.tsx";

const TILE_BLOCKS = 36;
const AVERAGE_SERIES = "average";

const HomeDashboard = () => {
    const { t } = useLanguage();
    const { effectiveTimeRange } = useDashboardSettings();
    const data = useDashboardData(loadHome);
    const groups = getDomainGroups();

    if (!data) {
        return (
            <DashboardFrame>
                <OverviewPlug />
                {[t("homeSites"), t("navVpn")].map((title, index) => (
                    <Group
                        key={title}
                        title={title}
                        grid="tiles"
                        divider={!index}
                    >
                        {groups
                            .flatMap(({ domains }) => domains)
                            .map(({ value }) => (
                                <TilePlug key={value} />
                            ))}
                    </Group>
                ))}
            </DashboardFrame>
        );
    }

    const { health, httpLogs, nodes } = data;
    const sites = groups.flatMap(({ title, domains }) =>
        domains.map(({ value }) => ({
            domain: value,
            group: title,
            report: health.domains.find(({ domain }) => domain === value),
        }))
    );
    const levels = [
        ...sites.map(({ report }) => report?.health ?? "stable"),
        ...nodes.map(({ level }) => level),
    ];
    const level = aggregateLevel(levels);
    const ruLogs = nodes.flatMap(({ logs }) =>
        logs.filter((log) => !isLocal(log))
    );

    return (
        <DashboardFrame>
            <OverviewPanel
                donut={{
                    level,
                    badge: t(HEALTH_LABEL[level]),
                    caption: t("homeResources"),
                    segments: levelSegments(levels),
                }}
                tabs={[
                    {
                        label: t("homeSites"),
                        avgLabel: t("overviewAvgLoad"),
                        avg: mean(httpLogs.map(({ total_time }) => total_time)),
                        chart: (
                            <Chart
                                cityLogs={{ [AVERAGE_SERIES]: httpLogs }}
                                cities={[AVERAGE_SERIES]}
                                timeRange={effectiveTimeRange}
                                hideLegend
                                {...httpRequestTimePreset}
                            />
                        ),
                    },
                    {
                        label: t("navVpn"),
                        avgLabel: t("overviewAvgPing"),
                        avg: meanRtt(ruLogs),
                        chart: (
                            <PingAverageChart
                                logs={ruLogs}
                                timeRange={effectiveTimeRange}
                            />
                        ),
                    },
                ]}
            />
            <Group title={t("homeSites")} grid="tiles" divider>
                {sites.map(({ domain, group, report }) => {
                    const buckets = report?.buckets ?? [];
                    const siteLevel = report?.health ?? "stable";
                    return (
                        <Tile
                            key={domain}
                            to="/sites"
                            level={siteLevel}
                            name={getDomainLabel(domain)}
                            ms={buckets.at(-1)?.totalTimeAvg ?? null}
                            buckets={buckets
                                .slice(-TILE_BLOCKS)
                                .map(({ status }) => status)}
                            group={group}
                            label={levelLabel(siteLevel)}
                        />
                    );
                })}
            </Group>
            <Group title={t("navVpn")} grid="tiles" divider={false}>
                {nodes.map((node) => (
                    <Tile
                        key={node.key}
                        to={`/vpn/${node.key}`}
                        level={node.level}
                        country={node.country}
                        name={node.name}
                        ms={node.ms}
                        buckets={nodeBuckets(node.logs, TILE_BLOCKS)}
                        label={nodeLabel(node.level)}
                    />
                ))}
            </Group>
        </DashboardFrame>
    );
};

export default HomeDashboard;

async function loadHome(query: TimeQuery) {
    const [healthResponse, logsResponse, nodes] = await Promise.all([
        api.health.$get({
            query: { ...query, countries: ALLOWED_COUNTRIES.join(",") },
        }),
        api["http-logs"].$get({ query }),
        loadNodes(query),
    ]);
    if (!healthResponse.ok || !logsResponse.ok) {
        throw new Error(
            `HTTP error! status: ${healthResponse.ok ? logsResponse.status : healthResponse.status}`
        );
    }
    const logs = await logsResponse.json();
    return {
        nodes,
        health: await healthResponse.json(),
        httpLogs: Array.isArray(logs)
            ? withCreatedAt(logs).filter(({ country }) =>
                  ALLOWED_COUNTRIES.includes(country ?? "")
              )
            : [],
    };
}
