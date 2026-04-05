import { eq, and } from "drizzle-orm";
import { db } from "../db";
import { messages } from "../db/schema";
import type { Message, NewMessage } from "../db/schema";
import { InternalServerError } from "../utils/app-error";

export interface IMessageService {
  create(message: NewMessage): Promise<Message>;
  getById(id: number): Promise<Message | null>;
  getBySessionId(sessionId: number): Promise<Message[]>;
  update(id: number, updates: Partial<NewMessage>): Promise<Message | null>;
  delete(id: number): Promise<boolean>;
}

export class MessageService implements IMessageService {
  async create(message: NewMessage): Promise<Message> {
    const result = await db.insert(messages).values(message).returning();
    if (!result || result.length === 0) {
      throw new InternalServerError(
        undefined,
        "Message Service result falsely",
      );
    }
    // TODO : error undefine
    return result[0]!;
  }

  async getById(id: number): Promise<Message | null> {
    const [message] = await db
      .select()
      .from(messages)
      .where(eq(messages.id, id))
      .limit(1);
    return message || null;
  }

  async getBySessionId(sessionId: number): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.sessionId, sessionId))
      .orderBy(messages.createdAt);
  }

  async update(
    id: number,
    updates: Partial<NewMessage>,
  ): Promise<Message | null> {
    const result = await db
      .update(messages)
      .set(updates)
      .where(eq(messages.id, id))
      .returning();
    return result.length > 0 ? result[0]! : null;
  }

  async delete(id: number): Promise<boolean> {
    const result = await db.delete(messages).where(eq(messages.id, id));
    if (!result.rowCount) return false;
    return result.rowCount > 0;
  }
}
