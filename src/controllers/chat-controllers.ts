import type { Request, Response } from "express";
import z, { json, ZodError } from "zod";
import { env } from "../config/env";
import { systemPrompt } from "../prompts/system-prompt";
import Groq from "groq-sdk";
import { InternalServerError } from "../utils/app-error";
import { sendSuccess } from "../utils/api-response";
import { SessionService } from "../service/session-service";
import { randomUUIDv7 } from "bun";
import { MessageService } from "../service/message-service";
import { VideoOutBoxService } from "../service/video-outbox-service";

const chatBodyZodSchema = z.object({
  prompt: z.string().min(2, {
    message: "Prompt must be at least 2 characters",
  }),
});

const chatParamZodSchema = z.object({
  sessionId: z.number().optional(),
});

const groq = new Groq({ apiKey: env.GROQ });

export const chatController = async (req: Request, res: Response) => {
  const zodResult = chatBodyZodSchema.safeParse(req.body);

  if (!zodResult.success) throw zodResult.error;

  const { prompt } = zodResult.data;

  const groqRes = await groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content: `${systemPrompt}`,
      },
      {
        role: "user",
        content: `${prompt}`,
      },
    ],
    model: "openai/gpt-oss-20b",
  });

  const isVideoGen = groqRes.choices[0]?.message?.content;

  if (!isVideoGen) throw new InternalServerError();

  const { intent, response, shouldGenerateVideo } = JSON.parse(isVideoGen);

  const zodParamRes = chatParamZodSchema.safeParse(req.params);

  if (!zodParamRes) throw zodResult.error;

  let sessionId = zodParamRes.data?.sessionId;

  if (!sessionId) {
    const newSession = await new SessionService().create({
      title: prompt,
      userId: parseInt(randomUUIDv7()),
    });

    sessionId = newSession?.id;
  }

  const newMessage = new MessageService().create({
    prompt,
    sessionId: sessionId as number,
  });

  if (!shouldGenerateVideo) {
    return sendSuccess(
      res,
      {
        intent,
        response,
        shouldGenerateVideo,
      },
      {
        message: "generate text successfully",
        statusCode: 200,
      },
    );
  }

  const result = await new VideoOutBoxService().create(
    {
      userId: parseInt(randomUUIDv7()), // TODO: fix userId
      prompt,
    },
    "VIDEO_GENERATE",
    { prompt },
  );

  // TODO: handle result

  sendSuccess(res, null, {
    message: "generating video",
    statusCode: 200,
  });
};
