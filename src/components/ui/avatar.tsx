"use client"

import * as React from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
  children: React.ReactNode
}

export function Avatar({ className, children, ...props }: AvatarProps) {
  return (
    <div
      className={cn(
        "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
        className
      )}
      {...props}
    >
      <motion.div
        whileHover={{ scale: 1.05 }}
        className="h-full w-full"
      >
        {children}
      </motion.div>
    </div>
  )
}

interface AvatarImageProps extends Omit<React.ComponentPropsWithoutRef<typeof Image>, "src"> {
  className?: string;
  src: string;
}

export function AvatarImage({ className, alt, src, ...props }: AvatarImageProps) {
  return (
    <Image
      className={cn("aspect-square h-full w-full object-cover", className)}
      src={src}
      alt={alt || "Avatar"}
      fill
      sizes="(max-width: 40px) 100vw, 40px"
      priority
      {...props}
    />
  )
}

interface AvatarFallbackProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
  children: React.ReactNode
}

export function AvatarFallback({ className, children, ...props }: AvatarFallbackProps) {
  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center rounded-full bg-muted",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export default Avatar
