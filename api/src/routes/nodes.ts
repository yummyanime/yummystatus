import { nodeKey } from "@yummystatus/db/node-key";
import { Hono } from "hono";
import { z } from "zod";
import { PROVISIONER_URL } from "../../../domains.ts";

const CACHE_TTL_MS = 60_000;

const provisionerSchema = z.object({
    items: z.array(
        z.object({
            id: z.string(),
            ip: z.string(),
            country: z.string(),
            groupSize: z.number(),
            inDns: z.boolean().nullable(),
        })
    ),
});

let cache: {
    at: number;
    items: ReturnType<typeof toPublicNodes>;
} | null = null;

export const nodesRoute = new Hono().get("/nodes", async (c) => {
    if (cache && Date.now() - cache.at < CACHE_TTL_MS) {
        return c.json({ items: cache.items });
    }

    try {
        const response = await fetch(`${PROVISIONER_URL}/nodes`, {
            headers: {
                "X-Provisioner-Token": process.env.PROVISIONER_TOKEN ?? "",
            },
            signal: AbortSignal.timeout(10_000),
        });
        if (!response.ok) {
            throw new Error(`provisioner responded ${response.status}`);
        }
        const { items } = provisionerSchema.parse(await response.json());
        cache = { at: Date.now(), items: toPublicNodes(items) };
    } catch (err) {
        console.error("provisioner nodes request failed", err);
        if (!cache) {
            return c.text("Provisioner unavailable", 502);
        }
    }

    return c.json({ items: cache.items });
});

function toPublicNodes(items: z.infer<typeof provisionerSchema>["items"]): {
    key: string;
    country: string;
    group: string;
    order: number | null;
    inDns: boolean | null;
}[] {
    const seen = new Map<string, number>();
    return items.map(({ id, ip, country, groupSize, inDns }) => {
        const position = (seen.get(id) ?? 0) + 1;
        seen.set(id, position);
        return {
            key: nodeKey(ip),
            country,
            group: nodeKey(id),
            order: groupSize > 1 ? position : null,
            inDns,
        };
    });
}
