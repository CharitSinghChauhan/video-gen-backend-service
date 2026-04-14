
import { db } from "../db";
import { outboxes} from "../db/schema";
import { logger } from "../utils/logger";
import { myQueue } from "../queue";
import { eq } from "drizzle-orm";

export class PollingCDCWorker {
  public isRunning: boolean;

  constructor() {
    this.isRunning = true;
  }

  async start() {
    if (!this.isRunning) {
      logger.info("CDC Woker is already working");
      return;
    }

    setInterval(async () => {
      let pendingOutbox = await db
        .select()
        .from(outboxes)
        .where(eq(outboxes.status, "PENDING"))
        .orderBy(outboxes.createdAt);

      if (!pendingOutbox) return;

      myQueue.add("process-outbox", pendingOutbox);

      console.log(pendingOutbox);
      pendingOutbox = null;
    }, 5000);
  }
}

const p1 = new PollingCDCWorker();
p1.start();
