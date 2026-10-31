import { closeDb, migrate } from "@yummystatus/db/client";
import { app } from "./app.ts";

await migrate();

const server = Bun.serve({
    fetch: app.fetch,
    port: 3000,
    hostname: "0.0.0.0",
});
console.log(`API listening on :${server.port}`);

let shuttingDown = false;
const shutdown = async () => {
    if (shuttingDown) return;
    shuttingDown = true;
    await server.stop();
    await closeDb();
    process.exit(0);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
