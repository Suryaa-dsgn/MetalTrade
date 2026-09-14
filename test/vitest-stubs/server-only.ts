// Test-only stub for the `server-only` marker package. In a real Next.js build
// `server-only` resolves to a no-op under the react-server condition and to a
// throwing module otherwise; Vitest runs in plain Node (no react-server
// condition), so we alias it to this no-op to import server modules in tests.
export {}
