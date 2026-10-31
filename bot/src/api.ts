import type { AppType } from "@yummystatus/api";
import type { InferResponseType } from "hono/client";
import { hc } from "hono/client";

export const API_URL = process.env.API_URL ?? "http://api:3000";

export const client = hc<AppType>(API_URL);

export type HealthReport = InferResponseType<typeof client.api.health.$get>;
