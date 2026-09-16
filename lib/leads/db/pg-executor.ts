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

/*
  Backend Phase 2E-1 — transactional Unit of Work over a single pooled client.
  Acquires ONE client, runs `BEGIN`, hands a transaction-scoped SqlExecutor (bound to
  that client) to `fn`, then `COMMIT`; any throw triggers `ROLLBACK` and re-raises. So
  lead + delivery-intent writes land together or not at all. Still parameterized-only;
  the connection string / credentials are never logged.
*/
export async function withPgTransaction<T>(
  fn: (tx: SqlExecutor) => Promise<T>
): Promise<T> {
  const client = await getPool().connect()
  const tx: SqlExecutor = {
    async query<T2 extends SqlRow = SqlRow>(text: string, params?: readonly unknown[]) {
      const result = await client.query(text, params ? [...params] : undefined)
      return { rows: result.rows as T2[] }
    },
  }
  try {
    await client.query("BEGIN")
    const out = await fn(tx)
    await client.query("COMMIT")
    return out
  } catch (err) {
    try {
      await client.query("ROLLBACK")
    } catch {
      // A rollback failure must not mask the original error.
    }
    throw err
  } finally {
    client.release()
  }
}
