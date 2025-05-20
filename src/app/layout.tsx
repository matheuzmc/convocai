// "use client";

import { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import { NotificationsProvider } from "@/contexts/NotificationsContext";
import { ServiceWorkerRegistrar } from "@/components/providers/ServiceWorkerRegistrar";
// import { useEffect } from 'react';

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Sports Group App",
  description: "Aplicativo para administração de grupos esportivos",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Sports Group App",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // useEffect foi REMOVIDO daqui

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <meta name="theme-color" content="#000000" />
      <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          inter.variable
        )}
      >
        <QueryProvider>
          <ThemeProvider>
            <NotificationsProvider>
              <ServiceWorkerRegistrar />
              {children}
              <Toaster position="bottom-center" duration={2200} swipeDirections={['right', 'left']} offset={{bottom: 80}} mobileOffset={{bottom: 80}} />
            </NotificationsProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
