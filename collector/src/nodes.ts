import { connect } from "node:net";
import { nodeEvents, pingLogs } from "@yummystatus/db";
import { db } from "@yummystatus/db/client";
import { nodeKey } from "@yummystatus/db/node-key";
import { and, desc, eq, inArray, isNotNull, ne } from "drizzle-orm";
import { PROVISIONER_URL } from "../../domains.ts";
import {
    createMeasurementWithRetry,
    type Location,
    type MeasurementRequest,
    type MeasurementResponse,
    pollMeasurement,
    toNonNegativeNumberOrNull,
} from "./globalping.ts";
import type { PingProbeResult } from "./ping.ts";

type ProvisionerNode = { ip: string; groupSize: number };
type NodeEventInsert = typeof nodeEvents.$inferInsert;
type EventDetails = NodeEventInsert["details"];
type PingRow = typeof pingLogs.$inferInsert;

const LOCAL_CITY = "yummystatus";
const LOCAL_TIMEOUT = 5000;
const NODE_PORT = 443;
const CONTROL_TARGET = "ya.ru";
const PROBES_URL = "https://api.globalping.io/v1/probes";
const RU_TAG = "eyeball-network";
const RU_CITIES = 3;
const RU_INTERVAL = 10 * 60 * 1000;
const POLL_TIMEOUT = 60000;
const CYCLES = 3;
const RU_FAIL_PROBES = 2;
const DNS_ATTEMPTS = 3;
const DNS_BACKOFF = 1000;

let evaluation: Promise<void> = Promise.resolve();

export async function localNodeCheck(): Promise<void> {
    const nodes = await fetchNodes();
    if (!nodes) return;
    const createdAt = new Date();
    console.log(
        `--- Starting local node check at ${createdAt.toISOString()} for ${nodes.length} nodes ---`
    );
    const rows = await Promise.all(
        nodes.map(async ({ ip }): Promise<PingRow> => {
            const ms = await tcpConnectTime(ip);
            console.log(
                ms === null
                    ? `[FAILURE] Local TCP check for ${ip}`
                    : `[SUCCESS] Local TCP check for ${ip}: ${ms}ms`
            );
            return {
                kind: "node",
                domain: nodeKey(ip),
                country: "DE",
                city: LOCAL_CITY,
                probeId: "local",
                asn: null,
                network: null,
                rttMin: ms,
                rttAvg: ms,
                rttMax: ms,
                packetLoss: ms === null ? 100 : 0,
                createdAt,
            };
        })
    );
    if (rows.length) await db.insert(pingLogs).values(rows);
    await evaluateNodes(nodes);
}

export async function ruNodeCheck(): Promise<void> {
    const apiKey = process.env.GLOBALPING_API_KEY7;
    if (!apiKey) {
        console.error("GLOBALPING_API_KEY7 is not set for node checks.");
        return;
    }
    const nodes = await fetchNodes();
    if (!nodes) return;
    const createdAt = new Date();
    console.log(
        `--- Starting RU node check at ${createdAt.toISOString()} for ${nodes.length} nodes ---`
    );

    const controlId = await createControl(apiKey);
    if (!controlId) return;

    for (const { ip } of nodes) {
        try {
            const measurement = await runPing(ip, controlId, apiKey);
            if (!measurement) continue;
            const rows = measurement.results.map(
                ({ probe, result }): PingRow => ({
                    kind: "node",
                    domain: nodeKey(ip),
                    country: probe.country,
                    city: probe.city,
                    asn: probe.asn,
                    network: probe.network,
                    probeId: "globalping",
                    rttMin:
                        result.status === "finished"
                            ? toNonNegativeNumberOrNull(result.stats.min)
                            : null,
                    rttAvg:
                        result.status === "finished"
                            ? toNonNegativeNumberOrNull(result.stats.avg)
                            : null,
                    rttMax:
                        result.status === "finished"
                            ? toNonNegativeNumberOrNull(result.stats.max)
                            : null,
                    packetLoss: lossOf(result),
                    createdAt,
                })
            );
            if (rows.length) await db.insert(pingLogs).values(rows);
            console.log(
                `[NODE] RU check for ${ip}: ${rows.filter((row) => row.packetLoss === 100).length}/${rows.length} probes failed`
            );
        } catch (err) {
            console.error(
                `Failed RU node measurement for ${ip}:`,
                err instanceof Error ? err.message : err
            );
        }
    }
    await evaluateNodes(nodes);
}

async function fetchNodes(): Promise<ProvisionerNode[] | null> {
    try {
        const response = await fetch(`${PROVISIONER_URL}/nodes`, {
            headers: provisionerHeaders(),
            signal: AbortSignal.timeout(10000),
        });
        if (!response.ok) {
            throw new Error(`provisioner responded ${response.status}`);
        }
        const { items } = (await response.json()) as {
            items: ProvisionerNode[];
        };
        return items;
    } catch (err) {
        console.error(
            "Failed to fetch nodes, skipping cycle:",
            err instanceof Error ? err.message : err
        );
        return null;
    }
}

function tcpConnectTime(ip: string): Promise<number | null> {
    return new Promise((resolve) => {
        const start = Date.now();
        const socket = connect({
            host: ip,
            port: NODE_PORT,
            timeout: LOCAL_TIMEOUT,
        });
        socket.once("connect", () => {
            socket.destroy();
            resolve(Date.now() - start);
        });
        socket.once("timeout", () => {
            socket.destroy();
            resolve(null);
        });
        socket.once("error", () => {
            socket.destroy();
            resolve(null);
        });
    });
}

async function createControl(apiKey: string): Promise<string | null> {
    try {
        const cities = await pickRuCities();
        if (cities.length < RU_CITIES) {
            console.error(
                `[NODE] Not enough RU eyeball cities (${cities.length}), skipping cycle`
            );
            return null;
        }
        const control = await runPing(
            CONTROL_TARGET,
            cities.map((city) => ({
                country: "RU",
                city,
                tags: [RU_TAG],
                limit: 1,
            })),
            apiKey
        );
        if (
            !control ||
            control.results.length < RU_CITIES ||
            control.results.some(({ result }) => lossOf(result) === 100)
        ) {
            console.error(
                "[NODE] Control measurement failed, skipping RU cycle"
            );
            return null;
        }
        return control.id;
    } catch (err) {
        console.error(
            "Failed RU control measurement:",
            err instanceof Error ? err.message : err
        );
        return null;
    }
}

async function pickRuCities(): Promise<string[]> {
    const response = await fetch(PROBES_URL);
    if (!response.ok) {
        throw new Error(`probes list responded ${response.status}`);
    }
    const probes = (await response.json()) as {
        location: Pick<Location, "country" | "city">;
        tags: string[];
    }[];
    const counts = new Map<string, number>();
    for (const { location, tags } of probes) {
        if (location.country === "RU" && tags.includes(RU_TAG)) {
            counts.set(location.city, (counts.get(location.city) ?? 0) + 1);
        }
    }
    return [...counts]
        .sort(([nameA, a], [nameB, b]) => b - a || nameA.localeCompare(nameB))
        .slice(0, RU_CITIES)
        .map(([city]) => city);
}

async function runPing(
    target: string,
    locations: MeasurementRequest["locations"],
    apiKey: string
): Promise<(MeasurementResponse<PingProbeResult> & { id: string }) | null> {
    const response = await createMeasurementWithRetry(
        {
            target,
            type: "ping",
            locations,
            measurementOptions: {
                protocol: "TCP",
                port: NODE_PORT,
                packets: 3,
            },
        },
        apiKey,
        RU_INTERVAL
    );
    if (!response.ok) {
        console.error(
            `Failed to create node measurement for ${target}: ${response.status}. Body: ${await response.text()}`
        );
        return null;
    }
    const { id } = (await response.json()) as { id: string };
    const data = await pollMeasurement<PingProbeResult>(
        id,
        target,
        POLL_TIMEOUT
    );
    return { ...data, id };
}

function lossOf(result: PingProbeResult): number {
    return result.status === "finished"
        ? Math.min(toNonNegativeNumberOrNull(result.stats.loss) ?? 100, 100)
        : 100;
}

function evaluateNodes(nodes: ProvisionerNode[]): Promise<void> {
    const run = evaluation.then(async () => {
        for (const node of nodes) {
            try {
                await evaluateNode(node);
            } catch (err) {
                console.error(
                    `Failed node evaluation for ${node.ip}:`,
                    err instanceof Error ? err.message : err
                );
            }
        }
    });
    evaluation = run.catch(() => undefined);
    return run;
}

async function evaluateNode(node: ProvisionerNode): Promise<void> {
    const key = nodeKey(node.ip);
    const [events, localFailures, ruCycles] = await Promise.all([
        latestEvents(key),
        localCycleFailures(key),
        ruCycleResults(key),
    ]);
    const state = events.find(({ type }) => type !== "group_down");
    const isDown = state?.type === "dns_removed" || state?.type === "down";
    const ruFailing = ruCycles[0] ? isRuCycleFailed(ruCycles[0]) : false;
    const localDown =
        localFailures.length === CYCLES && localFailures.every(Boolean);
    const localRecovered =
        localFailures.length === CYCLES && !localFailures.some(Boolean);
    const ruDown =
        ruCycles.length === CYCLES && ruCycles.every(isRuCycleFailed);
    const groupDown = events[0]?.type === "group_down" ? events[0] : undefined;
    const ruRecovered =
        ruCycles.length === CYCLES &&
        ruCycles.every(({ failed }) => failed.length === 0);
    const recovered = (source: NodeEventInsert["source"]) =>
        source === "ru" ? ruRecovered : localRecovered && !ruFailing;
    const recoveryDetails = (source: NodeEventInsert["source"]) =>
        source === "ru" ? ruCycles[0] : { failed: [], total: 1 };

    if (!isDown) {
        if (ruDown) {
            await takeDown(node, key, "ru", ruCycles[0], events[0]?.type);
        } else if (localDown) {
            await takeDown(
                node,
                key,
                "local",
                { failed: [LOCAL_CITY], total: 1 },
                events[0]?.type
            );
        } else if (groupDown && recovered(groupDown.source)) {
            await saveEvent(
                key,
                "up",
                groupDown.source,
                recoveryDetails(groupDown.source),
                node.ip
            );
        }
        return;
    }
    if (recovered(state.source)) {
        await restore(node, key, state.source, recoveryDetails(state.source));
    }
}

async function takeDown(
    node: ProvisionerNode,
    key: string,
    source: NodeEventInsert["source"],
    details: EventDetails,
    latestType: NodeEventInsert["type"] | undefined
): Promise<void> {
    if (node.groupSize <= 1) {
        await saveEvent(key, "down", source, details, node.ip);
        return;
    }
    const status = await setDns(node.ip, "disable");
    if (status === 200) {
        await saveEvent(key, "dns_removed", source, details, node.ip);
    } else if (status === 409) {
        if (latestType !== "group_down") {
            await saveEvent(key, "group_down", source, details, node.ip);
        }
    } else {
        console.error(
            `[NODE] DNS disable failed for ${node.ip}: status ${status}`
        );
    }
}

async function restore(
    node: ProvisionerNode,
    key: string,
    source: NodeEventInsert["source"],
    details: EventDetails
): Promise<void> {
    if (node.groupSize <= 1) {
        await saveEvent(key, "up", source, details, node.ip);
        return;
    }
    const status = await setDns(node.ip, "enable");
    if (status === 200) {
        await saveEvent(key, "dns_restored", source, details, node.ip);
    } else {
        console.error(
            `[NODE] DNS enable failed for ${node.ip}: status ${status}`
        );
    }
}

async function setDns(
    ip: string,
    action: "disable" | "enable"
): Promise<number | null> {
    let status: number | null = null;
    for (let attempt = 1; attempt <= DNS_ATTEMPTS; attempt += 1) {
        try {
            const response = await fetch(
                `${PROVISIONER_URL}/dns/nodes/${ip}/${action}`,
                {
                    method: "POST",
                    headers: provisionerHeaders(),
                    signal: AbortSignal.timeout(30000),
                }
            );
            status = response.status;
        } catch (err) {
            console.error(
                `DNS ${action} request failed for ${ip}:`,
                err instanceof Error ? err.message : err
            );
            return null;
        }
        if (status !== 502) return status;
        console.error(
            `[NODE] DNS ${action} sync failed for ${ip}, attempt ${attempt}/${DNS_ATTEMPTS}`
        );
        if (attempt < DNS_ATTEMPTS) {
            await sleep(DNS_BACKOFF * 2 ** (attempt - 1));
        }
    }
    return status;
}

async function saveEvent(
    key: string,
    type: NodeEventInsert["type"],
    source: NodeEventInsert["source"],
    details: EventDetails,
    ip: string
): Promise<void> {
    await db.insert(nodeEvents).values({ nodeKey: key, type, source, details });
    console.log(
        `[NODE] ${type} (${source}) for ${ip}: failed=[${details.failed.join(", ")}], total=${details.total}`
    );
}

function latestEvents(key: string) {
    return db
        .select({ type: nodeEvents.type, source: nodeEvents.source })
        .from(nodeEvents)
        .where(eq(nodeEvents.nodeKey, key))
        .orderBy(desc(nodeEvents.createdAt), desc(nodeEvents.id))
        .limit(2);
}

async function localCycleFailures(key: string): Promise<boolean[]> {
    const rows = await db
        .select({ packetLoss: pingLogs.packetLoss })
        .from(pingLogs)
        .where(
            and(
                eq(pingLogs.kind, "node"),
                eq(pingLogs.domain, key),
                eq(pingLogs.city, LOCAL_CITY)
            )
        )
        .orderBy(desc(pingLogs.createdAt))
        .limit(CYCLES);
    return rows.map(({ packetLoss }) => (packetLoss ?? 100) >= 100);
}

async function ruCycleResults(key: string): Promise<EventDetails[]> {
    const ruRows = and(
        eq(pingLogs.kind, "node"),
        eq(pingLogs.domain, key),
        ne(pingLogs.city, LOCAL_CITY),
        isNotNull(pingLogs.createdAt)
    );
    const recent = db
        .selectDistinct({ createdAt: pingLogs.createdAt })
        .from(pingLogs)
        .where(ruRows)
        .orderBy(desc(pingLogs.createdAt))
        .limit(CYCLES);
    const rows = await db
        .select({
            city: pingLogs.city,
            packetLoss: pingLogs.packetLoss,
            createdAt: pingLogs.createdAt,
        })
        .from(pingLogs)
        .where(and(ruRows, inArray(pingLogs.createdAt, recent)))
        .orderBy(desc(pingLogs.createdAt));
    const cycles = new Map<number | undefined, EventDetails>();
    for (const { city, packetLoss, createdAt } of rows) {
        const cycle = cycles.get(createdAt?.getTime()) ?? {
            failed: [],
            total: 0,
        };
        cycle.total += 1;
        if ((packetLoss ?? 100) >= 100) cycle.failed.push(city ?? "");
        cycles.set(createdAt?.getTime(), cycle);
    }
    return [...cycles.values()];
}

function isRuCycleFailed({ failed }: EventDetails): boolean {
    return failed.length >= RU_FAIL_PROBES;
}

function provisionerHeaders(): Record<string, string> {
    return { "X-Provisioner-Token": process.env.PROVISIONER_TOKEN ?? "" };
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
