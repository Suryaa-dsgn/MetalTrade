import { describe, it, expect } from "vitest"
import { escapeHtml } from "@/lib/leads/notification/email/escape"

/* Backend Phase 2D — HTML escaping (defence against HTML injection in email). */

describe("escapeHtml", () => {
  it("escapes all five HTML-sensitive characters", () => {
    expect(escapeHtml(`& < > " '`)).toBe("&amp; &lt; &gt; &quot; &#39;")
  })

  it("escapes & first so entities are not double-escaped", () => {
    expect(escapeHtml("<")).toBe("&lt;")
    expect(escapeHtml("&lt;")).toBe("&amp;lt;")
  })

  it("neutralizes a script/markup injection attempt", () => {
    expect(escapeHtml('<script>alert("x")</script>')).toBe(
      "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;"
    )
  })

  it("leaves ordinary text unchanged", () => {
    expect(escapeHtml("Copper cathode, 500 MT")).toBe("Copper cathode, 500 MT")
  })
})
