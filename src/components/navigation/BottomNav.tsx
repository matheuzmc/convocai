"use client"

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, Users, Calendar, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  className?: string;
}

export function BottomNav({ className }: BottomNavProps) {
  const pathname = usePathname();
  
  return (
    <motion.div 
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.1 }}
      className={cn(
        "h-16 px-4 flex items-center justify-between bg-background elevation-2 border-t border-border",
        className
      )}
    >
      <NavItem href="/dashboard" icon={<Home className="h-6 w-6" />} label="Início" isActive={pathname === "/dashboard"} />
      <NavItem href="/groups" icon={<Users className="h-6 w-6" />} label="Grupos" isActive={pathname.startsWith("/groups")} />
      <NavItem href="/events" icon={<Calendar className="h-6 w-6" />} label="Eventos" isActive={pathname.startsWith("/events")} />
      <NavItem href="/notifications" icon={<Bell className="h-6 w-6" />} label="Notificações" isActive={pathname.startsWith("/notifications")} />
    </motion.div>
  );
}

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
}

function NavItem({ href, icon, label, isActive }: NavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col items-center justify-center gap-1 transition-colors",
        isActive 
          ? "text-primary font-medium" 
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      <motion.div
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="flex flex-col items-center justify-center"
      >
        {icon}
        <span className="text-xs mt-1">
          {label}
        </span>
      </motion.div>
    </Link>
  );
}

export default BottomNav;
