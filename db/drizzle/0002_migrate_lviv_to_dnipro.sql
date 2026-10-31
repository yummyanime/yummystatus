DELETE FROM "http_hourly_logs" "l" WHERE "l"."country" = 'UA' AND "l"."city" = 'Lviv' AND EXISTS (SELECT 1 FROM "http_hourly_logs" "d" WHERE "d"."created_at" = "l"."created_at" AND "d"."domain" = "l"."domain" AND "d"."country" = 'UA' AND "d"."city" = 'Dnipro');--> statement-breakpoint
DELETE FROM "ping_hourly_logs" "l" WHERE "l"."country" = 'UA' AND "l"."city" = 'Lviv' AND EXISTS (SELECT 1 FROM "ping_hourly_logs" "d" WHERE "d"."created_at" = "l"."created_at" AND "d"."domain" = "l"."domain" AND "d"."country" = 'UA' AND "d"."city" = 'Dnipro');--> statement-breakpoint
UPDATE "http_hourly_logs" SET "city" = 'Dnipro' WHERE "country" = 'UA' AND "city" = 'Lviv';--> statement-breakpoint
UPDATE "ping_hourly_logs" SET "city" = 'Dnipro' WHERE "country" = 'UA' AND "city" = 'Lviv';--> statement-breakpoint
UPDATE "http_logs" SET "city" = 'Dnipro' WHERE "country" = 'UA' AND "city" = 'Lviv';--> statement-breakpoint
UPDATE "ping_logs" SET "city" = 'Dnipro' WHERE "country" = 'UA' AND "city" = 'Lviv';
