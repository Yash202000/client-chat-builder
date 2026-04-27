import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-[0.7rem] font-semibold tracking-wide transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/85",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/85",
        destructive:
          "border-transparent bg-destructive/15 text-destructive ring-1 ring-inset ring-destructive/25 hover:bg-destructive/20 dark:bg-destructive/20 dark:text-red-300 dark:ring-destructive/30",
        outline: "text-foreground border-border/70",
        success:
          "border-transparent bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/15 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/20",
        warning:
          "border-transparent bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-600/20 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/20",
        info:
          "border-transparent bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-600/15 hover:bg-sky-100 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-400/20",
        aurora:
          "border-transparent text-white bg-[linear-gradient(135deg,hsl(var(--aurora-violet))_0%,hsl(var(--aurora-cyan))_100%)] shadow-sm hover:opacity-90",
        soft:
          "border-transparent bg-muted text-muted-foreground hover:bg-muted/80",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }