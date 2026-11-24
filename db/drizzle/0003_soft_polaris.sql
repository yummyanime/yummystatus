CREATE TABLE "node_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"node_key" varchar(32) NOT NULL,
	"type" varchar(16) NOT NULL,
	"source" varchar(8) NOT NULL,
	"details" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP INDEX "idx_ping_hourly_logs_domain_created_at";--> statement-breakpoint
DROP INDEX "idx_ping_logs_domain_created_at";--> statement-breakpoint
DROP INDEX "uq_ping_hourly_logs_key";--> statement-breakpoint
ALTER TABLE "ping_hourly_logs" ADD COLUMN "kind" varchar(8) DEFAULT 'site' NOT NULL;--> statement-breakpoint
ALTER TABLE "ping_logs" ADD COLUMN "kind" varchar(8) DEFAULT 'site' NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_node_events_node_key_created_at" ON "node_events" USING btree ("node_key","created_at");--> statement-breakpoint
CREATE INDEX "idx_node_events_created_at" ON "node_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_ping_hourly_logs_kind_domain_created_at" ON "ping_hourly_logs" USING btree ("kind","domain","created_at");--> statement-breakpoint
CREATE INDEX "idx_ping_hourly_logs_kind_created_at" ON "ping_hourly_logs" USING btree ("kind","created_at");--> statement-breakpoint
CREATE INDEX "idx_ping_logs_kind_domain_created_at" ON "ping_logs" USING btree ("kind","domain","created_at");--> statement-breakpoint
CREATE INDEX "idx_ping_logs_kind_created_at" ON "ping_logs" USING btree ("kind","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_ping_hourly_logs_key" ON "ping_hourly_logs" USING btree ("created_at","kind","domain","country","city");