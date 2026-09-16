import { describe, it, expect, vi } from "vitest"
import {
  createResendTransport,
  type ResendEmailsClient,
} from "@/lib/leads/notification/email/transports/resend"
import type { EmailMessage } from "@/lib/leads/notification/email/types"

/*
  Real email activation — Resend transport mapping. The Resend SDK is MOCKED via an
  injected client; CI never touches a live account.
*/

const message: EmailMessage = {
  from: "desk@oeml.example",
  to: "leads@oeml.example",
  replyTo: "ada@example.com",
  subject: "New OEML Lead: Buy - Copper",
  text: "Reference: OEML-2026-ABC234",
  html: "<table></table>",
}

function client(
  impl: ResendEmailsClient["send"]
): { client: ResendEmailsClient; send: ReturnType<typeof vi.fn> } {
  const send = vi.fn(impl)
  return { client: { send }, send }
}

describe("createResendTransport", () => {
  it("declares email channel identity + idempotent capability", () => {
    const { client: c } = client(async () => ({ data: { id: "re_1" }, error: null }))
    const t = createResendTransport("key", c)
    expect(t.name).toBe("resend")
    expect(t.capabilities.idempotentSend).toBe(true)
  })

  it("maps a successful send to sent + providerMessageId (the Resend email id)", async () => {
    const { client: c } = client(async () => ({ data: { id: "re_abc123" }, error: null }))
    const t = createResendTransport("key", c)
    const result = await t.send(message)
    expect(result).toEqual({ status: "sent", providerMessageId: "re_abc123" })
  })

  it("forwards the idempotency key as a structured option", async () => {
    const { client: c, send } = client(async () => ({ data: { id: "re_1" }, error: null }))
    const t = createResendTransport("key", c)
    await t.send(message, { idempotencyKey: "delivery-42" })
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({ from: message.from, to: message.to }),
      { idempotencyKey: "delivery-42" }
    )
  })

  it("forwards from/to/replyTo from the message (never invents recipients)", async () => {
    const { client: c, send } = client(async () => ({ data: { id: "re_1" }, error: null }))
    const t = createResendTransport("key", c)
    await t.send(message)
    const payload = send.mock.calls[0][0]
    expect(payload.from).toBe("desk@oeml.example")
    expect(payload.to).toBe("leads@oeml.example")
    expect(payload.replyTo).toBe("ada@example.com")
  })

  it("maps a retryable provider error (rate limit / 5xx) to temporary_failure", async () => {
    const { client: c } = client(async () => ({
      data: null,
      error: { name: "rate_limit_exceeded", message: "slow down", statusCode: 429 },
    }))
    const t = createResendTransport("key", c)
    expect(await t.send(message)).toEqual({
      status: "temporary_failure",
      code: "rate_limit_exceeded",
    })
  })

  it("maps a 5xx status without a known name to temporary_failure", async () => {
    const { client: c } = client(async () => ({
      data: null,
      error: { name: "application_error", message: "boom", statusCode: 500 },
    }))
    const t = createResendTransport("key", c)
    expect(await t.send(message)).toMatchObject({ status: "temporary_failure" })
  })

  it("maps a validation/auth error to permanent_failure", async () => {
    const { client: c } = client(async () => ({
      data: null,
      error: { name: "validation_error", message: "bad from address", statusCode: 422 },
    }))
    const t = createResendTransport("key", c)
    expect(await t.send(message)).toEqual({
      status: "permanent_failure",
      code: "validation_error",
    })
  })

  it("maps an invalid API key to permanent_failure", async () => {
    const { client: c } = client(async () => ({
      data: null,
      error: { name: "invalid_api_key", message: "nope", statusCode: 401 },
    }))
    const t = createResendTransport("key", c)
    expect(await t.send(message)).toMatchObject({ status: "permanent_failure", code: "invalid_api_key" })
  })

  it("never leaks the raw provider message in the classification code", async () => {
    const secretish = "internal-endpoint-and-request-detail"
    const { client: c } = client(async () => ({
      data: null,
      error: { name: "validation_error", message: secretish, statusCode: 422 },
    }))
    const t = createResendTransport("key", c)
    const result = await t.send(message)
    expect(JSON.stringify(result)).not.toContain(secretish)
    if (result.status === "permanent_failure") expect(result.code).toBe("validation_error")
  })

  it("treats a malformed response (no data, no error) as temporary_failure", async () => {
    const { client: c } = client(async () => ({ data: null, error: null }))
    const t = createResendTransport("key", c)
    expect(await t.send(message)).toEqual({
      status: "temporary_failure",
      code: "malformed_response",
    })
  })

  it("omits html/replyTo from the payload when absent", async () => {
    const { client: c, send } = client(async () => ({ data: { id: "re_1" }, error: null }))
    const t = createResendTransport("key", c)
    await t.send({ from: "a@x", to: "b@y", subject: "s", text: "t" })
    const payload = send.mock.calls[0][0]
    expect(payload).not.toHaveProperty("html")
    expect(payload).not.toHaveProperty("replyTo")
  })
})
