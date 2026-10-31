import { sql } from "drizzle-orm";
import {
    doublePrecision,
    index,
    integer,
    jsonb,
    pgTable,
    serial,
    text,
    timestamp,
    uniqueIndex,
    varchar,
} from "drizzle-orm/pg-core";

export const httpLogs = pgTable(
    "http_logs",
    {
        id: serial("id").primaryKey(),
        probeId: varchar("probe_id", { length: 255 }),
        domain: varchar("domain", { length: 255 }),
        country: varchar("country", { length: 2 }),
        city: varchar("city", { length: 255 }),
        asn: integer("asn"),
        network: varchar("network", { length: 255 }),
        statusCode: integer("status_code"),
        totalTime: doublePrecision("total_time"),
        downloadTime: doublePrecision("download_time"),
        firstByteTime: doublePrecision("first_byte_time"),
        dnsTime: doublePrecision("dns_time"),
        tlsTime: doublePrecision("tls_time"),
        tcpTime: doublePrecision("tcp_time"),
        createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
        serverTiming: jsonb("server_timing").$type<Record<string, number>>(),
        failureReason: text("failure_reason"),
    },
    (t) => [
        index("idx_http_logs_domain_created_at").on(t.domain, t.createdAt),
        index("idx_http_logs_created_at").on(t.createdAt),
        index("idx_http_logs_domain_loc_created_at").on(
            t.domain,
            t.country,
            t.city,
            t.createdAt.desc()
        ),
    ]
);

export const httpHourlyLogs = pgTable(
    "http_hourly_logs",
    {
        id: serial("id").primaryKey(),
        domain: varchar("domain", { length: 255 }),
        country: varchar("country", { length: 2 }),
        city: varchar("city", { length: 255 }),
        statusCode: integer("status_code"),
        totalTime: doublePrecision("total_time"),
        downloadTime: doublePrecision("download_time"),
        firstByteTime: doublePrecision("first_byte_time"),
        dnsTime: doublePrecision("dns_time"),
        tlsTime: doublePrecision("tls_time"),
        tcpTime: doublePrecision("tcp_time"),
        createdAt: timestamp("created_at"),
        serverTiming: jsonb("server_timing").$type<Record<string, number>>(),
    },
    (t) => [
        index("idx_http_hourly_logs_domain_created_at").on(
            t.domain,
            t.createdAt
        ),
        index("idx_http_hourly_logs_created_at").on(t.createdAt),
        uniqueIndex("uq_http_hourly_logs_key").on(
            t.createdAt,
            t.domain,
            t.country,
            t.city
        ),
    ]
);

export const pingLogs = pgTable(
    "ping_logs",
    {
        id: serial("id").primaryKey(),
        probeId: varchar("probe_id", { length: 255 }),
        domain: varchar("domain", { length: 255 }),
        country: varchar("country", { length: 2 }),
        city: varchar("city", { length: 255 }),
        asn: integer("asn"),
        network: varchar("network", { length: 255 }),
        rttMin: doublePrecision("rtt_min"),
        rttAvg: doublePrecision("rtt_avg"),
        rttMax: doublePrecision("rtt_max"),
        packetLoss: doublePrecision("packet_loss"),
        createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
    },
    (t) => [
        index("idx_ping_logs_domain_created_at").on(t.domain, t.createdAt),
        index("idx_ping_logs_created_at").on(t.createdAt),
    ]
);

export const pingHourlyLogs = pgTable(
    "ping_hourly_logs",
    {
        id: serial("id").primaryKey(),
        domain: varchar("domain", { length: 255 }),
        country: varchar("country", { length: 2 }),
        city: varchar("city", { length: 255 }),
        rttMin: doublePrecision("rtt_min"),
        rttAvg: doublePrecision("rtt_avg"),
        rttMax: doublePrecision("rtt_max"),
        packetLoss: doublePrecision("packet_loss"),
        createdAt: timestamp("created_at"),
    },
    (t) => [
        index("idx_ping_hourly_logs_domain_created_at").on(
            t.domain,
            t.createdAt
        ),
        index("idx_ping_hourly_logs_created_at").on(t.createdAt),
        uniqueIndex("uq_ping_hourly_logs_key").on(
            t.createdAt,
            t.domain,
            t.country,
            t.city
        ),
    ]
);

export const lighthouseLogs = pgTable(
    "lighthouse_logs",
    {
        id: serial("id").primaryKey(),
        domain: varchar("domain", { length: 255 }),
        urlPath: varchar("url_path", { length: 512 }),
        strategy: varchar("strategy", { length: 16 }),
        perfScore: doublePrecision("perf_score"),
        ttfb: doublePrecision("ttfb"),
        lcp: doublePrecision("lcp"),
        fcp: doublePrecision("fcp"),
        speedIndex: doublePrecision("speed_index"),
        tbt: doublePrecision("tbt"),
        tti: doublePrecision("tti"),
        cls: doublePrecision("cls"),
        loadTime: doublePrecision("load_time"),
        fieldLcp: doublePrecision("field_lcp"),
        fieldInp: doublePrecision("field_inp"),
        fieldCls: doublePrecision("field_cls"),
        fieldFcp: doublePrecision("field_fcp"),
        fieldTtfb: doublePrecision("field_ttfb"),
        diagnostics:
            jsonb("diagnostics").$type<Record<string, number | null>>(),
        createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
    },
    (t) => [
        index("idx_lighthouse_logs_domain_strategy_created_at").on(
            t.domain,
            t.strategy,
            t.createdAt
        ),
    ]
);

export const lighthouseHourlyLogs = pgTable(
    "lighthouse_hourly_logs",
    {
        id: serial("id").primaryKey(),
        domain: varchar("domain", { length: 255 }),
        urlPath: varchar("url_path", { length: 512 }),
        strategy: varchar("strategy", { length: 16 }),
        perfScore: doublePrecision("perf_score"),
        ttfb: doublePrecision("ttfb"),
        lcp: doublePrecision("lcp"),
        fcp: doublePrecision("fcp"),
        speedIndex: doublePrecision("speed_index"),
        tbt: doublePrecision("tbt"),
        tti: doublePrecision("tti"),
        cls: doublePrecision("cls"),
        loadTime: doublePrecision("load_time"),
        fieldLcp: doublePrecision("field_lcp"),
        fieldInp: doublePrecision("field_inp"),
        fieldCls: doublePrecision("field_cls"),
        fieldFcp: doublePrecision("field_fcp"),
        fieldTtfb: doublePrecision("field_ttfb"),
        diagnostics:
            jsonb("diagnostics").$type<Record<string, number | null>>(),
        createdAt: timestamp("created_at"),
    },
    (t) => [
        index("idx_lighthouse_hourly_logs_domain_strategy_created_at").on(
            t.domain,
            t.strategy,
            t.createdAt
        ),
        uniqueIndex("uq_lighthouse_hourly_logs_key").on(
            t.createdAt,
            t.domain,
            t.urlPath,
            t.strategy
        ),
    ]
);

export const outageReports = pgTable(
    "outage_reports",
    {
        id: serial("id").primaryKey(),
        domain: varchar("domain", { length: 255 }),
        reasons: varchar("reasons", { length: 64 }).array().notNull(),
        createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
    },
    (t) => [index("idx_outage_reports_created_at").on(t.createdAt)]
);
