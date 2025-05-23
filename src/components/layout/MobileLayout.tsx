"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface MobileLayoutProps {
  header?: React.ReactNode
  footer?: React.ReactNode
  children: React.ReactNode
  className?: string
}

export function MobileLayout({
  header,
  footer,
  children,
  className,
}: MobileLayoutProps) {
  // Variantes de animação para o container principal
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        duration: 0.1,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  }

  // Variantes de animação para os elementos filhos
  const childVariants = {
    hidden: { opacity: 0, y: 0 },
    visible: { 
      opacity: 1, 
      y: 0,
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {header && <header className="sticky top-0 z-10">{header}</header>}
      
      <motion.main
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={cn(
          "flex-1 overflow-auto",
          "pb-20",
          className
        )}
      >
        <motion.div 
          variants={childVariants}
          className="max-w-md mx-auto w-full"
        >
          {children}
        </motion.div>
      </motion.main>
      
      {footer && (
        <footer className="fixed bottom-0 left-0 right-0 z-10">
          {footer}
        </footer>
      )}
    </div>
  )
}

export default MobileLayout
