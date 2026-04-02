CREATE TYPE "outbox_status" AS ENUM('PENDING', 'PROCESSED');--> statement-breakpoint
CREATE TYPE "video_status" AS ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');--> statement-breakpoint
CREATE TABLE "chat_sessions" (
	"id" serial PRIMARY KEY,
	"user_id" integer NOT NULL,
	"title" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY,
	"session_id" integer NOT NULL,
	"video_id" integer,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "outboxes" (
	"id" serial PRIMARY KEY,
	"video_id" integer NOT NULL,
	"event_type" text NOT NULL,
	"payload" jsonb,
	"status" "outbox_status" DEFAULT 'PENDING'::"outbox_status" NOT NULL,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"processed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "processed_events" (
	"id" serial PRIMARY KEY,
	"event_id" integer NOT NULL UNIQUE,
	"processed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY,
	"username" text NOT NULL UNIQUE,
	"email" text NOT NULL UNIQUE,
	"password_hash" text,
	"google_id" text UNIQUE,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "videos" (
	"id" serial PRIMARY KEY,
	"user_id" integer NOT NULL,
	"prompt" text NOT NULL,
	"status" "video_status" DEFAULT 'PENDING'::"video_status" NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"video_url" text,
	"error" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "chat_sessions_user_id_idx" ON "chat_sessions" ("user_id");--> statement-breakpoint
CREATE INDEX "messages_session_id_idx" ON "messages" ("session_id");--> statement-breakpoint
CREATE INDEX "messages_video_id_idx" ON "messages" ("video_id");--> statement-breakpoint
CREATE INDEX "outboxes_video_id_idx" ON "outboxes" ("video_id");--> statement-breakpoint
CREATE INDEX "outboxes_status_idx" ON "outboxes" ("status");--> statement-breakpoint
CREATE INDEX "processed_events_event_id_idx" ON "processed_events" ("event_id");--> statement-breakpoint
CREATE INDEX "videos_user_id_idx" ON "videos" ("user_id");--> statement-breakpoint
CREATE INDEX "videos_status_idx" ON "videos" ("status");--> statement-breakpoint
ALTER TABLE "chat_sessions" ADD CONSTRAINT "chat_sessions_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_session_id_chat_sessions_id_fkey" FOREIGN KEY ("session_id") REFERENCES "chat_sessions"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_video_id_videos_id_fkey" FOREIGN KEY ("video_id") REFERENCES "videos"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "outboxes" ADD CONSTRAINT "outboxes_video_id_videos_id_fkey" FOREIGN KEY ("video_id") REFERENCES "videos"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "videos" ADD CONSTRAINT "videos_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;