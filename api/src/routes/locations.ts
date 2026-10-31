import { Hono } from "hono";
import { locationGroups } from "../../../domains.ts";

export const locationsRoute = new Hono().get("/locations", (c) =>
    c.json(locationGroups)
);
