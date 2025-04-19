"use client";

import React from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { EventForm } from "@/components/forms/GroupEventForms";
import { getGroupById, getCurrentUser } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function CreateEventPage() {
  // Obter ID do grupo da URL
  const params = useParams();
  const groupId = params.id as string;
  
  // Simulando dados do grupo
  const group = getGroupById(groupId);
  const currentUser = getCurrentUser();
  const isAdmin = group?.admins.includes(currentUser.id) || false;

  const handleSubmit = (data: Record<string, unknown>) => {
    // Aqui seria implementada a lógica para criar um novo evento
    console.log("Criando evento:", data);
  };

  if (!group) {
    return (
      <MobileLayout
        header={<TopNav title="Criar Evento" backHref="/groups" />}
        footer={<BottomNav />}
      >
        <div className="flex flex-col items-center justify-center h-full py-10 text-center">
          <h2 className="text-xl font-semibold mb-2">Grupo não encontrado</h2>
          <p className="text-muted-foreground mb-6">
            O grupo que você está procurando não existe ou foi removido.
          </p>
          <Button asChild>
            <Link href="/groups">Voltar para Grupos</Link>
          </Button>
        </div>
      </MobileLayout>
    );
  }

  if (!isAdmin) {
    return (
      <MobileLayout
        header={<TopNav title="Criar Evento" backHref={`/groups/${groupId}`} />}
        footer={<BottomNav />}
      >
        <div className="flex flex-col items-center justify-center h-full py-10 text-center">
          <h2 className="text-xl font-semibold mb-2">Acesso restrito</h2>
          <p className="text-muted-foreground mb-6">
            Apenas administradores podem criar eventos para o grupo.
          </p>
          <Button asChild>
            <Link href={`/groups/${groupId}`}>Voltar para o Grupo</Link>
          </Button>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout
      header={<TopNav title="Criar Evento" backHref={`/groups/${groupId}/events`} />}
      footer={<BottomNav />}
    >
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Novo Evento para {group.name}</h2>
        
        <p className="text-muted-foreground">
          Preencha os dados abaixo para criar um novo evento para o grupo.
        </p>
        
        <EventForm onSubmit={handleSubmit} />
      </div>
    </MobileLayout>
  );
}
