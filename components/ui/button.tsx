import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/*
  Button — Design System §11.3 hierarchy on the Base UI accessible primitive.
  Light-mode only: no `dark:` variants. Radius is `md` (10px) per §7.1.
  Do not add icons from icon libraries directly; pass glyphs from the icon
  barrels (@/components/ui/icon for chrome, @/components/ui/domain-icon).
*/
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2 rounded-md border border-transparent text-body-s font-medium whitespace-nowrap transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:bg-surface-subtle disabled:text-muted-foreground disabled:border-border aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // One decisive action per region.
        primary: "bg-primary text-primary-foreground hover:bg-primary-hover",
        // Important alternative action — white fill, graphite text, visible border.
        secondary:
          "border-border-strong bg-surface text-foreground hover:bg-surface-muted",
        // Lower-emphasis action on a light surface.
        outline:
          "border-border bg-transparent text-foreground hover:bg-surface-muted",
        // Secondary action on a dark (mineral) surface, e.g. the hero.
        outlineInverse:
          "border-mineral-foreground/40 bg-transparent text-mineral-foreground hover:bg-mineral-foreground/10 focus-visible:ring-mineral-foreground/40",
        // Navigation or utility action.
        ghost: "bg-transparent text-foreground hover:bg-surface-muted",
        // Irreversible or high-risk action only.
        destructive:
          "bg-destructive text-primary-foreground hover:bg-[color-mix(in_oklab,var(--destructive),black_12%)]",
        // Inline navigation where a button would be too heavy.
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-9 gap-1.5 px-3",
        default: "h-10 px-4",
        lg: "h-11 px-6 text-body",
        icon: "size-10",
        "icon-sm": "size-9",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
