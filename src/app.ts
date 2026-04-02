import express from "express";
import cors from "cors";
import { env } from "./config/env";
import router from "./routes";
import chatRouter from "./routes/chat-route"
import { errorMiddleware } from "./middleware/error-middleware";

export const app = express();

app.use(express.json());
// TODO : Read all the
app.use(
  cors({
    origin: env.ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use("/api", router);
app.use("/api", chatRouter)


app.use(errorMiddleware);