"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ChevronLeft, Bell } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"

interface TopNavProps {
  title: string
  backHref?: string
  showNotifications?: boolean
  className?: string
  rightElement?: React.ReactNode
  user?: {
    name: string
    avatar: string
  }
}

export function TopNav({
  title,
  backHref,
  showNotifications = false,
  className,
  rightElement,
  user,
}: TopNavProps) {
  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "h-16 px-4 flex items-center justify-between bg-background elevation-2 border-b border-border",
        className
      )}
    >
      <div className="flex items-center gap-3">
        {backHref && (
          <Link href={backHref} className="p-2 -ml-2">
            <motion.div
              whileHover={{ x: -3 }}
              whileTap={{ scale: 0.9 }}
            >
              <ChevronLeft className="h-5 w-5" />
            </motion.div>
          </Link>
        )}
        <motion.h1 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-lg font-semibold"
        >
          {title}
        </motion.h1>
      </div>
      <div className="flex items-center gap-4">
        {showNotifications && (
          <Link href="/notifications" className="relative">
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Bell className="h-5 w-5" />
              <motion.span 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 500 }}
                className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-white"
              >
                3
              </motion.span>
            </motion.div>
          </Link>
        )}
        {rightElement}
        {user && (
          <Link href="/menu">
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Avatar className="h-8 w-8 border-2 border-primary/20">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {user.name.split(" ").map((n) => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
            </motion.div>
          </Link>
        )}
      </div>
    </motion.div>
  )
}

export default TopNav
