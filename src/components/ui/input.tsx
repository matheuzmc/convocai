"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  wrapperClassName?: string; // Adicionando uma propriedade específica do componente
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, wrapperClassName, ...props }, ref) => {
    // Cria um ref interno para usar com framer-motion
    const inputRef = React.useRef<HTMLInputElement>(null)
    
    // Combina a ref passada com a ref interna
    React.useImperativeHandle(ref, () => inputRef.current!)
    
    return (
      <motion.div
        whileFocus={{ scale: 1.01 }}
        style={{ width: '100%' }}
        className={wrapperClassName}
      >
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 ring-offset-background file:border-0 file:bg-transparent file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
            className
          )}
          ref={inputRef}
          {...props}
        />
      </motion.div>
    )
  }
)
Input.displayName = "Input"

export { Input }
