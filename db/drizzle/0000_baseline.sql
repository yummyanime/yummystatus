CREATE TABLE IF NOT EXISTS "http_hourly_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"domain" varchar(255),
	"country" varchar(2),
	"city" varchar(255),
	"status_code" integer,
	"total_time" double precision,
	"download_time" double precision,
	"first_byte_time" double precision,
	"dns_time" double precision,
	"tls_time" double precision,
	"tcp_time" double precision,
	"created_at" timestamp,
	"server_timing" jsonb
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "http_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"probe_id" varchar(255),
	"domain" varchar(255),
	"country" varchar(2),
	"city" varchar(255),
	"asn" integer,
	"network" varchar(255),
	"status_code" integer,
	"total_time" double precision,
	"download_time" double precision,
	"first_byte_time" double precision,
	"dns_time" double precision,
	"tls_time" double precision,
	"tcp_time" double precision,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"server_timing" jsonb,
	"failure_reason" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lighthouse_hourly_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"domain" varchar(255),
	"url_path" varchar(512),
	"strategy" varchar(16),
	"perf_score" double precision,
	"ttfb" double precision,
	"lcp" double precision,
	"fcp" double precision,
	"speed_index" double precision,
	"tbt" double precision,
	"tti" double precision,
	"cls" double precision,
	"load_time" double precision,
	"field_lcp" double precision,
	"field_inp" double precision,
	"field_cls" double precision,
	"field_fcp" double precision,
	"field_ttfb" double precision,
	"diagnostics" jsonb,
	"created_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lighthouse_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"domain" varchar(255),
	"url_path" varchar(512),
	"strategy" varchar(16),
	"perf_score" double precision,
	"ttfb" double precision,
	"lcp" double precision,
	"fcp" double precision,
	"speed_index" double precision,
	"tbt" double precision,
	"tti" double precision,
	"cls" double precision,
	"load_time" double precision,
	"field_lcp" double precision,
	"field_inp" double precision,
	"field_cls" double precision,
	"field_fcp" double precision,
	"field_ttfb" double precision,
	"diagnostics" jsonb,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "outage_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"domain" varchar(255),
	"reasons" varchar(64)[] NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ping_hourly_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"domain" varchar(255),
	"country" varchar(2),
	"city" varchar(255),
	"rtt_min" double precision,
	"rtt_avg" double precision,
	"rtt_max" double precision,
	"packet_loss" double precision,
	"created_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ping_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"probe_id" varchar(255),
	"domain" varchar(255),
	"country" varchar(2),
	"city" varchar(255),
	"asn" integer,
	"network" varchar(255),
	"rtt_min" double precision,
	"rtt_avg" double precision,
	"rtt_max" double precision,
	"packet_loss" double precision,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_http_hourly_logs_domain_created_at" ON "http_hourly_logs" USING btree ("domain","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_http_hourly_logs_created_at" ON "http_hourly_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_http_logs_domain_created_at" ON "http_logs" USING btree ("domain","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_http_logs_created_at" ON "http_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_http_logs_domain_loc_created_at" ON "http_logs" USING btree ("domain","country","city","created_at" DESC);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_lighthouse_hourly_logs_domain_strategy_created_at" ON "lighthouse_hourly_logs" USING btree ("domain","strategy","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_lighthouse_logs_domain_strategy_created_at" ON "lighthouse_logs" USING btree ("domain","strategy","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_outage_reports_created_at" ON "outage_reports" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ping_hourly_logs_domain_created_at" ON "ping_hourly_logs" USING btree ("domain","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ping_hourly_logs_created_at" ON "ping_hourly_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ping_logs_domain_created_at" ON "ping_logs" USING btree ("domain","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ping_logs_created_at" ON "ping_logs" USING btree ("created_at");