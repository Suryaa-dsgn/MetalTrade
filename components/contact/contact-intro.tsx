import { H1, Body, Label } from "@/components/ui/typography"

/*
  Left column of the Contact page. Concise, visually restrained — an eyebrow,
  heading, one supporting paragraph, a quiet list of enquiry purposes (no giant
  icons or cards), and a compact privacy note. The form provides the page's
  vertical density; this column stays calm.
*/
const PURPOSES = [
  "Buying requirements",
  "Supply opportunities",
  "Trade & logistics enquiries",
  "General questions",
]

export function ContactIntro() {
  return (
    <div className="flex flex-col">
      <Label>Contact</Label>
      <H1 className="mt-3 text-h1">Discuss a requirement</H1>
      <Body className="mt-4 max-w-[42ch] text-muted-foreground">
        Whether you are looking to source material, offer supply, discuss logistics
        or ask a general question, share the details below and our team can review
        your enquiry.
      </Body>

      <ul className="mt-6 flex flex-col gap-2 border-t border-border pt-6">
        {PURPOSES.map((purpose) => (
          <li
            key={purpose}
            className="flex items-center gap-2.5 text-body-s text-foreground"
          >
            <span
              aria-hidden="true"
              className="size-1.5 shrink-0 rounded-pill bg-primary"
            />
            {purpose}
          </li>
        ))}
      </ul>

      <p className="mt-6 text-body-s text-muted-foreground">
        Your information will only be used to review and respond to your enquiry.
      </p>
    </div>
  )
}
