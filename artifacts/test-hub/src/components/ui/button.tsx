import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cn } from "@/lib/utils"

export type ButtonVariant = "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "premium"
export type ButtonSize = "default" | "sm" | "lg" | "icon"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  variant?: ButtonVariant
  size?: ButtonSize
}

export function buttonVariants(opts: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {}): string {
  const { variant = "default", size = "default", className } = opts
  return cn(
    "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
    {
      "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm": variant === "default",
      "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm": variant === "destructive",
      "border border-input bg-background hover:bg-accent hover:text-accent-foreground shadow-sm": variant === "outline",
      "bg-secondary text-secondary-foreground hover:bg-secondary/80": variant === "secondary",
      "hover:bg-accent hover:text-accent-foreground": variant === "ghost",
      "underline-offset-4 hover:underline text-primary": variant === "link",
      "bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-md hover:opacity-90": variant === "premium",
      "h-10 px-4 py-2": size === "default",
      "h-9 rounded-md px-3": size === "sm",
      "h-12 rounded-md px-8 text-base": size === "lg",
      "h-10 w-10": size === "icon",
    },
    className
  )
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(
          "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm": variant === "default",
            "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm": variant === "destructive",
            "border border-input bg-background hover:bg-accent hover:text-accent-foreground shadow-sm": variant === "outline",
            "bg-secondary text-secondary-foreground hover:bg-secondary/80": variant === "secondary",
            "hover:bg-accent hover:text-accent-foreground": variant === "ghost",
            "underline-offset-4 hover:underline text-primary": variant === "link",
            "bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-md hover:opacity-90": variant === "premium",
            "h-10 px-4 py-2": size === "default",
            "h-9 rounded-md px-3": size === "sm",
            "h-12 rounded-md px-8 text-base": size === "lg",
            "h-10 w-10": size === "icon",
          },
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
