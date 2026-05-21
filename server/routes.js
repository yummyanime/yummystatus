import express from "express";
import pool from "./db.js";
import { locationGroups } from "./httpCheck.js";

const router = express.Router();

const HOURLY_THRESHOLD_MS = 48 * 60 * 60 * 1000;

const TIME_RANGE_CONFIG = {
    month: { interval: "30 day", spanMs: 30 * 24 * 60 * 60 * 1000 },
    week: { interval: "7 day", spanMs: 7 * 24 * 60 * 60 * 1000 },
    day: { interval: "1 day", spanMs: 24 * 60 * 60 * 1000 },
    "3hour": { interval: "3 hour", spanMs: 3 * 60 * 60 * 1000 },
};

const parseDate = (raw) => {
    if (!raw) return null;
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? null : d;
};

const buildTimeFilter = ({ type, timeRange, dateFrom, dateTo }) => {
    const from = parseDate(dateFrom);
    const to = parseDate(dateTo);

    if (from && to && from < to) {
        const spanMs = to.getTime() - from.getTime();
        const useHourly = spanMs >= HOURLY_THRESHOLD_MS;
        const tableName =
            type === "http"
                ? useHourly
                    ? "http_hourly_logs"
                    : "http_logs"
                : useHourly
                  ? "ping_hourly_logs"
                  : "ping_logs";
        return {
            tableName,
            whereSql: "created_at >= $1 AND created_at <= $2",
            params: [from.toISOString(), to.toISOString()],
        };
    }

    const cfg = TIME_RANGE_CONFIG[timeRange] ?? TIME_RANGE_CONFIG["3hour"];
    const useHourly = cfg.spanMs >= HOURLY_THRESHOLD_MS;
    const tableName =
        type === "http"
            ? useHourly
                ? "http_hourly_logs"
                : "http_logs"
            : useHourly
              ? "ping_hourly_logs"
              : "ping_logs";
    return {
        tableName,
        whereSql: "created_at >= NOW() - $1::interval",
        params: [cfg.interval],
    };
};

router.get("/http-logs", async (req, res) => {
    try {
        const { timeRange, domain, dateFrom, dateTo } = req.query;

        const { tableName, whereSql, params } = buildTimeFilter({
            type: "http",
            timeRange,
            dateFrom,
            dateTo,
        });

        const columns = `country, city, status_code, created_at, total_time, download_time, first_byte_time, dns_time, tls_time, tcp_time, server_timing`;

        let query;
        let queryParams;

        if (domain) {
            query = `
        SELECT
          ${columns}
        FROM ${tableName}
        WHERE ${whereSql} AND city IS NOT NULL AND domain = $${params.length + 1}
        ORDER BY created_at ASC;
      `;
            queryParams = [...params, domain];
        } else {
            query = `
        SELECT
          domain, ${columns}
        FROM ${tableName}
        WHERE ${whereSql} AND city IS NOT NULL
        ORDER BY created_at ASC;
      `;
            queryParams = params;
        }

        const { rows } = await pool.query(query, queryParams);

        if (domain) {
            const logsByCountryCity = {};
            for (const row of rows) {
                const { country, city, ...logData } = row;
                if (!logsByCountryCity[country]) {
                    logsByCountryCity[country] = {};
                }
                if (!logsByCountryCity[country][city]) {
                    logsByCountryCity[country][city] = [];
                }
                logsByCountryCity[country][city].push(logData);
            }
            res.json(logsByCountryCity);
        } else {
            res.json(rows);
        }
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});

router.get("/ping-logs", async (req, res) => {
    try {
        const { timeRange, domain, dateFrom, dateTo } = req.query;

        const { tableName, whereSql, params } = buildTimeFilter({
            type: "ping",
            timeRange,
            dateFrom,
            dateTo,
        });

        const columns = `domain, country, city, rtt_avg, rtt_min, rtt_max, packet_loss, created_at`;

        let query;
        let queryParams;

        if (domain) {
            query = `
                SELECT ${columns}
                FROM ${tableName}
                WHERE ${whereSql} AND city IS NOT NULL AND domain = $${params.length + 1}
                ORDER BY created_at ASC;
            `;
            queryParams = [...params, domain];
        } else {
            query = `
                SELECT ${columns}
                FROM ${tableName}
                WHERE ${whereSql} AND city IS NOT NULL
                ORDER BY created_at ASC;
            `;
            queryParams = params;
        }

        const { rows } = await pool.query(query, queryParams);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});

router.get("/locations", (req, res) => {
    res.json(locationGroups);
});


export default router;
