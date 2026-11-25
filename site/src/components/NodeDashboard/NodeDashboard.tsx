import { Navigate } from "react-router-dom";
import { api, type TimeQuery } from "../../api.ts";
import { useDashboardSettings } from "../../context/DashboardSettingsContext.tsx";
import { HEALTH_LABEL } from "../../data/constants.ts";
import {
    hasLoss,
    isLocal,
    isLost,
    loadNodes,
    nodeLabel,
} from "../../data/nodes.ts";
import { useDashboardData } from "../../hooks/useDashboardData.ts";
import { useLanguage } from "../../i18n.ts";
import ChartPlug from "../Chart/_plug/ChartPlug.tsx";
import DashboardFrame from "../DashboardFrame/DashboardFrame.tsx";
import Group from "../Group/Group.tsx";
import LazyMount from "../LazyMount/LazyMount.tsx";
import NodeChart from "../NodeChart/NodeChart.tsx";
import NodeEvents from "../NodeEvents/NodeEvents.tsx";
import NodeOverview from "../NodeOverview/NodeOverview.tsx";
import NodeStatus from "../NodeStatus/NodeStatus.tsx";
import OverviewPlug from "../Overview/_plug/OverviewPlug.tsx";

const NodeDashboard = ({ nodeKey }: { nodeKey: string }) => {
    const { t } = useLanguage();
    const { effectiveTimeRange } = useDashboardSettings();
    const data = useDashboardData((query) => loadNode(query, nodeKey));

    if (!data) {
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

    const node = data.nodes.find(({ key }) => key === nodeKey);
    if (!node) return <Navigate to="/vpn" replace />;

    const lost = node.logs.filter(isLost).length;
    const partial = node.logs.filter(
        (log) => hasLoss(log) && !isLost(log)
    ).length;

    return (
        <DashboardFrame>
            <NodeOverview
                logs={node.logs}
                timeRange={effectiveTimeRange}
                donut={{
                    level: node.level,
                    badge:
                        node.level === "critical"
                            ? nodeLabel(node.level)
                            : t(HEALTH_LABEL[node.level]),
                    caption: t("overviewSamples"),
                    segments: [
                        {
                            key: "stable",
                            color: "var(--color-green)",
                            label: t("overviewStatusUp"),
                            count: node.logs.length - lost - partial,
                        },
                        {
                            key: "warning",
                            color: "var(--color-yellow)",
                            label: t("nodePartialLoss"),
                            count: partial,
                        },
                        {
                            key: "critical",
                            color: "var(--color-red)",
                            label: t("nodeNoReply"),
                            count: lost,
                        },
                    ],
                }}
            />
            <NodeStatus nodes={[node]} />
            <Group grid="charts" divider>
                {[
                    {
                        country: "DE",
                        intervalMinutes: 1,
                        logs: node.logs.filter(isLocal),
                    },
                    {
                        country: "RU",
                        intervalMinutes: 10,
                        logs: node.logs.filter((log) => !isLocal(log)),
                    },
                ].map(({ logs, ...header }) => (
                    <LazyMount key={header.country} placeholder={<ChartPlug />}>
                        <NodeChart
                            logs={logs}
                            timeRange={effectiveTimeRange}
                            header={header}
                        />
                    </LazyMount>
                ))}
            </Group>
            <NodeEvents events={data.events} />
        </DashboardFrame>
    );
};

export default NodeDashboard;

async function loadNode(query: TimeQuery, key: string) {
    const [nodes, eventsResponse] = await Promise.all([
        loadNodes(query),
        api["node-events"].$get({ query: { key, hours: "24" } }),
    ]);
    if (!eventsResponse.ok) {
        throw new Error(`HTTP error! status: ${eventsResponse.status}`);
    }
    return { nodes, events: (await eventsResponse.json()).items };
}
