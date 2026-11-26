CREATE TABLE "probe_pins" (
	"set" varchar PRIMARY KEY NOT NULL,
	"measurement_id" varchar NOT NULL,
	"slots" jsonb NOT NULL,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
DELETE FROM "node_events" WHERE "source" = 'ru';
--> statement-breakpoint
UPDATE "node_events" SET "details" = jsonb_set("details", '{failed}', (SELECT jsonb_agg(CASE WHEN jsonb_typeof(f.e) = 'string' THEN jsonb_build_object('city', f.e #>> '{}', 'asn', 0, 'network', '') ELSE f.e END ORDER BY f.i) FROM jsonb_array_elements("details"->'failed') WITH ORDINALITY AS f(e, i))) WHERE jsonb_typeof("details"->'failed') = 'array' AND EXISTS (SELECT 1 FROM jsonb_array_elements("details"->'failed') AS x(e) WHERE jsonb_typeof(x.e) = 'string');
