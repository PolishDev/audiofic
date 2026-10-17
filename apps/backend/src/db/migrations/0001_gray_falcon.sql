CREATE TABLE "genre" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"icon" text,
	"color" text,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "genre_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "story" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"synopsis" text NOT NULL,
	"cover_url" text NOT NULL,
	"thumbnail_url" text,
	"author" text DEFAULT 'ShortStory' NOT NULL,
	"status" text DEFAULT 'published' NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"views_count" integer DEFAULT 0 NOT NULL,
	"plays_count" integer DEFAULT 0 NOT NULL,
	"trending_score" real DEFAULT 0 NOT NULL,
	"last_activity_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "story_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "episode" (
	"id" text PRIMARY KEY NOT NULL,
	"story_id" text NOT NULL,
	"season_number" integer DEFAULT 1 NOT NULL,
	"episode_number" integer NOT NULL,
	"title" text NOT NULL,
	"synopsis" text,
	"duration_seconds" integer DEFAULT 0 NOT NULL,
	"audio_url" text NOT NULL,
	"is_premium" boolean DEFAULT false NOT NULL,
	"plays_count" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'published' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "story_genre" (
	"story_id" text NOT NULL,
	"genre_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "story_genre_story_id_genre_id_pk" PRIMARY KEY("story_id","genre_id")
);
--> statement-breakpoint
CREATE TABLE "story_metric_event" (
	"id" text PRIMARY KEY NOT NULL,
	"story_id" text NOT NULL,
	"event_type" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "episode" ADD CONSTRAINT "episode_story_id_story_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."story"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_genre" ADD CONSTRAINT "story_genre_story_id_story_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."story"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_genre" ADD CONSTRAINT "story_genre_genre_id_genre_id_fk" FOREIGN KEY ("genre_id") REFERENCES "public"."genre"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_metric_event" ADD CONSTRAINT "story_metric_event_story_id_story_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."story"("id") ON DELETE cascade ON UPDATE no action;