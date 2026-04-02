import { db } from "../db";
import { chatSessions,  type NewChatSession } from "../db/schema";
import { InternalServerError } from "../utils/app-error";

export interface ISessionService {}

export class SessionService implements ISessionService {
  async create(chatSession: NewChatSession) {
    const result = await db
      .insert(chatSessions)
      .values(chatSession)
      .returning();

    if (result.length <= 0) throw new InternalServerError();

    return result[0];
  }
}
