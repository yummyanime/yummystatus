import { httpLogs } from "@yummystatus/db";
import { db } from "@yummystatus/db/client";
import { and, desc, eq, isNotNull, sql } from "drizzle-orm";
import {
    DOMAINS,
    type DomainConfig,
    IGNORED_ERROR_CODES,
    INTERNAL_STATUS,
} from "../../domains.ts";
import {
    createMeasurementWithRetry,
    type Location,
    type MeasurementResponse,
    MeasurementTimeoutError,
    pollMeasurement,
    toNonNegativeNumberOrNull,
} from "./globalping.ts";
import {
    applyStrikes,
    commitPin,
    loadPin,
    matchSlots,
    type Pin,
    replaceSuspect,
    runPinned,
    type Slot,
    syncSlots,
} from "./probePins.ts";

const MAX_TOTAL_TIME = 6000;
const POLL_TIMEOUT = 180000;
const PROBE_CHECK_HOST = "www.google.com";
const PROBE_CHECK_PATH = "/generate_204";

type ServerTiming = Record<string, number>;
type ResponseHeaders = Record<string, string | string[]>;

interface HttpTimings {
    total: number | null;
    download: number | null;
    firstByte: number | null;
    dns: number | null;
    tls: number | null;
    tcp: number | null;
}

type HttpProbeResult =
    | {
          status: "finished";
          statusCode: number;
          headers: ResponseHeaders;
          timings: HttpTimings;
      }
    | { status: "failed" | "offline"; rawOutput?: string | null };

type HttpMeasurement = MeasurementResponse<HttpProbeResult> & { id: string };

interface HttpRecord {
    probeId: string;
    domain: string;
    country: string;
    city: string;
    statusCode: number;
    asn?: number | null;
    network?: string | null;
    totalTime?: number | null;
    downloadTime?: number | null;
    firstByteTime?: number | null;
    dnsTime?: number | null;
    tlsTime?: number | null;
    tcpTime?: number | null;
    serverTiming?: ServerTiming | null;
    failureReason?: string | null;
}

export async function httpCheckAndSave(
    set: Pin["set"],
    locations: readonly Location[],
    intervalMs: number
): Promise<void> {
    console.log(
        `--- Starting HTTP check cycle at ${new Date().toISOString()} for ${locations.length} locations across ${DOMAINS.length} domains ---`
    );
    const pin = syncSlots(await loadPin(set), locations);
    const measurements = await Promise.all(
        DOMAINS.map((domain) => checkAndSaveDomain(domain, pin, intervalMs))
    );
    try {
        await evaluateGroup(
            pin,
            measurements.filter(
                (measurement): measurement is HttpMeasurement =>
                    measurement !== null
            ),
            intervalMs
        );
    } catch (err) {
        console.error(
            `Failed pin evaluation for ${set}:`,
            err instanceof Error ? err.message : err
        );
    }
}

export async function aggregateHourlyHttp(hourStart: Date): Promise<void> {
    const start = hourStart.toISOString();
    console.log(
        `--- Starting hourly aggregation for ${start} at ${new Date().toISOString()} ---`
    );
    const result = await db.execute(sql`
        WITH base AS (
            SELECT
                domain,
                country,
                city,
                MODE() WITHIN GROUP (ORDER BY status_code) FILTER (WHERE status_code >= 0) AS status_code,
                ROUND(AVG(CASE WHEN total_time >= 0 THEN total_time END)::numeric, 2) AS total_time,
                ROUND(AVG(CASE WHEN download_time >= 0 THEN download_time END)::numeric, 2) AS download_time,
                ROUND(AVG(CASE WHEN first_byte_time >= 0 THEN first_byte_time END)::numeric, 2) AS first_byte_time,
                ROUND(AVG(CASE WHEN dns_time >= 0 THEN dns_time END)::numeric, 2) AS dns_time,
                ROUND(AVG(CASE WHEN tls_time >= 0 THEN tls_time END)::numeric, 2) AS tls_time,
                ROUND(AVG(CASE WHEN tcp_time >= 0 THEN tcp_time END)::numeric, 2) AS tcp_time
            FROM http_logs
            WHERE created_at >= ${start}::timestamp
              AND created_at < ${start}::timestamp + INTERVAL '1 hour'
            GROUP BY domain, country, city
        ),
        per_metric AS (
            SELECT
                l.domain, l.country, l.city,
                j.key,
                AVG((j.value)::numeric) AS avg_val
            FROM http_logs l
            CROSS JOIN LATERAL jsonb_each_text(l.server_timing) j
            WHERE l.created_at >= ${start}::timestamp
              AND l.created_at < ${start}::timestamp + INTERVAL '1 hour'
              AND l.server_timing IS NOT NULL
            GROUP BY l.domain, l.country, l.city, j.key
        ),
        timing_agg AS (
            SELECT
                domain, country, city,
                jsonb_object_agg(key, ROUND(avg_val, 2)) AS server_timing
            FROM per_metric
            GROUP BY domain, country, city
        )
        INSERT INTO http_hourly_logs (
            domain, country, city, status_code, total_time, download_time,
            first_byte_time, dns_time, tls_time, tcp_time, server_timing, created_at
        )
        SELECT
            b.domain, b.country, b.city, b.status_code, b.total_time, b.download_time,
            b.first_byte_time, b.dns_time, b.tls_time, b.tcp_time, t.server_timing,
            ${start}::timestamp
        FROM base b
        LEFT JOIN timing_agg t
            ON t.domain = b.domain AND t.country = b.country AND t.city = b.city
        ON CONFLICT (created_at, domain, country, city) DO UPDATE SET
            status_code = EXCLUDED.status_code,
            total_time = EXCLUDED.total_time,
            download_time = EXCLUDED.download_time,
            first_byte_time = EXCLUDED.first_byte_time,
            dns_time = EXCLUDED.dns_time,
            tls_time = EXCLUDED.tls_time,
            tcp_time = EXCLUDED.tcp_time,
            server_timing = EXCLUDED.server_timing
    `);
    console.log(
        `Hourly aggregation completed successfully. Upserted ${result.rowCount} rows.`
    );
}

async function checkAndSaveDomain(
    domain: DomainConfig,
    pin: Pin,
    intervalMs: number
): Promise<HttpMeasurement | null> {
    const target = domain.name;
    const apiKey = process.env[domain.apiKeyEnv];
    const secretKey = process.env.GLOBALPING_SECRET_KEY;

    if (!apiKey) {
        console.error(`${domain.apiKeyEnv} is not set.`);
        return null;
    }

    try {
        let rejected = null as { status: number; body: string } | null;
        const measurement = await runPinned(pin, [], async (locations) => {
            const createResponse = await createMeasurementWithRetry(
                {
                    target,
                    locations,
                    type: "http",
                    measurementOptions: {
                        protocol: domain.protocol ?? "HTTPS",
                        ...((domain.path || secretKey) && {
                            request: {
                                ...(domain.path && { path: domain.path }),
                                ...(secretKey && {
                                    headers: { "X-Secret-Key": secretKey },
                                }),
                            },
                        }),
                    },
                },
                apiKey,
                intervalMs
            );

            if (!createResponse.ok) {
                const errorBody = await createResponse.text();
                console.error(
                    `Failed to create measurement for ${target}: ${createResponse.status} ${createResponse.statusText}. Body: ${errorBody}`
                );
                rejected = { status: createResponse.status, body: errorBody };
                return null;
            }

            const { id } = (await createResponse.json()) as { id: string };
            console.log(
                `[HTTP] Measurement created for ${target} with ID: ${id}`
            );
            return {
                ...(await pollMeasurement<HttpProbeResult>(
                    id,
                    target,
                    POLL_TIMEOUT
                )),
                id,
            };
        });

        if (!measurement) {
            if (!rejected) return null;
            for (const { country, city } of pin.slots) {
                if (rejected.status === 429) {
                    await saveResult({
                        probeId: "api_limit",
                        domain: target,
                        country,
                        city,
                        statusCode: INTERNAL_STATUS.API_LIMIT,
                    });
                } else {
                    await saveResult({
                        probeId: "failed",
                        domain: target,
                        country,
                        city,
                        statusCode: INTERNAL_STATUS.PROBE_FAIL,
                        failureReason: `create ${rejected.status}: ${rejected.body.slice(0, 200)}`,
                    });
                }
            }
            return null;
        }

        const entries = matchSlots(pin.slots, measurement.results);
        for (const [index, location] of pin.slots.entries()) {
            const entry = entries[index];
            const probe = entry?.probe;
            const result = entry?.result;
            const base = {
                probeId: measurement.id,
                domain: target,
                country: probe?.country || location.country,
                city: probe?.city || location.city,
                asn: probe?.asn || null,
                network: probe?.network || null,
            };

            if (probe && result?.status === "finished") {
                console.log(
                    `[SUCCESS] HTTP check to ${probe.city}, ${probe.country} for ${target}: Status ${result.statusCode}. ASN: ${probe.asn}, Network: ${probe.network}`
                );
                await saveResult({
                    ...base,
                    statusCode: result.statusCode,
                    totalTime: result.timings.total,
                    downloadTime: result.timings.download,
                    firstByteTime: result.timings.firstByte,
                    dnsTime: result.timings.dns,
                    tlsTime: result.timings.tls,
                    tcpTime: result.timings.tcp,
                    serverTiming: parseServerTiming(
                        pickHeaderCaseInsensitive(
                            result.headers,
                            "server-timing"
                        )
                    ),
                });
                continue;
            }

            const probeStatus = result ? result.status : "unknown";
            const rawOutput =
                result && result.status !== "finished"
                    ? result.rawOutput
                    : null;
            const statusCode =
                probeStatus === "offline"
                    ? INTERNAL_STATUS.PROBE_OFFLINE
                    : classifyProbeFailure(rawOutput ?? null);
            const failureReason = rawOutput
                ? `${probeStatus}: ${String(rawOutput).slice(0, 120)}`
                : probeStatus;
            console.log(
                `[FAILURE] HTTP check to ${location.city}, ${location.country} for ${target}: Status ${failureReason}`
            );
            await saveResult({ ...base, statusCode, failureReason });
        }
        console.log(
            `--- HTTP check cycle for measurement ${measurement.id} completed. ---`
        );
        return measurement;
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(
            `Failed to complete HTTP measurement cycle for ${target}:`,
            message
        );
        const statusCode =
            err instanceof MeasurementTimeoutError
                ? INTERNAL_STATUS.MEASUREMENT_TIMEOUT
                : INTERNAL_STATUS.PROBE_FAIL;
        for (const { country, city } of pin.slots) {
            await saveResult({
                probeId: "failed",
                domain: target,
                country,
                city,
                statusCode,
                failureReason: message,
            });
        }
        return null;
    }
}

async function evaluateGroup(
    pin: Pin,
    measurements: HttpMeasurement[],
    intervalMs: number
): Promise<void> {
    if (!measurements.length) return;
    const matched = measurements.map(({ results }) =>
        matchSlots(pin.slots, results)
    );
    const statuses = pin.slots.map((_, index) =>
        matched.map((entries) => entries[index]?.result.status ?? "offline")
    );
    const offline = statuses.map((slotStatuses) =>
        slotStatuses.includes("offline")
    );
    const succeeded = statuses.map((slotStatuses) =>
        slotStatuses.includes("finished")
    );
    const failed = pin.slots.map(
        (_, index) =>
            offline[index] ||
            (!succeeded[index] &&
                succeeded.some((ok, other) => ok && other !== index))
    );
    const dead: number[] = [];
    for (const index of applyStrikes(pin, failed)) {
        const slot = pin.slots[index];
        if (offline[index] || !(await isGoogleReachable(slot, intervalMs))) {
            dead.push(index);
        } else {
            slot.strikes = 0;
            console.log(
                `[PIN] Slot ${index} of ${pin.set} (${slot.city}) reaches google, regional block kept`
            );
        }
    }
    if (!dead.length || !(await replaceSuspect(pin, dead, [], false))) {
        await commitPin(pin, measurements[0]);
    }
}

async function isGoogleReachable(
    { country, city, asn, network }: Slot,
    intervalMs: number
): Promise<boolean> {
    const apiKey = process.env[DOMAINS[0].apiKeyEnv];
    if (!apiKey) return true;
    try {
        const response = await createMeasurementWithRetry(
            {
                target: PROBE_CHECK_HOST,
                locations: [{ country, city, asn, network, limit: 1 }],
                type: "http",
                measurementOptions: {
                    protocol: "HTTPS",
                    request: { path: PROBE_CHECK_PATH },
                },
            },
            apiKey,
            intervalMs
        );
        if (!response.ok) {
            console.error(
                `[PIN] Google check for ${city} AS${asn} not created: ${response.status}`
            );
            return response.status !== 422;
        }
        const { id } = (await response.json()) as { id: string };
        const { results } = await pollMeasurement<HttpProbeResult>(
            id,
            PROBE_CHECK_HOST,
            POLL_TIMEOUT
        );
        return results[0]?.result.status === "finished";
    } catch (err) {
        console.error(
            `[PIN] Google check for ${city} AS${asn} failed:`,
            err instanceof Error ? err.message : err
        );
        return true;
    }
}

async function saveResult(record: HttpRecord): Promise<void> {
    let { totalTime, downloadTime, firstByteTime, dnsTime, tlsTime, tcpTime } =
        record;
    let serverTiming = record.serverTiming ?? null;

    if (IGNORED_ERROR_CODES.has(record.statusCode)) {
        const lastSuccess = await fetchLastSuccessfulLog(record);
        if (lastSuccess) {
            totalTime = lastSuccess.totalTime;
            downloadTime = lastSuccess.downloadTime;
            firstByteTime = lastSuccess.firstByteTime;
            dnsTime = lastSuccess.dnsTime;
            tlsTime = lastSuccess.tlsTime;
            tcpTime = lastSuccess.tcpTime;
            serverTiming = lastSuccess.serverTiming;
        }
    }

    if (totalTime === null || totalTime === undefined) {
        const isTimeoutFailure =
            record.statusCode === INTERNAL_STATUS.TIMEOUT ||
            record.statusCode === INTERNAL_STATUS.MEASUREMENT_TIMEOUT;
        totalTime = isTimeoutFailure ? MAX_TOTAL_TIME : null;
    }

    const safeTotalTime = toNonNegativeNumberOrNull(totalTime);
    const safeStatusCode = toNonNegativeNumberOrNull(record.statusCode);
    await db.insert(httpLogs).values({
        probeId: record.probeId,
        domain: record.domain,
        country: record.country,
        city: record.city,
        asn: record.asn ?? null,
        network: record.network ?? null,
        statusCode: safeStatusCode === null ? null : Math.trunc(safeStatusCode),
        totalTime:
            safeTotalTime === null
                ? null
                : Math.min(safeTotalTime, MAX_TOTAL_TIME),
        downloadTime: toNonNegativeNumberOrNull(downloadTime),
        firstByteTime: toNonNegativeNumberOrNull(firstByteTime),
        dnsTime: toNonNegativeNumberOrNull(dnsTime),
        tlsTime: toNonNegativeNumberOrNull(tlsTime),
        tcpTime: toNonNegativeNumberOrNull(tcpTime),
        serverTiming,
        failureReason: record.failureReason
            ? record.failureReason.slice(0, 500)
            : null,
    });
}

async function fetchLastSuccessfulLog(record: HttpRecord) {
    try {
        const [row] = await db
            .select({
                totalTime: httpLogs.totalTime,
                downloadTime: httpLogs.downloadTime,
                firstByteTime: httpLogs.firstByteTime,
                dnsTime: httpLogs.dnsTime,
                tlsTime: httpLogs.tlsTime,
                tcpTime: httpLogs.tcpTime,
                serverTiming: httpLogs.serverTiming,
            })
            .from(httpLogs)
            .where(
                and(
                    eq(httpLogs.domain, record.domain),
                    eq(httpLogs.country, record.country),
                    eq(httpLogs.city, record.city),
                    eq(httpLogs.statusCode, 200),
                    isNotNull(httpLogs.totalTime)
                )
            )
            .orderBy(desc(httpLogs.createdAt))
            .limit(1);
        return row ?? null;
    } catch (err) {
        console.error("Error fetching last successful log for fallback:", err);
        return null;
    }
}

function classifyProbeFailure(rawOutput: string | null): number {
    if (!rawOutput) {
        return INTERNAL_STATUS.PROBE_FAIL;
    }
    if (/ETIMEDOUT|timed?\s*out/i.test(rawOutput))
        return INTERNAL_STATUS.TIMEOUT;
    if (/ENOTFOUND|EAI_AGAIN|getaddrinfo|queryA?\b/i.test(rawOutput))
        return INTERNAL_STATUS.DNS_ERROR;
    if (/ECONNREFUSED|ECONNRESET|EPIPE/i.test(rawOutput))
        return INTERNAL_STATUS.CONN_REFUSED;
    if (/cert|tls|ssl|self.signed|ERR_TLS|DEPTH_ZERO/i.test(rawOutput))
        return INTERNAL_STATUS.TLS_ERROR;
    return INTERNAL_STATUS.PROBE_FAIL;
}

function pickHeaderCaseInsensitive(
    headers: ResponseHeaders,
    name: string
): string | string[] | null {
    const lower = name.toLowerCase();
    for (const key of Object.keys(headers)) {
        if (key.toLowerCase() === lower) return headers[key] ?? null;
    }
    return null;
}

function parseServerTiming(
    rawHeader: string | string[] | null
): ServerTiming | null {
    if (!rawHeader) return null;
    const headerStr = Array.isArray(rawHeader)
        ? rawHeader.join(",")
        : rawHeader;
    if (!headerStr.trim()) return null;

    const result: ServerTiming = {};
    let inQuotes = false;
    let buf = "";
    const entries: string[] = [];
    for (const ch of headerStr) {
        if (ch === '"') inQuotes = !inQuotes;
        if (ch === "," && !inQuotes) {
            entries.push(buf);
            buf = "";
        } else {
            buf += ch;
        }
    }
    if (buf.trim()) entries.push(buf);

    for (const entry of entries) {
        const parts = entry
            .split(";")
            .map((p) => p.trim())
            .filter(Boolean);
        const name = parts[0];
        if (!name) continue;
        let dur: number | null = null;
        for (const p of parts.slice(1)) {
            const eq = p.indexOf("=");
            if (eq === -1) continue;
            const k = p.slice(0, eq).trim().toLowerCase();
            let v = p.slice(eq + 1).trim();
            if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1);
            if (k === "dur") {
                const n = Number(v);
                if (Number.isFinite(n) && n >= 0) dur = n;
            }
        }
        if (dur !== null) {
            result[name] = Math.round(dur * 100) / 100;
        }
    }
    return Object.keys(result).length > 0 ? result : null;
}
