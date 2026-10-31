import { lighthouseLogs } from "@yummystatus/db";
import { db } from "@yummystatus/db/client";
import { sql } from "drizzle-orm";

const LIGHTHOUSE_DOMAINS = ["ru.yummyani.me", "ru.yummy-ani.me"];
const LIGHTHOUSE_PATHS = [
    "/",
    "/catalog",
    "/catalog/announces",
    "/catalog/ongoing",
    "/catalog/schedule",
    "/catalog/top",
    "/catalog/collection",
    "/catalog/collection/324",
    "/catalog/genre/bisenen",
    "/catalog/director/4",
    "/catalog/studio/a1pictures",
    "/catalog/item/monolog-farmatsevta-2",
    "/posts",
    "/posts/2252",
    "/reviews",
    "/reviews/1",
    "/videos",
    "/videos/642",
    "/users",
    "/designs",
    "/designs/1",
    "/pages/about-yummy",
    "/pages/faq",
];
const STRATEGIES = ["mobile", "desktop"] as const;
const PSI_ENDPOINT =
    "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";
const NUMERIC_FIELDS = [
    "perf_score",
    "ttfb",
    "lcp",
    "fcp",
    "speed_index",
    "tbt",
    "tti",
    "cls",
    "load_time",
    "field_lcp",
    "field_inp",
    "field_cls",
    "field_fcp",
    "field_ttfb",
];

interface Target {
    domain: string;
    path: string;
}

type Strategy = (typeof STRATEGIES)[number];

interface Audit {
    numericValue?: number | null;
    details?: {
        overallSavingsMs?: number | null;
        items?: { observedLoad?: number | null }[];
    };
}

interface FieldMetrics {
    metrics?: Record<string, { percentile?: number | null } | undefined>;
}

interface PsiResponse {
    lighthouseResult?: {
        audits?: Record<string, Audit | undefined>;
        categories?: Record<string, { score?: number | null } | undefined>;
    };
    loadingExperience?: FieldMetrics;
    originLoadingExperience?: FieldMetrics;
}

type Metrics = Pick<
    typeof lighthouseLogs.$inferInsert,
    | "perfScore"
    | "ttfb"
    | "lcp"
    | "fcp"
    | "speedIndex"
    | "tbt"
    | "tti"
    | "cls"
    | "loadTime"
    | "fieldLcp"
    | "fieldInp"
    | "fieldCls"
    | "fieldFcp"
    | "fieldTtfb"
    | "diagnostics"
>;

const targets: Target[] = LIGHTHOUSE_DOMAINS.flatMap((domain) =>
    LIGHTHOUSE_PATHS.map((path) => ({ domain, path }))
);

export async function lighthouseCheckAndSave(): Promise<void> {
    console.log(
        `--- Starting Lighthouse check cycle at ${new Date().toISOString()} for ${targets.length} targets ---`
    );
    for (const target of targets) {
        for (const strategy of STRATEGIES) {
            await measureOne(target, strategy);
        }
    }
    console.log("--- Lighthouse check cycle completed. ---");
}

export async function aggregateHourlyLighthouse(
    hourStart: Date
): Promise<void> {
    const start = hourStart.toISOString();
    console.log(
        `--- Starting hourly Lighthouse aggregation for ${start} at ${new Date().toISOString()} ---`
    );
    const columns = sql.raw(NUMERIC_FIELDS.join(", "));
    const averages = sql.raw(
        NUMERIC_FIELDS.map(
            (f) => `ROUND(AVG(l.${f})::numeric, 3) AS ${f}`
        ).join(", ")
    );
    const baseColumns = sql.raw(NUMERIC_FIELDS.map((f) => `b.${f}`).join(", "));
    const updates = sql.raw(
        [...NUMERIC_FIELDS, "diagnostics"]
            .map((f) => `${f} = EXCLUDED.${f}`)
            .join(", ")
    );
    const result = await db.execute(sql`
        WITH base AS (
            SELECT
                l.domain, l.url_path, l.strategy,
                ${averages}
            FROM lighthouse_logs l
            WHERE l.created_at >= ${start}::timestamp
              AND l.created_at < ${start}::timestamp + INTERVAL '1 hour'
            GROUP BY l.domain, l.url_path, l.strategy
        ),
        per_metric AS (
            SELECT
                l.domain, l.url_path, l.strategy,
                j.key,
                AVG((j.value)::numeric) AS avg_val
            FROM lighthouse_logs l
            CROSS JOIN LATERAL jsonb_each_text(l.diagnostics) j
            WHERE l.created_at >= ${start}::timestamp
              AND l.created_at < ${start}::timestamp + INTERVAL '1 hour'
              AND l.diagnostics IS NOT NULL
              AND j.value ~ '^-?[0-9.]+$'
            GROUP BY l.domain, l.url_path, l.strategy, j.key
        ),
        diag_agg AS (
            SELECT
                domain, url_path, strategy,
                jsonb_object_agg(key, ROUND(avg_val, 2)) AS diagnostics
            FROM per_metric
            GROUP BY domain, url_path, strategy
        )
        INSERT INTO lighthouse_hourly_logs (
            domain, url_path, strategy, ${columns}, diagnostics, created_at
        )
        SELECT
            b.domain, b.url_path, b.strategy,
            ${baseColumns},
            d.diagnostics,
            ${start}::timestamp
        FROM base b
        LEFT JOIN diag_agg d
            ON d.domain = b.domain AND d.url_path = b.url_path AND d.strategy = b.strategy
        ON CONFLICT (created_at, domain, url_path, strategy) DO UPDATE SET ${updates}
    `);
    console.log(
        `Hourly Lighthouse aggregation completed successfully. Upserted ${result.rowCount} rows.`
    );
}

async function measureOne(target: Target, strategy: Strategy): Promise<void> {
    try {
        const response = await fetch(buildPsiUrl(target, strategy));

        if (!response.ok) {
            const body = await response.text();
            console.error(
                `[LH] PSI failed for ${target.domain}${target.path} (${strategy}): ${response.status}. Body: ${body.slice(0, 200)}`
            );
            return;
        }

        const metrics = parsePsiResponse(
            (await response.json()) as PsiResponse
        );

        if (!metrics) {
            console.error(
                `[LH] No lighthouseResult for ${target.domain}${target.path} (${strategy}).`
            );
            return;
        }

        await db.insert(lighthouseLogs).values({
            domain: target.domain,
            urlPath: target.path,
            strategy,
            ...metrics,
        });

        console.log(
            `[LH SUCCESS] ${target.domain}${target.path} (${strategy}): score=${metrics.perfScore}, LCP=${metrics.lcp}ms, TTFB=${metrics.ttfb}ms, CLS=${metrics.cls}`
        );
    } catch (err) {
        console.error(
            `[LH] Error measuring ${target.domain}${target.path} (${strategy}):`,
            err instanceof Error ? err.message : err
        );
    }
}

function buildPsiUrl(target: Target, strategy: Strategy): string {
    const params = new URLSearchParams({
        url: `https://${target.domain}${target.path}`,
        strategy,
        category: "performance",
    });
    const apiKey = process.env.PSI_API_KEY;
    if (apiKey) params.set("key", apiKey);
    return `${PSI_ENDPOINT}?${params.toString()}`;
}

function parsePsiResponse(data: PsiResponse): Metrics | null {
    const lhr = data.lighthouseResult;
    if (!lhr) return null;
    const audits = lhr.audits ?? {};
    const categories = lhr.categories ?? {};

    const auditValue = (key: string): number | null =>
        toNumberOrNull(audits[key]?.numericValue);
    const fieldPercentile = (key: string): number | null =>
        toNumberOrNull(
            data.loadingExperience?.metrics?.[key]?.percentile ??
                data.originLoadingExperience?.metrics?.[key]?.percentile
        );
    const scorePct = (key: string): number | null => {
        const score = categories[key]?.score;
        return typeof score === "number" ? Math.round(score * 100) : null;
    };
    const fieldCls = fieldPercentile("CUMULATIVE_LAYOUT_SHIFT_SCORE");

    return {
        perfScore: scorePct("performance"),
        ttfb: auditValue("server-response-time"),
        lcp: auditValue("largest-contentful-paint"),
        fcp: auditValue("first-contentful-paint"),
        speedIndex: auditValue("speed-index"),
        tbt: auditValue("total-blocking-time"),
        tti: auditValue("interactive"),
        cls: auditValue("cumulative-layout-shift"),
        loadTime: toNumberOrNull(
            audits.metrics?.details?.items?.[0]?.observedLoad
        ),
        fieldLcp: fieldPercentile("LARGEST_CONTENTFUL_PAINT_MS"),
        fieldInp: fieldPercentile("INTERACTION_TO_NEXT_PAINT"),
        fieldCls: fieldCls === null ? null : fieldCls / 100,
        fieldFcp: fieldPercentile("FIRST_CONTENTFUL_PAINT_MS"),
        fieldTtfb: fieldPercentile("EXPERIMENTAL_TIME_TO_FIRST_BYTE"),
        diagnostics: {
            mainthread_work: auditValue("mainthread-work-breakdown"),
            bootup_time: auditValue("bootup-time"),
            total_byte_weight: auditValue("total-byte-weight"),
            dom_size: auditValue("dom-size"),
            render_blocking_ms: toNumberOrNull(
                audits["render-blocking-resources"]?.details?.overallSavingsMs
            ),
            accessibility: scorePct("accessibility"),
            seo: scorePct("seo"),
            best_practices: scorePct("best-practices"),
        },
    };
}

function toNumberOrNull(value: unknown): number | null {
    if (value === null || value === undefined) return null;
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
}
