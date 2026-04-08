import { Queue, Worker } from "bullmq";
import { env } from "../config/env";

export const myQueue = new Queue("myqueue", {
  connection: {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
  },
});




const worker = new Worker()