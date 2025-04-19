"use client";

import React from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { Button } from "@/components/ui/button";
import { EventCard } from "@/components/cards/GroupEventCards";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getGroupById, getGroupEvents, getCurrentUser } from "@/lib/mockData";
import { Calendar, Plus } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function GroupEventsPage() {
  // Obter o ID do grupo da URL
  const params = useParams();
  const groupId = params.id as string;
  
  // Simulando dados do grupo e eventos
  const group = getGroupById(groupId);
  const allEvents = getGroupEvents(groupId);
  const currentUser = getCurrentUser();
  const isAdmin = group?.admins.includes(currentUser.id) || false;
  
  const [filter, setFilter] = React.useState<'upcoming' | 'past'>('upcoming');
  
  // Filtrar eventos por data
  const today = new Date();
  const events = allEvents.filter(event => {
    const eventDate = new Date(`${event.date}T${event.time}`);
    return filter === 'upcoming' 
      ? eventDate >= today 
      : eventDate < today;
  });

  if (!group) {
    return (
      <MobileLayout
        header={<TopNav title="Eventos" backHref="/groups" />}
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

  return (
    <MobileLayout
      header={<TopNav title="Eventos do Grupo" backHref={`/groups/${groupId}`} />}
      footer={<BottomNav />}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">{group.name}</h2>
          {isAdmin && (
            <Button size="sm" asChild>
              <Link href={`/groups/${groupId}/events/create`}>
                <Plus className="h-4 w-4 mr-1" /> Novo Evento
              </Link>
            </Button>
          )}
        </div>

        <Tabs defaultValue="upcoming" className="w-full" onValueChange={(value) => setFilter(value as 'upcoming' | 'past')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upcoming">Próximos</TabsTrigger>
            <TabsTrigger value="past">Anteriores</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="space-y-4">
          {events.length === 0 ? (
            <div className="text-center py-10 space-y-4">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">
                {filter === 'upcoming' 
                  ? "Não há eventos futuros agendados." 
                  : "Não há eventos anteriores."}
              </p>
              {isAdmin && filter === 'upcoming' && (
                <Button asChild>
                  <Link href={`/groups/${groupId}/events/create`}>
                    <Plus className="h-4 w-4 mr-1" /> Criar Evento
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-4">
              {events.map((event) => (
                <EventCard
                  key={event.id}
                  id={event.id}
                  title={event.title}
                  description={event.description}
                  location={event.location}
                  date={event.date}
                  time={event.time}
                  attendeeCount={event.attendees.filter(a => a.status === 'confirmed').length}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </MobileLayout>
  );
}
