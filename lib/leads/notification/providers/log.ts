import type { Lead } from "@/lib/leads/types"
import type {
  NotificationProvider,
  NotificationResult,
} from "@/lib/leads/notification/types"

/*
  Log notification provider (Backend Phase 2A) — the default, no-op "delivery". It
  never sends anything and always succeeds; the LeadNotificationService records the
  delivery + emits the PII-free `lead.notification.*` events. This preserves current
  behavior (no live email/CRM) and is the seam a real email/CRM adapter plugs into
  later. It reads no PII from the lead.
*/
export const logNotificationProvider: NotificationProvider = {
  name: "log",
  channel: "log",
  isConfigured: () => true,
  async notify(lead: Lead): Promise<NotificationResult> {
    void lead // the log provider sends nothing and reads no PII
    return { ok: true }
  },
}
