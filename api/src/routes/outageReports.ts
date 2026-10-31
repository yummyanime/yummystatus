import { zValidator } from "@hono/zod-validator";
import { outageReports } from "@yummystatus/db";
import { db } from "@yummystatus/db/client";
import { asc, gte, sql } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";

const OUTAGE_REASONS: ReadonlySet<string> = new Set([
    "not_loading",
    "slow",
    "no_media",
    "freezing",
    "auth",
]);

const OUTAGE_WINDOW_HOURS = 24;
const OUTAGE_BUCKET_MS = 30 * 60 * 1000;

const bodySchema = z.object({
    reason: z.string().optional(),
    reasons: z.array(z.string()).optional(),
    domain: z.string().optional(),
});

export const outageReportsRoute = new Hono()
    .post("/outage-reports", zValidator("json", bodySchema), async (c) => {
        const { reason, reasons, domain } = c.req.valid("json");

        const validReasons = [
            ...new Set(reasons ?? (reason === undefined ? [] : [reason])),
        ].filter((value) => OUTAGE_REASONS.has(value));
        if (validReasons.length === 0) {
            return c.json({ error: "Invalid reason" }, 400);
        }

        await db.insert(outageReports).values({
            domain: domain?.trim().slice(0, 255) || null,
            reasons: validReasons,
        });

        return c.json({ ok: true }, 201);
    })
    .get("/outage-reports", async (c) => {
        const now = Date.now();
        const windowMs = OUTAGE_WINDOW_HOURS * 60 * 60 * 1000;
        const end = Math.ceil(now / OUTAGE_BUCKET_MS) * OUTAGE_BUCKET_MS;
        const start = end - windowMs;

        const rows = await db
            .select({
                reasons: outageReports.reasons,
                createdAt: outageReports.createdAt,
            })
            .from(outageReports)
            .where(
                gte(
                    outageReports.createdAt,
                    sql`now() - ${`${OUTAGE_WINDOW_HOURS} hour`}::interval`
                )
            )
            .orderBy(asc(outageReports.createdAt));

        const bucketCount = Math.round(windowMs / OUTAGE_BUCKET_MS);
        const counts = new Array<number>(bucketCount).fill(0);
        const reasonCounts: Record<string, number> = {};

        for (const row of rows) {
            const index = Math.floor(
                ((row.createdAt?.getTime() ?? 0) - start) / OUTAGE_BUCKET_MS
            );
            if (index >= 0 && index < bucketCount) {
                counts[index] = (counts[index] ?? 0) + 1;
            }
            for (const reason of row.reasons) {
                reasonCounts[reason] = (reasonCounts[reason] ?? 0) + 1;
            }
        }

        return c.json({
            updatedAt: new Date(now).toISOString(),
            total: rows.length,
            buckets: counts.map((count, i) => ({
                time: new Date(start + i * OUTAGE_BUCKET_MS).toISOString(),
                count,
            })),
            reasons: Object.entries(reasonCounts)
                .map(([reason, count]) => ({ reason, count }))
                .sort((a, b) => b.count - a.count),
            reports: rows
                .map((row) => ({
                    time: row.createdAt?.toISOString() ?? "",
                    reasons: row.reasons,
                }))
                .sort((a, b) => b.time.localeCompare(a.time)),
        });
    });
