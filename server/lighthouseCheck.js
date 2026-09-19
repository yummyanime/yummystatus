import pool from "./db.js";
import fetch from "node-fetch";

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

export const lighthouseTargets = LIGHTHOUSE_DOMAINS.flatMap((domain) =>
    LIGHTHOUSE_PATHS.map((path) => ({ domain, path }))
);

export const lighthouseStrategies = ["mobile", "desktop"];

const PSI_ENDPOINT =
    "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";

export const LIGHTHOUSE_NUMERIC_FIELDS = [
    "perf_score",
    "ttfb",
    "lcp",
    "fcp",
    "speed_index",
    "tbt",
    "tti",
    "cls",
    "field_lcp",
    "field_inp",
    "field_cls",
    "field_fcp",
    "field_ttfb",
];

const toNumberOrNull = (value) => {
    if (value === null || value === undefined) return null;
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
};

const auditValue = (audits, key) => {
    const audit = audits?.[key];
    if (!audit) return null;
    return toNumberOrNull(audit.numericValue);
};

const fieldPercentile = (data, key) => {
    const url = data?.loadingExperience?.metrics?.[key]?.percentile;
    const origin = data?.originLoadingExperience?.metrics?.[key]?.percentile;
    return toNumberOrNull(url ?? origin);
};

const buildPsiUrl = (target, strategy) => {
    const params = new URLSearchParams({
        url: `https://${target.domain}${target.path}`,
        strategy,
        category: "performance",
    });
    const apiKey = process.env.PSI_API_KEY;
    if (apiKey) params.set("key", apiKey);
    return `${PSI_ENDPOINT}?${params.toString()}`;
};

const parsePsiResponse = (data) => {
    const lhr = data?.lighthouseResult;
    if (!lhr) return null;
    const audits = lhr.audits || {};
    const categories = lhr.categories || {};

    const scorePct = (cat) =>
        cat && typeof cat.score === "number" ? Math.round(cat.score * 100) : null;

    const diagnostics = {
        mainthread_work: auditValue(audits, "mainthread-work-breakdown"),
        bootup_time: auditValue(audits, "bootup-time"),
        total_byte_weight: auditValue(audits, "total-byte-weight"),
        dom_size: auditValue(audits, "dom-size"),
        render_blocking_ms: toNumberOrNull(
            audits["render-blocking-resources"]?.details?.overallSavingsMs
        ),
        accessibility: scorePct(categories.accessibility),
        seo: scorePct(categories.seo),
        best_practices: scorePct(categories["best-practices"]),
    };

    return {
        metrics: {
            perf_score: scorePct(categories.performance),
            ttfb: auditValue(audits, "server-response-time"),
            lcp: auditValue(audits, "largest-contentful-paint"),
            fcp: auditValue(audits, "first-contentful-paint"),
            speed_index: auditValue(audits, "speed-index"),
            tbt: auditValue(audits, "total-blocking-time"),
            tti: auditValue(audits, "interactive"),
            cls: auditValue(audits, "cumulative-layout-shift"),
            field_lcp: fieldPercentile(data, "LARGEST_CONTENTFUL_PAINT_MS"),
            field_inp: fieldPercentile(data, "INTERACTION_TO_NEXT_PAINT"),
            field_cls: (() => {
                const raw = fieldPercentile(data, "CUMULATIVE_LAYOUT_SHIFT_SCORE");
                return raw === null ? null : raw / 100;
            })(),
            field_fcp: fieldPercentile(data, "FIRST_CONTENTFUL_PAINT_MS"),
            field_ttfb: fieldPercentile(data, "EXPERIMENTAL_TIME_TO_FIRST_BYTE"),
        },
        diagnostics,
    };
};

const saveLighthouseResult = async (target, strategy, parsed) => {
    const m = parsed.metrics;
    const query = `
      INSERT INTO lighthouse_logs (
        domain, url_path, strategy,
        perf_score, ttfb, lcp, fcp, speed_index, tbt, tti, cls,
        field_lcp, field_inp, field_cls, field_fcp, field_ttfb,
        diagnostics
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
    `;
    const values = [
        target.domain,
        target.path,
        strategy,
        m.perf_score,
        m.ttfb,
        m.lcp,
        m.fcp,
        m.speed_index,
        m.tbt,
        m.tti,
        m.cls,
        m.field_lcp,
        m.field_inp,
        m.field_cls,
        m.field_fcp,
        m.field_ttfb,
        parsed.diagnostics ? JSON.stringify(parsed.diagnostics) : null,
    ];
    await pool.query(query, values);
};

const measureOne = async (target, strategy) => {
    const url = buildPsiUrl(target, strategy);
    try {
        const response = await fetch(url);

        if (!response.ok) {
            const body = await response.text();
            console.error(
                `[LH] PSI failed for ${target.domain}${target.path} (${strategy}): ${response.status}. Body: ${body.slice(0, 200)}`
            );
            return;
        }

        const data = await response.json();
        const parsed = parsePsiResponse(data);

        if (!parsed) {
            console.error(
                `[LH] No lighthouseResult for ${target.domain}${target.path} (${strategy}).`
            );
            return;
        }

        await saveLighthouseResult(target, strategy, parsed);

        console.log(
            `[LH SUCCESS] ${target.domain}${target.path} (${strategy}): score=${parsed.metrics.perf_score}, LCP=${parsed.metrics.lcp}ms, TTFB=${parsed.metrics.ttfb}ms, CLS=${parsed.metrics.cls}`
        );
    } catch (err) {
        console.error(
            `[LH] Error measuring ${target.domain}${target.path} (${strategy}):`,
            err.message
        );
    }
};

export const lighthouseCheckAndSave = async () => {
    console.log(
        `--- Starting Lighthouse check cycle at ${new Date().toISOString()} for ${lighthouseTargets.length} targets ---`
    );
    for (const target of lighthouseTargets) {
        for (const strategy of lighthouseStrategies) {
            await measureOne(target, strategy);
        }
    }
    console.log("--- Lighthouse check cycle completed. ---");
};

export const aggregateHourlyLighthouseData = async () => {
    console.log(
        `--- Starting hourly Lighthouse aggregation at ${new Date().toISOString()} ---`
    );
    try {
        const avgCols = LIGHTHOUSE_NUMERIC_FIELDS.map(
            (f) => `ROUND(AVG(${f})::numeric, 3) AS ${f}`
        ).join(",\n                ");

        const query = `
            INSERT INTO lighthouse_hourly_logs (
                domain, url_path, strategy,
                ${LIGHTHOUSE_NUMERIC_FIELDS.join(", ")},
                created_at
            )
            SELECT
                domain,
                url_path,
                strategy,
                ${avgCols},
                date_trunc('hour', NOW()) AS created_at
            FROM lighthouse_logs
            WHERE created_at >= NOW() - INTERVAL '1 hour'
            GROUP BY domain, url_path, strategy;
        `;
        await pool.query(query);

        const diagQuery = `
            WITH per_metric AS (
                SELECT
                    domain, url_path, strategy,
                    j.key,
                    AVG((j.value)::numeric) AS avg_val
                FROM lighthouse_logs l
                CROSS JOIN LATERAL jsonb_each_text(l.diagnostics) j
                WHERE l.created_at >= NOW() - INTERVAL '1 hour'
                  AND l.diagnostics IS NOT NULL
                  AND j.value ~ '^-?[0-9.]+$'
                GROUP BY domain, url_path, strategy, j.key
            ),
            diag_agg AS (
                SELECT
                    domain, url_path, strategy,
                    jsonb_object_agg(key, ROUND(avg_val, 2)) AS diagnostics
                FROM per_metric
                GROUP BY domain, url_path, strategy
            )
            UPDATE lighthouse_hourly_logs h
            SET diagnostics = da.diagnostics
            FROM diag_agg da
            WHERE h.domain = da.domain
              AND h.url_path = da.url_path
              AND h.strategy = da.strategy
              AND h.created_at = date_trunc('hour', NOW());
        `;
        await pool.query(diagQuery);

        console.log("Hourly Lighthouse aggregation completed successfully.");
    } catch (err) {
        console.error("Error during hourly Lighthouse aggregation:", err);
    }
};

export const cleanupOldLighthouseLogs = async () => {
    console.log(
        `--- Starting Lighthouse log cleanup at ${new Date().toISOString()} ---`
    );
    try {
        const detailed = await pool.query(
            `DELETE FROM lighthouse_logs WHERE created_at < NOW() - INTERVAL '40 day';`
        );
        console.log(
            `Lighthouse logs cleanup: deleted ${detailed.rowCount} rows from lighthouse_logs.`
        );

        const hourly = await pool.query(
            `DELETE FROM lighthouse_hourly_logs WHERE created_at < NOW() - INTERVAL '40 day';`
        );
        console.log(
            `Lighthouse hourly logs cleanup: deleted ${hourly.rowCount} rows from lighthouse_hourly_logs.`
        );
    } catch (err) {
        console.error("Error during Lighthouse log cleanup:", err);
    }
};
