ALTER TABLE "messages" RENAME COLUMN "content" TO "response";--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "prompt" text NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ALTER COLUMN "response" DROP NOT NULL;