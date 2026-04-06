import { db } from "../db";
import { outboxes, videos, type NewVideo } from "../db/schema";
import { eq, sql } from "drizzle-orm";
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
}
