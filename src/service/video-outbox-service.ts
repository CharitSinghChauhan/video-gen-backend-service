import { db } from "../db";
import {
  outboxes,
  videos,
  type NewOutbox,
  type NewVideo,
  type Video,
} from "../db/schema";
import { eq } from "drizzle-orm";
import { InternalServerError } from "../utils/app-error";
import { logger } from "../utils/logger";

export class VideoOutBoxService {
  async create(
    video: NewVideo,
    eventType: string,
    payload?: Record<string, unknown>,
  ) {
    let videoResult;
    let outboxResult;
    try {
      await db.transaction(async (tx) => {
        [videoResult] = await tx.insert(videos).values(video).returning();
        if (!videoResult)
          throw new InternalServerError(
            undefined,
            "VideoOutboxService videoResult undefined",
          );
        [outboxResult] = await tx
          .insert(outboxes)
          .values({
            videoId: videoResult.id,
            eventType,
            payload,
          })
          .returning();
      });
    } catch (error) {
      logger.error({ error }, "Failed to create video outbox");
      throw new InternalServerError(undefined, error);
    }

    if (!outboxResult)
      throw new InternalServerError(
        undefined,
        "VideoOutboxService outboxResult undefined",
      );

    return {
      video: videoResult,
      outbox: outboxResult,
    };
  }

  async getPendingOutboxes() {
    return await db
      .select()
      .from(outboxes)
      .where(eq(outboxes.status, "PENDING"));
  }

  async processPendingOutboxes() {
    const pendingOutboxes = await this.getPendingOutboxes();
    for (const outbox of pendingOutboxes) {
      try {
        // Placeholder: Here you would send the event to a message queue or external service
        // For example: await messageQueue.send(outbox.eventType, outbox.payload);
        logger.info(
          {
            outboxId: outbox.id,
            eventType: outbox.eventType,
            payload: outbox.payload,
          },
          "Processing outbox",
        );

        // Mark as processed
        await db
          .update(outboxes)
          .set({
            status: "PROCESSED",
            processedAt: new Date(),
          })
          .where(eq(outboxes.id, outbox.id));
      } catch (error) {
        // Increment retry count
        await db
          .update(outboxes)
          .set({
            retryCount: outbox.retryCount + 1,
          })
          .where(eq(outboxes.id, outbox.id));
        // Optionally, mark as failed if retryCount > max
      }
    }
  }
}
