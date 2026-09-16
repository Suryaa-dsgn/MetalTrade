import "server-only"

import { Pool } from "pg"

import { serverConfig } from "@/lib/config/env"
import type { SqlExecutor, SqlRow } from "@/lib/leads/db/executor"

/*
  Backend Phase 2C — production SQL executor over a shared `pg.Pool`.

  Connection management: ONE module-level pool per server instance, reused across
  requests (never a new connection per submission). A small `max` keeps it
  serverless-friendly (a warm instance reuses the pool; cold starts create it once).
  Works with any standard managed PostgreSQL (RDS/Aurora, Neon, Supabase, …).

  Fail-closed: if DATABASE_URL is not configured, every query throws — the
  repository surfaces a persistence failure and the submission fails safely. There
  is NO fallback to the in-memory store. The connection string / credentials are
  never logged.
*/

export class DatabaseNotConfiguredError extends Error {
  constructor() {
    super("DATABASE_URL is not configured")
    this.name = "DatabaseNotConfiguredError"
  }
}

let pool: Pool | null = null

function getPool(): Pool {
  if (!serverConfig.databaseUrl) throw new DatabaseNotConfiguredError()
  if (!pool) {
    pool = new Pool({
      connectionString: serverConfig.databaseUrl,
      ssl:
        serverConfig.databaseSsl === "require"
          ? { rejectUnauthorized: true }
          : undefined,
      max: 5,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    })
  }
  return pool
}

export const pgExecutor: SqlExecutor = {
  async query<T extends SqlRow = SqlRow>(text: string, params?: readonly unknown[]) {
    const result = await getPool().query(text, params ? [...params] : undefined)
    return { rows: result.rows as T[] }
  },
}
