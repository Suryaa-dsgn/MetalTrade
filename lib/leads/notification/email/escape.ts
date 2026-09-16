/*
  HTML escaping for email content (Backend Phase 2D). Pure and deterministic. Every
  lead-controlled value rendered into the HTML email body MUST pass through this,
  because lead fields are UNTRUSTED content even after schema validation (validation
  bounds length/shape, it does not neutralize markup). Prevents HTML injection in the
  operational notification.

  Order matters: `&` is replaced first so entities introduced by later replacements
  are not double-escaped.
*/
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}
