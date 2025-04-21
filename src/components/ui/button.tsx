"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "default",
      size = "default",
      asChild = false,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button"
    
    // Envolvemos em um div com motion para ter as animações
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        style={{ display: 'inline-block' }}
      >
        <Comp
          className={cn(
            "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none",
            variant === "default" && "bg-primary text-primary-foreground hover:bg-primary/90 gradient-primary glow-effect",
            variant === "destructive" && "bg-destructive text-destructive-foreground hover:bg-destructive/90",
            variant === "outline" && "border border-input hover:bg-accent hover:text-accent-foreground",
            variant === "secondary" && "bg-secondary text-secondary-foreground hover:bg-secondary/80",
            variant === "ghost" && "hover:bg-accent hover:text-accent-foreground",
            variant === "link" && "underline-offset-4 hover:underline text-primary",
            size === "default" && "h-10 py-2 px-4",
            size === "sm" && "h-9 px-3 rounded-md",
            size === "lg" && "h-11 px-8 rounded-md",
            size === "icon" && "h-10 w-10",
            "elevation-1",
            className
          )}
          ref={ref}
          {...props}
        />
      </motion.div>
    )
  }
)
Button.displayName = "Button"

export { Button }
