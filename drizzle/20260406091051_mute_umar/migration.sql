ALTER TYPE "outbox_status" ADD VALUE 'FAILED';--> statement-breakpoint
ALTER TABLE "outboxes" ADD COLUMN "error" text;