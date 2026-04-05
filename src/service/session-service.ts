import { db } from "../db";
import {
  chatSessions,
  type ChatSession,
  type NewChatSession,
} from "../db/schema";
import { InternalServerError } from "../utils/app-error";

export interface ISessionService {
  create(chatSession: NewChatSession): Promise<ChatSession>;
}

export class SessionService implements ISessionService {
  async create(chatSession: NewChatSession) {
    const [result] = await db
      .insert(chatSessions)
      .values(chatSession)
      .returning();

    if (!result) throw new InternalServerError(undefined, "session serive result falsely");

    return result;
  }
}
