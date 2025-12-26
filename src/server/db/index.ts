import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

// Use libsql for Vercel compatibility
// For local development: file:./helipad.db
// For production: libsql://[your-database].turso.io
const client = createClient({
  url: process.env.DATABASE_URL ?? "file:./helipad.db",
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });

export type DbClient = typeof db;

