CREATE TABLE "user_progress" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"episode_id" text NOT NULL,
	"position_seconds" integer DEFAULT 0 NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_favorites" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"story_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_episode_id_episode_id_fk" FOREIGN KEY ("episode_id") REFERENCES "public"."episode"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_favorites" ADD CONSTRAINT "user_favorites_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_favorites" ADD CONSTRAINT "user_favorites_story_id_story_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."story"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "user_progress_user_episode_idx" ON "user_progress" USING btree ("user_id","episode_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_favorites_user_story_idx" ON "user_favorites" USING btree ("user_id","story_id");