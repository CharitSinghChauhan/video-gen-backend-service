import type { Request, Response } from "express";
import z from "zod";
import { env } from "../config/env";
import { systemPrompt } from "../prompts/system-prompt";
import Groq from "groq-sdk";
import { InternalServerError } from "../utils/app-error";
import { sendSuccess } from "../utils/api-response";
import { SessionService } from "../service/session-service";
import { MessageService } from "../service/message-service";
import { VideoOutBoxService } from "../service/video-outbox-service";
import { logger } from "../utils/logger";

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

  if (!isVideoGen)
    throw new InternalServerError(undefined, "isVideoGen is falsely");

  logger.info({ isVideoGen }, "Received response from Groq AI");

  // json parsing error
  const {
    intent,
    response: groqResponse,
    shouldGenerateVideo,
  } = JSON.parse(isVideoGen);

  const zodParamRes = chatParamZodSchema.safeParse(req.params);

  if (!zodParamRes) throw zodResult.error;

  let sessionId = zodParamRes.data?.sessionId;

  if (!sessionId) {
    const newSession = await new SessionService().create({
      title: prompt,
      userId: 1,
    });

    sessionId = newSession?.id;
  }

  const newMessage = await new MessageService().create({
    prompt,
    sessionId: sessionId as number,
    response: groqResponse,
  });

  if (!shouldGenerateVideo) {
    return sendSuccess(
      res,
      {
        intent,
        response: groqResponse,
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
      userId: 1, // TODO: fix userId
      prompt,
    },
    "VIDEO_GENERATE",
    { prompt },
  );

  // TODO: handle result

  return sendSuccess(res, null, {
    message: "generating video",
    statusCode: 200,
  });
};
