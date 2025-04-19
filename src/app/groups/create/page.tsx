"use client";

import React from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GroupForm, GroupFormData } from "@/components/forms/GroupEventForms";
import { canCreateGroup, getCurrentUser } from "@/lib/mockData";
import { Crown } from "lucide-react";
import Link from "next/link";

export default function CreateGroupPage() {
  // Simulando dados do usuário logado
  const currentUser = getCurrentUser();
  const canCreate = canCreateGroup(currentUser.id);

  const handleSubmit = (data: GroupFormData) => {
    // Aqui seria implementada a lógica para criar um novo grupo
    console.log("Criando grupo:", data);
  };

  return (
    <MobileLayout
      header={<TopNav title="Criar Grupo" backHref="/groups" />}
      footer={<BottomNav />}
    >
      {!canCreate && !currentUser.isPremium ? (
        <div className="space-y-6">
          <Card className="border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Crown className="h-6 w-6 text-yellow-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-medium">Limite de grupos atingido</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    No plano gratuito você pode criar apenas 1 grupo. Faça upgrade para o plano Premium para criar grupos ilimitados.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Button className="w-full" asChild>
            <Link href="/plans">Fazer Upgrade para Premium</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          <p className="text-muted-foreground">
            Preencha os dados abaixo para criar um novo grupo esportivo.
          </p>
          
          <GroupForm onSubmit={handleSubmit} />
        </div>
      )}
    </MobileLayout>
  );
}
