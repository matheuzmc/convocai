"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ChevronLeft, Bell } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import { useCurrentUser } from "@/hooks/useCurrentUser"
import { Skeleton } from "@/components/ui/skeleton"
import { getUserDisplayData } from "@/lib/utils"
import { useNotifications } from "@/contexts/NotificationsContext"

interface TopNavProps {
  title: string
  backHref?: string
  onBackClick?: () => void
  showNotifications?: boolean
  className?: string
  rightElement?: React.ReactNode
}

export function TopNav({
  title,
  backHref,
  onBackClick,
  showNotifications = false,
  className,
  rightElement,
}: TopNavProps) {
  const { data: currentUser, isLoading: isLoadingUser } = useCurrentUser();
  const { unreadCount, isLoading: isLoadingNotificationsContext } = useNotifications();

  const shouldShowBellIcon = showNotifications && currentUser && !isLoadingUser;

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
        {onBackClick ? (
          <button onClick={onBackClick} className="p-2 -ml-2" aria-label="Voltar">
            <motion.div
              whileHover={{ x: -3 }}
              whileTap={{ scale: 0.9 }}
            >
              <ChevronLeft className="h-5 w-5" />
            </motion.div>
          </button>
        ) : backHref && (
          <Link href={backHref} className="p-2 -ml-2" aria-label="Voltar">
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
        {shouldShowBellIcon && (
          <Link href="/notifications" className="relative p-2">
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && !isLoadingNotificationsContext && (
              <motion.span 
                  key={unreadCount}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 20, duration: 0.2 }}
                  className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-white"
              >
                  {unreadCount > 9 ? '9+' : unreadCount}
              </motion.span>
              )}
            </motion.div>
          </Link>
        )}
        {rightElement}
        
        {/* User Avatar Area */}
        {isLoadingUser && (
          <Skeleton className="h-8 w-8 rounded-full" />
        )}
        {!isLoadingUser && currentUser && (
          <Link href="/menu">
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Avatar className="h-8 w-8 border-2 border-primary/20">
                {currentUser.avatar ? (
                  <AvatarImage src={currentUser.avatar} alt={getUserDisplayData(currentUser).displayName} />
                ) : (
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {getUserDisplayData(currentUser).fallbackInitials}
                  </AvatarFallback>
                )}
              </Avatar>
            </motion.div>
          </Link>
        )}
        {!isLoadingUser && !currentUser && (
           <Link href="/login">
             <div className="h-8 w-8 rounded-full bg-muted border-2"></div>
           </Link>
        )}
      </div>
    </motion.div>
  )
}

export default TopNav
