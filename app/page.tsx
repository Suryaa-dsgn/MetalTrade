import Link from "next/link"

import { Container } from "@/components/layout/container"
import { buttonVariants } from "@/components/ui/button"
import { Body, Display, Label } from "@/components/ui/typography"

/*
  Placeholder root route. The real Home page is built in Phase 3 (Blueprint
  §6.1). This is a deliberate foundation notice — no fabricated product content.
*/
export default function RootPlaceholder() {
  const isDev = process.env.NODE_ENV !== "production"

  return (
    <Container
      as="main"
      className="flex flex-1 flex-col items-start justify-center py-24"
    >
      <Label>Metal Trading Portal</Label>
      <Display className="mt-3 max-w-[16ch]">Foundation in progress</Display>
      <Body className="mt-4">
        Design tokens, primitives, and the component foundation are in place.
        The Home page and product pages are built in later phases.
      </Body>
      {isDev ? (
        <div className="mt-8">
          {/* A link-styled anchor (correct semantics for navigation) rather
              than routing a Link through the Base UI Button primitive. */}
          <Link href="/style-guide" className={buttonVariants()}>
            Open the style guide
          </Link>
        </div>
      ) : null}
    </Container>
  )
}
