"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface SwitchProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onDrag'> {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  className?: string
}

export function Switch({
  checked = false,
  onCheckedChange,
  className,
  ...props
}: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={cn(
        "peer flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 relative p-[2px]",
        checked ? "bg-primary justify-end" : "bg-input justify-start",
        className
      )}
      onClick={() => onCheckedChange?.(!checked)}
      {...props}
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 700, damping: 30 }}
        className={cn(
          "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0",
          checked ? "elevation-1" : ""
        )}
      />
    </button>
  )
}

export default Switch
