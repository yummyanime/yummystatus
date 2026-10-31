import { join } from "node:path";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate as runMigrations } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import * as schema from "./schema.ts";

const pool = new Pool({
    host: "db",
    port: 5432,
    database: "yummystatus",
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

export const db = drizzle(pool, { schema });

export async function migrate(): Promise<void> {
    await runMigrations(db, {
        migrationsFolder: join(import.meta.dirname, "../drizzle"),
    });
}

export async function closeDb(): Promise<void> {
    await pool.end();
}
