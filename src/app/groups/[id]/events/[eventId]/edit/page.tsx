"use client";

import React from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { EventForm, EventFormData } from "@/components/forms/GroupEventForms";
import { getGroupById, getEventById, getCurrentUser } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

export default function EditEventPage() {
  const router = useRouter();
  
  // Obter IDs do grupo e evento da URL
  const params = useParams();
  const groupId = params.id as string;
  const eventId = params.eventId as string;
  
  // Simulando dados do grupo e evento
  const group = getGroupById(groupId);
  const event = getEventById(eventId);
  const currentUser = getCurrentUser();
  const isAdmin = group?.admins.includes(currentUser.id) || false;

  const handleSubmit = (data: EventFormData) => {
    // Aqui seria implementada a lógica para atualizar o evento
    console.log("Atualizando evento:", {id: eventId, ...data});
    
    // Redirecionando para a página de detalhes do evento após atualização
    router.push(`/events/${eventId}`);
  };

  if (!group) {
    return (
      <MobileLayout
        header={<TopNav title="Editar Evento" backHref="/groups" />}
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

  if (!event) {
    return (
      <MobileLayout
        header={<TopNav title="Editar Evento" backHref={`/groups/${groupId}/events`} />}
        footer={<BottomNav />}
      >
        <div className="flex flex-col items-center justify-center h-full py-10 text-center">
          <h2 className="text-xl font-semibold mb-2">Evento não encontrado</h2>
          <p className="text-muted-foreground mb-6">
            O evento que você está tentando editar não existe ou foi removido.
          </p>
          <Button asChild>
            <Link href={`/groups/${groupId}/events`}>Voltar para Eventos</Link>
          </Button>
        </div>
      </MobileLayout>
    );
  }

  if (!isAdmin) {
    return (
      <MobileLayout
        header={<TopNav title="Editar Evento" backHref={`/events/${eventId}`} />}
        footer={<BottomNav />}
      >
        <div className="flex flex-col items-center justify-center h-full py-10 text-center">
          <h2 className="text-xl font-semibold mb-2">Acesso restrito</h2>
          <p className="text-muted-foreground mb-6">
            Apenas administradores podem editar eventos do grupo.
          </p>
          <Button asChild>
            <Link href={`/events/${eventId}`}>Voltar para o Evento</Link>
          </Button>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout
      header={<TopNav title="Editar Evento" backHref={`/events/${eventId}`} />}
      footer={<BottomNav />}
    >
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Editar evento: {event.title}</h2>
        
        <p className="text-muted-foreground">
          Atualize as informações do evento abaixo.
        </p>
        
        <EventForm 
          onSubmit={handleSubmit} 
          initialData={{
            title: event.title,
            description: event.description,
            date: event.date,
            time: event.time,
            location: event.location,
            isPeriodic: event.isPeriodic,
            frequency: event.frequency,
            notifyBefore: event.notifyBefore.toString()
          }}
          isEdit={true}
        />
      </div>
    </MobileLayout>
  );
} 