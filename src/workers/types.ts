export interface OutboxEvent {
  id: number;
  videoId: number;
  eventType: string;
  payload: Record<string, unknown>;
  status: "PENDING" | "PROCESSED";
  retryCount: number;
  createdAt: Date;
}

export interface CDCMessage {
  action: "INSERT" | "UPDATE" | "DELETE";
  schema: string;
  table: string;
  data: OutboxEvent;
  oldData?: OutboxEvent;
}
