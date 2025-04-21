import React from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getCurrentUser } from "@/lib/mockData";
import { LogOut, User, CreditCard, Settings, HelpCircle } from "lucide-react";
import Link from "next/link";

export default function MenuPage() {
  // Simulando dados do usuário
  const currentUser = getCurrentUser();

  const menuItems = [
    {
      icon: <User className="h-5 w-5" />,
      title: "Perfil",
      href: "/profile",
    },
    {
      icon: <CreditCard className="h-5 w-5" />,
      title: "Plano e Assinatura",
      href: "/plans",
    },
    {
      icon: <Settings className="h-5 w-5" />,
      title: "Configurações",
      href: "/settings",
    },
    {
      icon: <HelpCircle className="h-5 w-5" />,
      title: "Ajuda e Suporte",
      href: "/help",
    },
  ];

  return (
    <MobileLayout
      header={<TopNav title="Menu" showNotifications user={currentUser} />}
      footer={<BottomNav />}
    >
      <div className="space-y-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
                <AvatarFallback>
                  {currentUser.name.split(" ").map((n) => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-semibold">{currentUser.name}</h2>
                <p className="text-sm text-muted-foreground">{currentUser.email}</p>
                <p className="text-sm mt-1">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    currentUser.isPremium 
                      ? "bg-primary/10 text-primary" 
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {currentUser.isPremium ? "Plano Premium" : "Plano Gratuito"}
                  </span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-2">
          {menuItems.map((item, index) => (
            <Link key={index} href={item.href}>
              <div className="flex items-center gap-3 p-3 rounded-md hover:bg-muted transition-colors">
                <div className="p-2 rounded-full bg-primary/10 text-primary">
                  {item.icon}
                </div>
                <span>{item.title}</span>
              </div>
            </Link>
          ))}
        </div>

        <Button variant="outline" className="w-full" asChild>
          <Link href="/auth/login">
            <LogOut className="h-4 w-4 mr-2" /> Sair
          </Link>
        </Button>
      </div>
    </MobileLayout>
  );
}
