import {
    httpHourlyLogs,
    httpLogs,
    lighthouseHourlyLogs,
    lighthouseLogs,
    pingHourlyLogs,
    pingLogs,
} from "@yummystatus/db";
import { db } from "@yummystatus/db/client";
import { getTableName, lt, sql } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";

const RETENTION_DAYS = 40;

const TABLES = [
    { table: httpLogs, createdAt: httpLogs.createdAt },
    { table: httpHourlyLogs, createdAt: httpHourlyLogs.createdAt },
    { table: pingLogs, createdAt: pingLogs.createdAt },
    { table: pingHourlyLogs, createdAt: pingHourlyLogs.createdAt },
    { table: lighthouseLogs, createdAt: lighthouseLogs.createdAt },
    { table: lighthouseHourlyLogs, createdAt: lighthouseHourlyLogs.createdAt },
];

export async function cleanupOldLogs(): Promise<void> {
    console.log(
        `--- Starting log cleanup at ${new Date().toISOString()} (Older than ${RETENTION_DAYS} days) ---`
    );
    for (const { table, createdAt } of TABLES) {
        const result = await db
            .delete(table as PgTable)
            .where(
                lt(createdAt, sql`NOW() - ${`${RETENTION_DAYS} day`}::interval`)
            );
        console.log(
            `Log cleanup completed. Deleted ${result.rowCount} rows from ${getTableName(table)}.`
        );
    }
}
