import { defineConfig } from "vitest/config"
import { fileURLToPath } from "node:url"

/*
  Vitest config for the market-data layer (and future domain tests). Node
  environment: these are pure business-logic/provider tests, no DOM. The `@/`
  alias mirrors tsconfig so tests import modules exactly as the app does.

  Tests must never hit the live provider — adapter tests mock `fetch` with real
  captured payloads so they stay deterministic and consume no API quota.
*/
export default defineConfig({
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts"],
    globals: false,
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
      // Vitest runs in Node without the react-server condition, so the real
      // `server-only` module would throw on import. Alias it to a no-op so
      // server modules (env, provider adapters) are testable.
      "server-only": fileURLToPath(
        new URL("./test/vitest-stubs/server-only.ts", import.meta.url)
      ),
    },
  },
})
