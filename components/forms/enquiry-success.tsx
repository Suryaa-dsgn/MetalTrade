import { CheckIconGlyph } from "@/components/ui/icon"
import { H3 } from "@/components/ui/typography"

/*
  Success state (Blueprint §7, Design System §17). Shows a reference number,
  what happens next, and safe-document guidance. The reference is a clearly
  non-production DEMO code and the copy states that no CRM/email/trade-desk
  submission has occurred (amendments 5, 6). No invented response SLA.
*/
export function EnquirySuccess({ referenceId }: { referenceId: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-6" role="status">
      <div className="flex items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-pill bg-positive-soft text-positive">
          <CheckIconGlyph className="size-5" />
        </span>
        <H3 as="p">Enquiry captured</H3>
      </div>

      <p className="mt-4 text-body">
        Your reference is{" "}
        <span className="font-semibold tabular-nums text-foreground">
          {referenceId}
        </span>
        .
      </p>

      <div className="mt-4 space-y-3 text-body-s text-muted-foreground">
        <p>
          <span className="font-medium text-foreground">What happens next:</span>{" "}
          a member of the trade desk reviews your enquiry and responds. The
          expected response time is confirmed once the desk is contactable.
        </p>
        <p>
          <span className="font-medium text-foreground">Documents:</span> please
          do not send confidential ownership or financial documents until a
          secure channel is confirmed.
        </p>
      </div>

      <p className="mt-4 rounded-md border border-warning/25 bg-warning-soft px-3 py-2 text-body-s text-warning">
        This is a development demo. No CRM, email, or trade-desk submission has
        occurred. The reference above is a non-production DEMO code.
      </p>
    </div>
  )
}
