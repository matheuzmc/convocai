"use client";

import React from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, User as UserIcon, CreditCard, Settings, HelpCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { getUserDisplayData } from "@/lib/utils";

export default function MenuPage() {
  const router = useRouter();
  const supabase = createClient();
  const { data: currentUser, isLoading, error } = useCurrentUser();

  const handleLogout = async () => {
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      console.error("Error logging out:", signOutError);
    } else {
      router.push('/login');
    }
  };

  const menuItems = [
    {
      icon: <UserIcon className="h-5 w-5" />,
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

  // Usar a função utilitária para obter nome e iniciais
  const { displayName, fallbackInitials } = getUserDisplayData({
    name: currentUser?.name,
    lastName: currentUser?.lastName,
    email: currentUser?.email,
  });

  const avatarUrl = currentUser?.avatar;

  if (error) {
    return (
      <MobileLayout
        header={<TopNav title="Menu" />}
        footer={<BottomNav />}
      >
        <div className="p-4 text-center text-destructive">Erro ao carregar dados do usuário.</div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout
      header={<TopNav title="Menu" showNotifications />}
      footer={<BottomNav />}
    >
      <div className="space-y-6 p-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              {isLoading ? (
                <Skeleton className="h-16 w-16 rounded-full" />
              ) : (
                <Avatar className="h-16 w-16">
                  {avatarUrl ? (
                    <AvatarImage src={avatarUrl} alt={displayName} key={avatarUrl} />
                  ) : (
                    <AvatarFallback>{fallbackInitials}</AvatarFallback>
                  )}
                </Avatar>
              )}
              {isLoading ? (
                <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-40" />
                </div>
               ) : (
                <div>
                  <h2 className="text-xl font-semibold">{displayName}</h2>
                  <p className="text-sm text-muted-foreground">{currentUser?.email ?? "Email não disponível"}</p>
                </div>
              )}
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

        <Button variant="outline" className="w-full" onClick={handleLogout} disabled={isLoading}>
          <LogOut className="h-4 w-4 mr-2" /> Sair
        </Button>
      </div>
    </MobileLayout>
  );
}
