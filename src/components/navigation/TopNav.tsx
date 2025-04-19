import React from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronLeft, Bell } from "lucide-react";
import Link from "next/link";

interface TopNavProps {
  title: string;
  backHref?: string;
  showNotifications?: boolean;
  className?: string;
  rightElement?: React.ReactNode;
  user?: {
    name: string;
    avatar: string;
  };
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
    <div
      className={cn(
        "h-16 px-4 flex items-center justify-between",
        className
      )}
    >
      <div className="flex items-center gap-3">
        {backHref && (
          <Link href={backHref} className="p-2 -ml-2">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        )}
        <h1 className="text-lg font-semibold">{title}</h1>
      </div>
      <div className="flex items-center gap-4">
        {showNotifications && (
          <Link href="/notifications" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
              3
            </span>
          </Link>
        )}
        {rightElement}
        {user && (
          <Link href="/profile">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback>
                {user.name.split(" ").map((n) => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
          </Link>
        )}
      </div>
    </div>
  );
}
