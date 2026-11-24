process.env.TZ = "UTC";

import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { API_URL, client, type HealthReport } from "./api.ts";
import {
    buildAlert,
    buildBody,
    type Diagnosis,
    diagnose,
    formatDuration,
} from "./diagnose.ts";
import { runNodes } from "./nodes.ts";
import {
    CHAT_ID,
    DRY_RUN,
    editAlert,
    errorMessage,
    sendAlert,
    TOKEN,
} from "./telegram.ts";

type PendingIncident = {
    messageId?: never;
    startedAt: string;
    alertChecks: number;
};

interface Incident {
    messageId: number;
    hasPhoto: boolean;
    startedAt: string;
    updatedAt: string;
    signature: string;
    body: string;
    okChecks: number;
}

const INTERVAL_MS = Number(process.env.BOT_INTERVAL_MS ?? 2 * 60 * 1000);
const UPDATE_INTERVAL_MS = Number(
    process.env.BOT_UPDATE_INTERVAL_MS ?? 15 * 60 * 1000
);
const ALERT_CHECKS = Number(process.env.BOT_ALERT_CHECKS ?? 2);
const RECOVERY_CHECKS = Number(process.env.BOT_RECOVERY_CHECKS ?? 2);
const STATE_FILE =
    process.env.BOT_STATE_FILE ?? new URL("../.state.json", import.meta.url);
const NODES_INTERVAL_MS = 60 * 1000;
const FORCE_ALERT = process.env.BOT_FORCE_ALERT === "1";
const ALLOWED_COUNTRIES = "RU,UA,BY";

if (!DRY_RUN && (!TOKEN || !CHAT_ID)) {
    console.error("Нужны TG_BOT_TOKEN и TG_CHAT_ID");
    process.exit(1);
}

console.log(
    `Бот запущен: ${API_URL}, интервал ${INTERVAL_MS / 1000} c${DRY_RUN ? ", dry-run" : ""}`
);
run();
runNodes();
const timer = setInterval(run, INTERVAL_MS);
const nodesTimer = setInterval(runNodes, NODES_INTERVAL_MS);

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

async function tick(): Promise<void> {
    const report = await fetchHealth();
    const health = FORCE_ALERT ? "critical" : report.health;
    const now = new Date();
    const state = readState();

    if (health === "critical") {
        const diagnosis = diagnose(report);
        const signature = signatureOf(diagnosis);
        const body = buildBody(diagnosis);

        if (!state || state.messageId === undefined) {
            const startedAt = state?.startedAt ?? now.toISOString();
            const alertChecks = (state?.alertChecks ?? 0) + 1;
            if (alertChecks < ALERT_CHECKS) {
                writeState({ startedAt, alertChecks });
                return;
            }

            const sent = await sendAlert(
                buildAlert(body, new Date(startedAt), { at: now })
            );
            writeState({
                ...sent,
                startedAt,
                updatedAt: now.toISOString(),
                signature,
                body,
                okChecks: 0,
            });
            console.log(`Инцидент открыт: ${diagnosis.cause.title}`);
            return;
        }

        const changed = signature !== state.signature;
        const stale =
            now.getTime() - new Date(state.updatedAt).getTime() >=
            UPDATE_INTERVAL_MS;
        if (!changed && !stale) {
            if (state.okChecks) writeState({ ...state, okChecks: 0 });
            return;
        }

        const update = buildAlert(body, new Date(state.startedAt), { at: now });
        const edited = await editAlert(state, update);
        const resent = edited ? null : await sendAlert(update);
        writeState({
            ...state,
            ...resent,
            updatedAt: now.toISOString(),
            signature,
            body,
            okChecks: 0,
        });
        console.log(`Инцидент обновлён: ${diagnosis.cause.title}`);
        return;
    }

    if (!state) return;
    if (state.messageId === undefined) {
        writeState(null);
        return;
    }

    const okChecks = state.okChecks + 1;
    if (okChecks < RECOVERY_CHECKS) {
        writeState({ ...state, okChecks });
        return;
    }

    const startedAt = new Date(state.startedAt);
    await editAlert(
        state,
        buildAlert(state.body, startedAt, { at: now, resolved: true })
    );
    writeState(null);
    console.log(
        `Инцидент закрыт, длительность: ${formatDuration(now.getTime() - startedAt.getTime())}`
    );
}

function run(): Promise<void> {
    return tick().catch((error: unknown) =>
        console.error("Цикл упал:", errorMessage(error))
    );
}

function shutdown(): void {
    clearInterval(timer);
    clearInterval(nodesTimer);
    process.exit(0);
}

function readState(): Incident | PendingIncident | null {
    try {
        return JSON.parse(readFileSync(STATE_FILE, "utf8")) as
            | Incident
            | PendingIncident;
    } catch {
        return null;
    }
}

function writeState(state: Incident | PendingIncident | null): void {
    if (state) writeFileSync(STATE_FILE, JSON.stringify(state));
    else rmSync(STATE_FILE, { force: true });
}

async function fetchHealth(): Promise<HealthReport> {
    const response = await client.api.health.$get(
        { query: { timeRange: "3hour", countries: ALLOWED_COUNTRIES } },
        { init: { signal: AbortSignal.timeout(30 * 1000) } }
    );
    if (!response.ok) throw new Error(`health: ${response.status}`);
    return response.json();
}

function signatureOf(diagnosis: Diagnosis): string {
    return `${diagnosis.cause.key}|${diagnosis.affected
        .map((entry) => entry.domain)
        .sort()
        .join(",")}`;
}
