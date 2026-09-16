#!/usr/bin/env node
/*
  Backend Phase 2C — minimal versioned migration runner (no framework dependency).

  Applies un-applied `db/migrations/NNNN_*.sql` files in order, inside a transaction,
  and records each in `schema_migrations`. Forward-only; `*.down.sql` files are for
  DELIBERATE manual rollback (never auto-run). This is NOT run at app startup or on
  the request path — run it explicitly: `npm run db:migrate`.

  Config (server-side only): DATABASE_URL (required), DATABASE_SSL=require|disable
  (default require). Credentials are never printed.
*/
import { readFileSync, readdirSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import pg from "pg"

const MIGRATIONS_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "db", "migrations")

const url = process.env.DATABASE_URL
if (!url) {
  console.error("migrate: DATABASE_URL is not set.")
  process.exit(2)
}
const ssl = process.env.DATABASE_SSL !== "disable" ? { rejectUnauthorized: true } : undefined

const client = new pg.Client({ connectionString: url, ssl })

const files = readdirSync(MIGRATIONS_DIR)
  .filter((f) => /^\d+_.*\.sql$/.test(f) && !f.endsWith(".down.sql"))
  .sort()

try {
  await client.connect()
  await client.query(
    `CREATE TABLE IF NOT EXISTS schema_migrations (
       version TEXT PRIMARY KEY,
       applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
     )`
  )
  const applied = new Set(
    (await client.query("SELECT version FROM schema_migrations")).rows.map((r) => r.version)
  )

  let count = 0
  for (const file of files) {
    if (applied.has(file)) continue
    const sql = readFileSync(join(MIGRATIONS_DIR, file), "utf8")
    process.stdout.write(`migrate: applying ${file} … `)
    await client.query("BEGIN")
    try {
      await client.query(sql)
      await client.query("INSERT INTO schema_migrations (version) VALUES ($1)", [file])
      await client.query("COMMIT")
      console.log("done")
      count++
    } catch (err) {
      await client.query("ROLLBACK")
      throw err
    }
  }
  console.log(count === 0 ? "migrate: already up to date." : `migrate: applied ${count} migration(s).`)
} catch (err) {
  // Never print the connection string / credentials.
  console.error("migrate: failed —", err?.message ?? err)
  process.exit(1)
} finally {
  await client.end()
}
