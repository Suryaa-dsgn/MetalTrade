/*
  Backend Phase 2C — tiny SQL executor port. Pure interface (no `pg`, no
  `server-only`) so the durable repository depends on an ABSTRACTION, not a specific
  driver: production supplies a `pg.Pool`-backed executor, tests supply an in-process
  PGlite-backed one. Only parameterized queries ($1, $2 …) — never string
  concatenation with user input.
*/

export type SqlRow = Record<string, unknown>

export interface SqlExecutor {
  query<T extends SqlRow = SqlRow>(
    text: string,
    params?: readonly unknown[]
  ): Promise<{ rows: T[] }>
}

/** True for a Postgres unique-constraint violation (SQLSTATE 23505), across pg and
 *  PGlite (falls back to the message when the code field is absent). */
export function isUniqueViolation(err: unknown): boolean {
  const e = err as { code?: string; message?: string } | null
  if (e?.code === "23505") return true
  return /unique constraint|duplicate key value/i.test(e?.message ?? "")
}

/** True when a unique violation names the given constraint (checks the structured
 *  field first, then the message — Postgres includes the constraint name in both). */
export function violatesConstraint(err: unknown, constraint: string): boolean {
  const e = err as { constraint?: string; message?: string } | null
  if (e?.constraint === constraint) return true
  return (e?.message ?? "").includes(constraint)
}
