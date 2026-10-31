import { pingLogs } from "@yummystatus/db";
import { db } from "@yummystatus/db/client";
import { sql } from "drizzle-orm";
import { DOMAINS, type DomainConfig } from "../../domains.ts";
import {
    createMeasurementWithRetry,
    type Location,
    pollMeasurement,
    toNonNegativeNumberOrNull,
} from "./globalping.ts";

const PING_LOCATION: Location = { country: "RU", city: "Moscow" };
const POLL_TIMEOUT = 60000;

type PingProbeResult =
    | {
          status: "finished";
          stats: {
              min: number | null;
              avg: number | null;
              max: number | null;
              loss: number | null;
          };
      }
    | { status: "failed" | "offline" };

interface PingRecord {
    probeId: string;
    domain: string;
    country: string;
    city: string;
    asn?: number | null;
    network?: string | null;
    rttMin?: number | null;
    rttAvg?: number | null;
    rttMax?: number | null;
    packetLoss: number | null;
}

export async function pingCheckAndSave(intervalMs: number): Promise<void> {
    console.log(
        `--- Starting ping check cycle at ${new Date().toISOString()} for ${DOMAINS.length} domains ---`
    );
    await Promise.all(DOMAINS.map((domain) => pingDomain(domain, intervalMs)));
}

export async function aggregateHourlyPing(hourStart: Date): Promise<void> {
    const start = hourStart.toISOString();
    console.log(
        `--- Starting hourly ping aggregation for ${start} at ${new Date().toISOString()} ---`
    );
    const result = await db.execute(sql`
        INSERT INTO ping_hourly_logs (
            domain, country, city, rtt_min, rtt_avg, rtt_max, packet_loss, created_at
        )
        SELECT
            domain,
            country,
            city,
            ROUND(AVG(CASE WHEN rtt_min >= 0 THEN rtt_min END)::numeric, 2),
            ROUND(AVG(CASE WHEN rtt_avg >= 0 THEN rtt_avg END)::numeric, 2),
            ROUND(AVG(CASE WHEN rtt_max >= 0 THEN rtt_max END)::numeric, 2),
            ROUND(AVG(CASE WHEN packet_loss >= 0 THEN LEAST(packet_loss, 100) END)::numeric, 2),
            ${start}::timestamp
        FROM ping_logs
        WHERE created_at >= ${start}::timestamp
          AND created_at < ${start}::timestamp + INTERVAL '1 hour'
        GROUP BY domain, country, city
        ON CONFLICT (created_at, domain, country, city) DO UPDATE SET
            rtt_min = EXCLUDED.rtt_min,
            rtt_avg = EXCLUDED.rtt_avg,
            rtt_max = EXCLUDED.rtt_max,
            packet_loss = EXCLUDED.packet_loss
    `);
    console.log(
        `Hourly ping aggregation completed successfully. Upserted ${result.rowCount} rows.`
    );
}

async function pingDomain(
    domain: DomainConfig,
    intervalMs: number
): Promise<void> {
    const target = domain.name;
    const apiKey = process.env[domain.apiKeyEnv];

    if (!apiKey) {
        console.error(`${domain.apiKeyEnv} is not set for ping.`);
        return;
    }

    const { country, city } = PING_LOCATION;
    const failed = { domain: target, country, city, packetLoss: 100 };

    try {
        const createResponse = await createMeasurementWithRetry(
            {
                target,
                locations: [{ ...PING_LOCATION, limit: 1 }],
                type: "ping",
                measurementOptions: { packets: 3 },
            },
            apiKey,
            intervalMs
        );

        if (!createResponse.ok) {
            const errorBody = await createResponse.text();
            console.error(
                `Failed to create ping measurement for ${target}: ${createResponse.status}. Body: ${errorBody}`
            );
            if (createResponse.status === 429) {
                await saveResult({
                    probeId: "api_limit",
                    domain: target,
                    country,
                    city,
                    packetLoss: null,
                });
            }
            return;
        }

        const { id } = (await createResponse.json()) as { id: string };
        console.log(`[PING] Measurement created for ${target} with ID: ${id}`);

        const resultData = await pollMeasurement<PingProbeResult>(
            id,
            target,
            POLL_TIMEOUT
        );

        const entry = resultData.results[0];
        if (entry && entry.result.status === "finished") {
            const { probe } = entry;
            const { stats } = entry.result;

            console.log(
                `[SUCCESS] Ping to ${probe.city}, ${probe.country} for ${target}: avg=${stats.avg}ms, loss=${stats.loss}%`
            );

            await saveResult({
                probeId: id,
                domain: target,
                country: probe.country,
                city: probe.city,
                asn: probe.asn,
                network: probe.network,
                rttMin: stats.min,
                rttAvg: stats.avg,
                rttMax: stats.max,
                packetLoss: stats.loss,
            });
        } else {
            console.log(`[FAILURE] Ping to ${city}, ${country} for ${target}`);
            await saveResult({ ...failed, probeId: id });
        }
    } catch (err) {
        console.error(
            `Failed ping measurement for ${target}:`,
            err instanceof Error ? err.message : err
        );
        await saveResult({ ...failed, probeId: "failed" });
    }
}

async function saveResult(record: PingRecord): Promise<void> {
    const packetLoss = toNonNegativeNumberOrNull(record.packetLoss);
    await db.insert(pingLogs).values({
        probeId: record.probeId,
        domain: record.domain,
        country: record.country,
        city: record.city,
        asn: record.asn ?? null,
        network: record.network ?? null,
        rttMin: toNonNegativeNumberOrNull(record.rttMin),
        rttAvg: toNonNegativeNumberOrNull(record.rttAvg),
        rttMax: toNonNegativeNumberOrNull(record.rttMax),
        packetLoss: packetLoss === null ? null : Math.min(packetLoss, 100),
    });
}
