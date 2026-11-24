import { useDashboardSettings } from "../../context/DashboardSettingsContext.tsx";
import { getCountryName, HEALTH_LABEL } from "../../data/constants.ts";
import {
    aggregateLevel,
    groupBy,
    isLocal,
    levelSegments,
    loadNodes,
} from "../../data/nodes.ts";
import { useDashboardData } from "../../hooks/useDashboardData.ts";
import { useLanguage } from "../../i18n.ts";
import ChartPlug from "../Chart/_plug/ChartPlug.tsx";
import DashboardFrame from "../DashboardFrame/DashboardFrame.tsx";
import Group from "../Group/Group.tsx";
import LazyMount from "../LazyMount/LazyMount.tsx";
import NodeChart from "../NodeChart/NodeChart.tsx";
import NodeOverview from "../NodeOverview/NodeOverview.tsx";
import NodeStatus from "../NodeStatus/NodeStatus.tsx";
import OverviewPlug from "../Overview/_plug/OverviewPlug.tsx";

const VpnDashboard = () => {
    const { t } = useLanguage();
    const { effectiveTimeRange } = useDashboardSettings();
    const nodes = useDashboardData(loadNodes);

    if (!nodes) {
        return (
            <DashboardFrame>
                <OverviewPlug />
                <Group grid="charts" divider={false}>
                    <ChartPlug />
                    <ChartPlug />
                </Group>
            </DashboardFrame>
        );
    }

    const levels = nodes.map(({ level }) => level);
    const level = aggregateLevel(levels);
    const groups = [
        ...Object.values(
            groupBy(
                nodes.filter(({ order }) => order !== null),
                ({ group }) => group
            )
        ).map((members) => ({
            title: getCountryName(members[0].country),
            members,
        })),
        {
            title: t("vpnSingles"),
            members: nodes.filter(({ order }) => order === null),
        },
    ].filter(({ members }) => members.length > 0);

    return (
        <DashboardFrame>
            <NodeOverview
                logs={nodes.flatMap(({ logs }) => logs)}
                timeRange={effectiveTimeRange}
                donut={{
                    level,
                    badge: t(HEALTH_LABEL[level]),
                    caption: t("vpnNodes"),
                    segments: levelSegments(levels),
                }}
            />
            <NodeStatus nodes={nodes} />
            {groups.map(({ title, members }, index) => (
                <Group
                    key={title}
                    title={title}
                    grid="charts"
                    divider={index < groups.length - 1}
                >
                    {members.map((node) => (
                        <LazyMount key={node.key} placeholder={<ChartPlug />}>
                            <NodeChart
                                logs={node.logs.filter((log) => !isLocal(log))}
                                timeRange={effectiveTimeRange}
                                header={{ node }}
                            />
                        </LazyMount>
                    ))}
                </Group>
            ))}
        </DashboardFrame>
    );
};

export default VpnDashboard;
