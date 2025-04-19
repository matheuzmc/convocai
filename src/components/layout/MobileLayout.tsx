import React from "react";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";

interface MobileLayoutProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function MobileLayout({
  children,
  header,
  footer,
  className,
}: MobileLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
      {header && (
        <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          {header}
        </header>
      )}
      <main
        className={cn(
          "flex-1 container max-w-md mx-auto p-4 md:py-6 md:px-6",
          className
        )}
      >
        {children}
      </main>
      {footer && (
        <footer className="sticky bottom-0 z-40 w-full border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          {footer}
        </footer>
      )}
      <Toaster />
    </div>
  );
}
