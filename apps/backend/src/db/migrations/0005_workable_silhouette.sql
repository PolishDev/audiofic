CREATE TABLE "daily_listen_quota" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"episode_id" text NOT NULL,
	"listen_date" date NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "processed_webhook_event" (
	"id" text PRIMARY KEY NOT NULL,
	"provider" text DEFAULT 'revenuecat' NOT NULL,
	"event_type" text NOT NULL,
	"app_user_id" text,
	"processed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "story" ALTER COLUMN "author" SET DEFAULT 'AudioFic';--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "subscription_status" text DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "subscription_plan" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "subscription_expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "daily_listen_quota" ADD CONSTRAINT "daily_listen_quota_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_listen_quota" ADD CONSTRAINT "daily_listen_quota_episode_id_episode_id_fk" FOREIGN KEY ("episode_id") REFERENCES "public"."episode"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "user_episode_date_idx" ON "daily_listen_quota" USING btree ("user_id","episode_id","listen_date");--> statement-breakpoint
CREATE UNIQUE INDEX "user_date_idx" ON "daily_listen_quota" USING btree ("user_id","listen_date","id");