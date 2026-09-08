"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Dialog } from "@base-ui/react/dialog"

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"
import { CloseIcon, MenuIcon } from "@/components/ui/icon"
import { isActivePath, primaryCta, primaryNav } from "@/data/config/navigation"

/*
  Mobile primary navigation — Base UI Dialog styled as a right side sheet.
  Modal (default): focus is trapped, Esc closes, and focus returns to the
  trigger. No swipe/snap needed, so Dialog rather than Drawer.
*/
export function MobileNav({ className }: { className?: string }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger
        render={<Button variant="ghost" size="icon" aria-label="Open menu" />}
        className={className}
      >
        <MenuIcon />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-mineral/40 transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Popup className="fixed inset-y-0 right-0 z-50 flex w-[86%] max-w-sm flex-col bg-surface shadow-lg transition-transform duration-200 ease-[var(--ease-emphasized)] data-[ending-style]:translate-x-full data-[starting-style]:translate-x-full">
          <div className="flex h-16 items-center justify-between border-b border-border px-5">
            <Dialog.Title className="text-label uppercase tracking-label text-muted-foreground">
              Menu
            </Dialog.Title>
            <Dialog.Close
              render={<Button variant="ghost" size="icon" aria-label="Close menu" />}
            >
              <CloseIcon />
            </Dialog.Close>
          </div>

          <nav aria-label="Primary" className="flex-1 overflow-y-auto px-3 py-4">
            <ul className="flex flex-col gap-1">
              {primaryNav.map((item) => {
                const active = isActivePath(pathname, item.href)
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center rounded-md px-3 py-3 text-body font-medium transition-colors",
                        active
                          ? "bg-primary-soft text-primary"
                          : "text-foreground hover:bg-surface-muted"
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          <div className="border-t border-border p-5">
            <Link
              href={primaryCta.href}
              onClick={() => setOpen(false)}
              className={cn(buttonVariants(), "w-full")}
            >
              {primaryCta.label}
            </Link>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
