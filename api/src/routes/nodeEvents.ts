import { zValidator } from "@hono/zod-validator";
import { nodeEvents } from "@yummystatus/db";
import { db } from "@yummystatus/db/client";
import { and, asc, desc, eq, gt, gte, sql } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";

const EVENTS_LIMIT = 200;

const querySchema = z.object({
    key: z.string().optional(),
    afterId: z.coerce.number().int().optional().catch(undefined),
    hours: z.coerce.number().int().min(1).max(720).catch(24),
});

export const nodeEventsRoute = new Hono().get(
    "/node-events",
    zValidator("query", querySchema),
    async (c) => {
        const { key, afterId, hours } = c.req.valid("query");

        const rows = await db
            .select({
                id: nodeEvents.id,
                key: nodeEvents.nodeKey,
                type: nodeEvents.type,
                source: nodeEvents.source,
                details: nodeEvents.details,
                createdAt: nodeEvents.createdAt,
            })
            .from(nodeEvents)
            .where(
                and(
                    gte(
                        nodeEvents.createdAt,
                        sql`now() - ${`${hours} hour`}::interval`
                    ),
                    key ? eq(nodeEvents.nodeKey, key) : undefined,
                    afterId === undefined
                        ? undefined
                        : gt(nodeEvents.id, afterId)
                )
            )
            .orderBy(
                afterId === undefined
                    ? desc(nodeEvents.createdAt)
                    : asc(nodeEvents.id)
            )
            .limit(EVENTS_LIMIT);

        return c.json({ items: rows });
    }
);
