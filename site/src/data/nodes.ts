import {
    api,
    type BucketStatus,
    type HealthLevel,
    type NodeItem,
    type PingLog,
    type TimeQuery,
    withCreatedAt,
} from "../api.ts";
import { type Dictionary, t } from "../i18n.ts";
import { getCityLabel, getCountryName } from "./constants.ts";

const LOCAL_CITY = "yummystatus";

const RU_FAIL_PROBES = 2;

const LEVEL_LABEL = {
    stable: "overviewStatusUp",
    warning: "healthWarning",
    critical: "healthCritical",
} as const satisfies Record<HealthLevel, keyof Dictionary>;

export type NodeView = ReturnType<typeof toNodeView>;

export const isLocal = ({ city }: PingLog) => city === LOCAL_CITY;

export const isLost = (log: PingLog) => lossOf(log) >= 100;

export const hasLoss = (log: PingLog) => lossOf(log) > 0;

export const getProbeLabel = (city: string) =>
    city === LOCAL_CITY ? getCountryName("DE") : getCityLabel(city);

export const levelLabel = (level: HealthLevel) => t(LEVEL_LABEL[level]);

export const nodeLabel = (level: HealthLevel) =>
    level === "critical" ? t("nodeEventDown") : levelLabel(level);

export const aggregateLevel = (levels: HealthLevel[]): HealthLevel =>
    levels.every((level) => level === "stable") ? "stable" : "warning";

export const levelSegments = (levels: HealthLevel[]) =>
    (
        [
            ["stable", "var(--color-green)", "overviewStatusUp"],
            ["warning", "var(--color-yellow)", "healthWarning"],
            ["critical", "var(--color-red)", "nodeEventDown"],
        ] as const
    ).map(([level, color, label]) => ({
        key: level,
        color,
        label: t(label),
        count: levels.filter((item) => item === level).length,
    }));

export const groupBy = <T>(items: T[], getKey: (item: T) => string) => {
    const groups: Record<string, T[]> = {};
    for (const item of items) {
        const key = getKey(item);
        groups[key] ??= [];
        groups[key].push(item);
    }
    return groups;
};

export const mean = (values: (number | null)[]) => {
    const valid = values.filter((value) => value !== null);
    return valid.length
        ? valid.reduce((sum, value) => sum + value, 0) / valid.length
        : null;
};

export const meanRtt = (logs: PingLog[]) =>
    mean(logs.map(({ rtt_avg }) => rtt_avg));

export const averageByTime = (logs: PingLog[]) =>
    Object.values(groupBy(logs, ({ created_at }) => created_at)).map(
        (rows) => ({
            created_at: rows[0].created_at,
            rtt_avg: meanRtt(rows),
            rtt_min: mean(rows.map(({ rtt_min }) => rtt_min)),
            rtt_max: mean(rows.map(({ rtt_max }) => rtt_max)),
            packet_loss: mean(rows.map(lossOf)),
        })
    );

export const nodeBuckets = (allLogs: PingLog[], count: number) => {
    const logs = allLogs.filter((log) => !isLocal(log));
    const start = Date.parse(logs[0]?.created_at);
    const width =
        (Date.parse(logs[logs.length - 1]?.created_at) - start) / count || 1;
    return Object.entries(
        groupBy(logs, ({ created_at }) =>
            String(
                Math.min(
                    count - 1,
                    Math.floor((Date.parse(created_at) - start) / width)
                )
            )
        )
    ).map(([index, rows]) => {
        const lossy = rows.filter(hasLoss).length;
        const status: BucketStatus =
            lossy === 0
                ? "UP"
                : lossy === rows.length
                  ? "DOWN"
                  : "DEGRADED_MEDIUM";
        return {
            time: start + Number(index) * width,
            status,
            rtt: meanRtt(rows),
            problems: Object.values(
                groupBy(
                    rows.filter(hasLoss),
                    ({ city, network }) => `${city ?? ""}|${network ?? ""}`
                )
            ).map((probeRows) => ({
                country: probeRows[0].country,
                city: probeRows[0].city,
                network: probeRows[0].network,
                loss: mean(probeRows.map(lossOf)) ?? 100,
                rtt: meanRtt(probeRows),
            })),
        };
    });
};

const toNodeView = (node: NodeItem, logs: PingLog[]) => ({
    ...node,
    logs,
    name: getCountryName(node.country) + (node.order ? ` #${node.order}` : ""),
    level: nodeLevel(node, logs),
    ms: meanRtt(latestCycle(logs.filter((log) => !isLocal(log)))),
});

export async function loadNodes(query: TimeQuery) {
    const [nodesResponse, logsResponse] = await Promise.all([
        api.nodes.$get(),
        api["ping-logs"].$get({ query: { ...query, kind: "node" } }),
    ]);
    if (!nodesResponse.ok || !logsResponse.ok) {
        throw new Error(
            `HTTP error! status: ${nodesResponse.ok ? logsResponse.status : nodesResponse.status}`
        );
    }
    const { items } = await nodesResponse.json();
    const logs = groupBy(
        withCreatedAt(await logsResponse.json()),
        ({ domain }) => domain ?? ""
    );
    return items.map((node) => toNodeView(node, logs[node.key] ?? []));
}

function lossOf({ packet_loss }: PingLog) {
    return packet_loss ?? 100;
}

function latestCycle(logs: PingLog[]) {
    const last = logs[logs.length - 1]?.created_at;
    return logs.filter(({ created_at }) => created_at === last);
}

function nodeLevel({ inDns }: NodeItem, logs: PingLog[]): HealthLevel {
    const cycle = latestCycle(logs.filter((log) => !isLocal(log)));
    const failed =
        cycle.length > 0 &&
        cycle.filter(isLost).length >= Math.min(cycle.length, RU_FAIL_PROBES);
    if (inDns === false || failed) return "critical";
    return cycle.some(hasLoss) ? "warning" : "stable";
}
