import { describe, it, expect, vi, afterEach } from "vitest"
import { logger } from "@/lib/observability/logger"

/*
  Structured logger sink routing. Each level must use its OWN console method so
  Next.js does not surface non-fatal warnings as a development error overlay:
    error → console.error, warn → console.warn, info/debug → console.log.
*/

afterEach(() => vi.restoreAllMocks())

describe("logger sink routing", () => {
  it("routes error → console.error (and not console.warn/log)", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {})
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    const log = vi.spyOn(console, "log").mockImplementation(() => {})
    logger.error("evt.error", { a: 1 })
    expect(error).toHaveBeenCalledTimes(1)
    expect(warn).not.toHaveBeenCalled()
    expect(log).not.toHaveBeenCalled()
  })

  it("routes warn → console.warn (NOT console.error)", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {})
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    const log = vi.spyOn(console, "log").mockImplementation(() => {})
    logger.warn("evt.warn", { a: 1 })
    expect(warn).toHaveBeenCalledTimes(1)
    expect(error).not.toHaveBeenCalled() // must not trigger the Next.js error overlay
    expect(log).not.toHaveBeenCalled()
  })

  it("routes info and debug → console.log", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {})
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    const log = vi.spyOn(console, "log").mockImplementation(() => {})
    logger.info("evt.info")
    logger.debug("evt.debug")
    expect(log).toHaveBeenCalledTimes(2)
    expect(error).not.toHaveBeenCalled()
    expect(warn).not.toHaveBeenCalled()
  })

  it("still emits the event name + redacts secret-keyed fields", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    logger.warn("evt.secret", { apiKey: "shhh", range: "3M" })
    const line = warn.mock.calls[0][0] as string
    expect(line).toContain("evt.secret")
    expect(line).toContain("3M")
    expect(line).not.toContain("shhh")
    expect(line).toContain("[redacted]")
  })
})
