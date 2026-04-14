import z from "zod";

const envSchema = z.object({
  PORT: z.string().default("8000"),
  DATABASE_URL: z.string(),
  ORIGIN: z.string().or(z.array(z.string())).default("3000"),
  NODE_ENV: z.string().default("production"),
  LOG_LEVEL: z.string().default("info"),
  OPEN_ROUTER: z.string(),
  GROQ: z.string(),
  DB_HOST: z.string(),
  DB_PORT: z.coerce.number(),
  DB_NAME: z.string(),
  DB_USER: z.string(),
  DB_PASSWORD: z.string(),
  REDIS_HOST: z.string(),
  REDIS_PORT: z.coerce.number(),
});

// TODO : safe vs parse
export const env = envSchema.parse(process.env);

// TODO : add the zod validation
export const CDCConfigs = {
  host: env.DB_HOST || "postgres-db",
  port: env.DB_PORT || 5432,
  database: env.DB_NAME || "mydb",
  user: env.DB_USER || "postgres",
  password: env.DB_PASSWORD || "postgres",
};
