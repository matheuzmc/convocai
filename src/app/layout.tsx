import { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Sports Group App",
  description: "Aplicativo para administração de grupos esportivos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          inter.variable
        )}
      >
        <QueryProvider>
          <ThemeProvider>
            {children}
            <Toaster position="bottom-center" duration={2200} swipeDirections={['right', 'left']} offset={{bottom: 80}} mobileOffset={{bottom: 80}} />
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
