import { readFileSync, writeFileSync } from "node:fs";
import { nodeKey } from "@yummystatus/db/node-key";
import type { InferResponseType } from "hono/client";
import { PROVISIONER_URL } from "../../domains.ts";
import { client } from "./api.ts";
import { formatDuration, moscow } from "./diagnose.ts";
import { editAlert, errorMessage, sendText } from "./telegram.ts";

type NodeEvent = InferResponseType<
    (typeof client.api)["node-events"]["$get"]
>["items"][number];
type NodeInfo = {
    ip: string;
    host: string;
    label: string;
};
type NodesState = {
    lastId: number;
    messages: Record<
        string,
        { messageId: number; startedAt: string; text: string }
    >;
};

const STATE_FILE = process.env.BOT_NODES_STATE_FILE ?? "/data/nodes-state.json";
const EVENTS_HOURS = 720;
const REQUEST_TIMEOUT_MS = 30 * 1000;
const OPENING_TYPES: NodeEvent["type"][] = [
    "dns_removed",
    "down",
    "group_down",
];
const COUNTRY_NAMES = new Intl.DisplayNames(["ru"], { type: "region" });

export async function runNodes(): Promise<void> {
    try {
        await tick();
    } catch (error) {
        console.error("Цикл нод упал:", errorMessage(error));
    }
}

async function tick(): Promise<void> {
    const state = readState();
    if (!state) {
        const events = await fetchEvents();
        writeState({ lastId: events.at(0)?.id ?? 0, messages: {} });
        return;
    }

    const events = await fetchEvents(state.lastId);
    if (events.length === 0) return;

    const nodes = await fetchNodeInfo();
    for (const event of events) {
        const node = nodes.get(event.key);
        if (node) await handleEvent(state, event, node);
        else console.error(`Нода ${event.key} не найдена, событие пропущено`);
        state.lastId = event.id;
        writeState(state);
    }
}

async function handleEvent(
    state: NodesState,
    event: NodeEvent,
    node: NodeInfo
): Promise<void> {
    const at = new Date(event.createdAt);
    const stored = state.messages[event.key];

    if (OPENING_TYPES.includes(event.type)) {
        const text = buildAlert(event, node);
        const sent = await sendText(text);
        state.messages[event.key] = {
            messageId: sent.messageId,
            startedAt: event.createdAt,
            text,
        };
        console.log(`Нода ${node.ip}: ${event.type}`);
        return;
    }

    delete state.messages[event.key];
    const edited =
        stored &&
        (await editAlert(
            { messageId: stored.messageId, hasPhoto: false },
            `${stored.text}\n\n✅ <b>Восстановлена</b> ${moscow(at)} МСК, простой ${formatDuration(at.getTime() - new Date(stored.startedAt).getTime())}`
        ));
    if (!edited) {
        await sendText(
            `✅ <b>${node.label}</b> восстановлена\nIP: <code>${node.ip}</code>\n${moscow(at)} МСК`
        );
    }
    console.log(`Нода ${node.ip}: ${event.type}`);
}

function buildAlert(event: NodeEvent, node: NodeInfo): string {
    const { failed, total } = event.details;
    const reason =
        event.source === "ru"
            ? `не отвечает с ${failed.length} из ${total} домашних провайдеров РФ (${escapeHtml(failed.join(", "))})`
            : "не отвечает TCP 443 с сервера yummystatus";
    const action = {
        dns_removed: `убрана из DNS ${node.host}`,
        group_down: `вся группа ${node.host} недоступна, убрать нельзя — последний IP`,
        down: "одиночная нода, только оповещение",
    }[event.type as "dns_removed" | "group_down" | "down"];

    return [
        `🔴 <b>${node.label}</b>`,
        `IP: <code>${node.ip}</code>`,
        `Хост: <code>${node.host}</code>`,
        `Причина: ${reason}`,
        `Действие: ${action}`,
    ].join("\n");
}

async function fetchEvents(afterId?: number): Promise<NodeEvent[]> {
    const response = await client.api["node-events"].$get(
        {
            query: {
                hours: String(EVENTS_HOURS),
                ...(afterId === undefined ? {} : { afterId: String(afterId) }),
            },
        },
        { init: { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) } }
    );
    if (!response.ok) throw new Error(`node-events: ${response.status}`);
    return (await response.json()).items;
}

async function fetchNodeInfo(): Promise<Map<string, NodeInfo>> {
    const [provisioned, listed] = await Promise.all([
        fetchProvisioned(),
        fetchPublicNodes(),
    ]);
    const info = new Map<string, NodeInfo>();
    for (const { ip, host } of provisioned) {
        const key = nodeKey(ip);
        const node = listed.find((entry) => entry.key === key);
        if (!node) continue;
        const country = COUNTRY_NAMES.of(node.country) ?? node.country;
        info.set(key, {
            ip,
            host,
            label: node.order ? `${country} #${node.order}` : country,
        });
    }
    return info;
}

async function fetchProvisioned(): Promise<{ ip: string; host: string }[]> {
    const response = await fetch(`${PROVISIONER_URL}/nodes`, {
        headers: { "X-Provisioner-Token": process.env.PROVISIONER_TOKEN ?? "" },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`provisioner: ${response.status}`);
    return (
        (await response.json()) as { items: { ip: string; host: string }[] }
    ).items;
}

async function fetchPublicNodes() {
    const response = await client.api.nodes.$get(undefined, {
        init: { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) },
    });
    if (!response.ok) throw new Error(`nodes: ${response.status}`);
    return (await response.json()).items;
}

function readState(): NodesState | null {
    try {
        return JSON.parse(readFileSync(STATE_FILE, "utf8")) as NodesState;
    } catch {
        return null;
    }
}

function writeState(state: NodesState): void {
    writeFileSync(STATE_FILE, JSON.stringify(state));
}

function escapeHtml(text: string): string {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;");
}
