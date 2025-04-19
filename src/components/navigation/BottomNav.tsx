import React from "react";
import Link from "next/link";
import { Home, Users, Calendar, Bell, Menu } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  className?: string;
}

export function BottomNav({ className }: BottomNavProps) {
  return (
    <div className={cn("h-16 px-4 flex items-center justify-between", className)}>
      <NavItem href="/dashboard" icon={<Home className="h-6 w-6" />} label="Início" />
      <NavItem href="/groups" icon={<Users className="h-6 w-6" />} label="Grupos" />
      <NavItem href="/events" icon={<Calendar className="h-6 w-6" />} label="Eventos" />
      <NavItem href="/notifications" icon={<Bell className="h-6 w-6" />} label="Notificações" />
      <NavItem href="/menu" icon={<Menu className="h-6 w-6" />} label="Menu" />
    </div>
  );
}

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
}

function NavItem({ href, icon, label }: NavItemProps) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
    >
      {icon}
      <span className="text-xs">{label}</span>
    </Link>
  );
}
