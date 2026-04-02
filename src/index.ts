// backend-service/src/index.ts
import "dotenv/config";
import { app } from "./app";
import { env } from "./config/env";
import { db } from "./db"; // Import the db connection
import { sql } from "drizzle-orm";

async function startServer() {
  try {
    // TODO : what if the database taking time to connect
    await db.execute(sql`select 1`);
    console.log("Database connected successfully");

    app.listen(env.PORT, () => {
      console.log(` Server running on port ${env.PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
