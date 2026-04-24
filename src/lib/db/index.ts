import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/lib/db/schema";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/server";

let client: postgres.Sql | null = null;
let db: ReturnType<typeof drizzle> | null = null;

export type PersistenceStatus =
  | "demo"
  | "database"
  | "supabase"
  | "supabase-missing-table";

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

export function isPersistenceConfigured() {
  return isDatabaseConfigured() || isSupabaseConfigured();
}

export function isSupabaseTableMissing(
  error: { code?: string | null; status?: number; message?: string | null } | null,
) {
  if (!error) return false;
  // 42P01 = PostgreSQL "relation does not exist"
  // PGRST204 / PGRST205 = PostgREST "table not found"
  if (
    error.code === "42P01" ||
    error.code === "PGRST204" ||
    error.code === "PGRST205"
  ) {
    return true;
  }
  // PostgREST returns 404 when the table/schema itself doesn't exist
  if (error.status === 404) {
    return true;
  }
  // Check message for explicit "relation ... does not exist" pattern
  const msg = error.message?.toLowerCase() ?? "";
  if (msg.includes("relation") && msg.includes("does not exist")) {
    return true;
  }
  return false;
}

export async function getPersistenceStatus(): Promise<PersistenceStatus> {
  if (isDatabaseConfigured()) {
    return "database";
  }

  if (!isSupabaseConfigured()) {
    return "demo";
  }

  const supabase = getSupabaseAdmin();

  // Check daily_processes table
  const { error: dpError } = await supabase
    .from("daily_processes")
    .select("id")
    .limit(1);

  if (dpError) {
    console.error("[DropFlow] Error al verificar daily_processes:", dpError.code, dpError.message);
    if (isSupabaseTableMissing(dpError)) {
      return "supabase-missing-table";
    }
    // Column errors or other issues are NOT "missing table" — table exists but schema differs
    // Still treat as usable supabase
  }

  // Check products table
  const { error: prodError } = await supabase
    .from("products")
    .select("id")
    .limit(1);

  if (prodError) {
    console.error("[DropFlow] Error al verificar products:", prodError.code, prodError.message);
    if (isSupabaseTableMissing(prodError)) {
      return "supabase-missing-table";
    }
  }

  return "supabase";
}

export function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is required. Add it in your local env or Vercel project settings.",
    );
  }

  if (!client) {
    client = postgres(process.env.DATABASE_URL, {
      max: 1,
      prepare: false,
      idle_timeout: 20,
      connect_timeout: 10,
    });
  }

  if (!db) {
    db = drizzle(client, { schema });
  }

  return db;
}
