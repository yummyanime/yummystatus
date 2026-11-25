import { readFileSync, writeFileSync } from "node:fs";
import { nodeKey } from "@yummystatus/db/node-key";
import type { InferResponseType } from "hono/client";
import { PROVISIONER_URL } from "../../domains.ts";
import { client } from "./api.ts";
import { formatDuration, moscow } from "./diagnose.ts";
import { renderNodeImage } from "./nodeImage.ts";
import { editAlert, errorMessage, sendAlert, sendText } from "./telegram.ts";

type NodeEvent = InferResponseType<
    (typeof client.api)["node-events"]["$get"]
>["items"][number];
type NodeInfo = {
    ip: string;
    host: string;
    label: string;
    countryCode: string;
    countryName: string;
    order: number | null;
};
type Bucket = Parameters<typeof renderNodeImage>[0]["buckets"][number];
type NodesState = {
    lastId: number;
    messages: Record<
        string,
        {
            messageId: number;
            startedAt: string;
            body: string;
            hasPhoto?: boolean;
        }
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
const BUCKET_COUNT = 36;
const BUCKET_MS = 5 * 60 * 1000;
const COUNTRY_NAMES = new Intl.DisplayNames(["ru"], { type: "region" });

export async function runNodes(): Promise<void> {
    try {
        await tick();
    } catch (error) {
        console.error("Цикл серверов упал:", errorMessage(error));
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
        else console.error(`Сервер ${event.key} не найден, событие пропущено`);
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
        const body = buildBody(event, node);
        const caption = buildAlert(body, at, event);
        const image =
            event.type === "down" || event.type === "group_down"
                ? await renderImage(node, event, at, event.type)
                : null;
        const sent = image
            ? await sendAlert(caption, image)
            : await sendText(caption);
        state.messages[event.key] = {
            messageId: sent.messageId,
            startedAt: event.createdAt,
            body,
            hasPhoto: sent.hasPhoto,
        };
        console.log(`Сервер ${node.ip}: ${event.type}`);
        return;
    }

    delete state.messages[event.key];
    if (stored?.body) {
        const startedAt = new Date(stored.startedAt);
        const text = buildAlert(stored.body, startedAt, event);
        const hasPhoto = stored.hasPhoto ?? false;
        const edited = await editAlert(
            { messageId: stored.messageId, hasPhoto },
            text,
            hasPhoto ? await renderImage(node, event, startedAt) : null
        );
        if (!edited) await sendText(text);
    } else {
        await sendText(
            `✅ <b>Сервер VPN восстановлен</b>\n${node.label}\nIP: <code>${node.ip}</code>\n${moscow(at)} МСК`
        );
    }
    console.log(`Сервер ${node.ip}: ${event.type}`);
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
            label: `${flagEmoji(node.country)} ${country}${node.order ? ` #${node.order}` : ""}`,
            countryCode: node.country,
            countryName: country,
            order: node.order,
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

function flagEmoji(country: string): string {
    return String.fromCodePoint(
        ...[...country.toUpperCase()].map(
            (char) => 0x1f1a5 + char.charCodeAt(0)
        )
    );
}

function buildBody(event: NodeEvent, node: NodeInfo): string {
    const { failed, total } = event.details;
    const reason =
        event.source === "ru"
            ? `Не отвечает с ${failed.length} из ${total} домашних провайдеров РФ (${escapeHtml(failed.join(", "))})`
            : "Не отвечает TCP 443 с сервера yummystatus";
    const action = {
        dns_removed: `Убран из DNS <code>${node.host}</code>, дублёр в группе остался`,
        group_down: `Последний IP в группе <code>${node.host}</code>: дублёра нет, убрать из DNS нельзя`,
        down: "Одиночный сервер, дублёра нет: только оповещение",
    }[event.type as "dns_removed" | "group_down" | "down"];

    return [
        `<b>Затронуто</b>`,
        `• ${node.label}`,
        `IP: <code>${node.ip}</code>`,
        `Хост: <code>${node.host}</code>`,
        ``,
        `<b>Причина</b>`,
        `<i>${reason}</i>`,
        ``,
        `<b>Действие</b>`,
        `<i>${action}</i>`,
    ].join("\n");
}

function buildAlert(body: string, startedAt: Date, event: NodeEvent): string {
    const at = new Date(event.createdAt);
    const duration = formatDuration(at.getTime() - startedAt.getTime());
    const header = OPENING_TYPES.includes(event.type)
        ? [
              `🔴 <b>Сервер VPN ${event.source === "ru" ? "заблокирован" : "недоступен"}</b>`,
              `Начало: ${moscow(startedAt)} МСК`,
              `Инцидент длится ${duration}`,
          ]
        : [
              `✅ <b>Сервер VPN восстановлен</b>`,
              `Начало: ${moscow(startedAt)} МСК`,
              `Конец: ${moscow(at)} МСК`,
              `Инцидент длился ${duration}`,
          ];

    return `${header.join("\n")}\n\n${body}`;
}

async function renderImage(
    node: NodeInfo,
    event: NodeEvent,
    startedAt: Date,
    kind?: "group_down" | "down"
): Promise<Uint8Array<ArrayBuffer> | null> {
    const resolved = !OPENING_TYPES.includes(event.type);
    try {
        return await renderNodeImage({
            countryCode: node.countryCode,
            countryName: node.countryName,
            order: node.order,
            cause: event.source,
            resolved,
            kind,
            startedAt,
            endedAt: resolved ? new Date(event.createdAt) : undefined,
            buckets: await fetchBuckets(event.key),
        });
    } catch (error) {
        console.error("Картинка сервера не создана:", errorMessage(error));
        return null;
    }
}

async function fetchBuckets(key: string): Promise<Bucket[]> {
    const lost: boolean[][] = Array.from({ length: BUCKET_COUNT }, () => []);
    try {
        const response = await client.api["ping-logs"].$get(
            { query: { timeRange: "3hour", kind: "node", domain: key } },
            { init: { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) } }
        );
        if (!response.ok) throw new Error(`ping-logs: ${response.status}`);
        const start = Date.now() - BUCKET_COUNT * BUCKET_MS;
        for (const log of await response.json()) {
            if (log.city === "yummystatus" || log.created_at === null) continue;
            const index = Math.floor(
                (Date.parse(log.created_at) - start) / BUCKET_MS
            );
            if (index < 0) continue;
            lost[Math.min(BUCKET_COUNT - 1, index)].push(
                (log.packet_loss ?? 100) > 0
            );
        }
    } catch (error) {
        console.error("Логи сервера не получены:", errorMessage(error));
    }
    return lost.map((rows) =>
        rows.length === 0 ? "empty" : rows.includes(true) ? "down" : "up"
    );
}
