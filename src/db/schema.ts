import { defineRelations } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const videoStatusEnum = pgEnum("video_status", [
  "PENDING",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
]);

export const outboxStatusEnum = pgEnum("outbox_status", [
  "PENDING",
  "PROCESSED",
  "FAILED",
]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  googleId: text("google_id").unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const videos = pgTable(
  "videos",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    prompt: text("prompt").notNull(),
    status: videoStatusEnum("status").notNull().default("PENDING"),
    progress: integer("progress").notNull().default(0),
    videoUrl: text("video_url"),
    error: text("error"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("videos_user_id_idx").on(t.userId), // TODO how it looks in db
    index("videos_status_idx").on(t.status), // how index works
  ],
);

export const outboxes = pgTable(
  "outboxes",
  {
    id: serial("id").primaryKey(),
    videoId: integer("video_id")
      .notNull()
      .references(() => videos.id, { onDelete: "cascade" }),
    error: text("error"),
    eventType: text("event_type").notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>(),
    status: outboxStatusEnum("status").notNull().default("PENDING"),
    retryCount: integer("retry_count").notNull().default(0),
    processedAt: timestamp("processed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("outboxes_video_id_idx").on(t.videoId),
    index("outboxes_status_idx").on(t.status),
  ],
);

export const processedEvents = pgTable(
  "processed_events",
  {
    id: serial("id").primaryKey(),
    eventId: integer("event_id").notNull().unique(),
    processedAt: timestamp("processed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("processed_events_event_id_idx").on(t.eventId)],
);

export const chatSessions = pgTable(
  "chat_sessions",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [index("chat_sessions_user_id_idx").on(t.userId)],
);

export const messages = pgTable(
  "messages",
  {
    id: serial("id").primaryKey(),
    sessionId: integer("session_id")
      .notNull()
      .references(() => chatSessions.id, { onDelete: "cascade" }),
    videoId: integer("video_id").references(() => videos.id, {
      onDelete: "set null",
    }),
    response: text("response").notNull(),
    prompt: text("prompt").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("messages_session_id_idx").on(t.sessionId),
    index("messages_video_id_idx").on(t.videoId),
  ],
);

export const appRelations = defineRelations(
  { users, videos, outboxes, processedEvents, chatSessions, messages },
  (r) => ({
    users: {
      videos: r.many.videos(),
      chatSessions: r.many.chatSessions(),
    },

    videos: {
      author: r.one.users({
        from: r.videos.userId,
        to: r.users.id,
      }),
      outboxes: r.many.outboxes(),
      messages: r.many.messages(),
    },

    outboxes: {
      video: r.one.videos({
        from: r.outboxes.videoId,
        to: r.videos.id,
      }),
    },

    chatSessions: {
      author: r.one.users({
        from: r.chatSessions.userId,
        to: r.users.id,
      }),
      messages: r.many.messages(),
    },

    messages: {
      chatSession: r.one.chatSessions({
        from: r.messages.sessionId,
        to: r.chatSessions.id,
      }),
      video: r.one.videos({
        from: r.messages.videoId,
        to: r.videos.id,
      }),
    },
  }),
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Video = typeof videos.$inferSelect;
export type NewVideo = typeof videos.$inferInsert;

export type Outbox = typeof outboxes.$inferSelect;
export type NewOutbox = typeof outboxes.$inferInsert;

export type ProcessedEvent = typeof processedEvents.$inferSelect;
export type NewProcessedEvent = typeof processedEvents.$inferInsert;

export type ChatSession = typeof chatSessions.$inferSelect;
export type NewChatSession = typeof chatSessions.$inferInsert;

export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
