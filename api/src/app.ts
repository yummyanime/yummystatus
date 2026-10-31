import { Hono } from "hono";
import { healthRoute } from "./routes/health.ts";
import { httpLogsRoute } from "./routes/httpLogs.ts";
import { lighthouseLogsRoute } from "./routes/lighthouseLogs.ts";
import { locationsRoute } from "./routes/locations.ts";
import { outageReportsRoute } from "./routes/outageReports.ts";
import { pingLogsRoute } from "./routes/pingLogs.ts";
import { statusSummaryRoute } from "./routes/statusSummary.ts";

export const app = new Hono()
    .basePath("/api")
    .get("/healthz", (c) => c.json({ ok: true }))
    .route("/", httpLogsRoute)
    .route("/", pingLogsRoute)
    .route("/", locationsRoute)
    .route("/", lighthouseLogsRoute)
    .route("/", statusSummaryRoute)
    .route("/", outageReportsRoute)
    .route("/", healthRoute)
    .onError((err, c) => {
        console.error("request failed", c.req.method, c.req.path, err);
        return c.text("Server Error", 500);
    });

export type AppType = typeof app;
