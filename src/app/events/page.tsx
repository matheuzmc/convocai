"use client";

import { EventCard } from "@/components/cards/GroupEventCards";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { BottomNav } from "@/components/navigation/BottomNav";
import { TopNav } from "@/components/navigation/TopNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Event, getCurrentUser, getGroupEvents, getUserGroups } from "@/lib/mockData";
import { Calendar, Plus } from "lucide-react";
import Link from "next/link";
import React from "react";

export default function EventsPage() {
  // Simulando dados do usuário e eventos
  const currentUser = getCurrentUser();
  const userGroups = getUserGroups(currentUser.id);
  
  // Obter todos os eventos dos grupos do usuário
  let allEvents: Event[] = [];
  userGroups.forEach(group => {
    const groupEvents = getGroupEvents(group.id);
    allEvents = [...allEvents, ...groupEvents];
  });
  
  // Filtrar eventos por data
  const today = new Date();
  const [filter, setFilter] = React.useState<'upcoming' | 'past'>('upcoming');
  
  const filteredEvents = allEvents
    .filter(event => {
      const eventDate = new Date(`${event.date}T${event.time}`);
      return filter === 'upcoming' 
        ? eventDate >= today 
        : eventDate < today;
    })
    .sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`);
      const dateB = new Date(`${b.date}T${b.time}`);
      return filter === 'upcoming'
        ? dateA.getTime() - dateB.getTime()  // Crescente para próximos
        : dateB.getTime() - dateA.getTime(); // Decrescente para passados
    });

  return (
    <MobileLayout
      header={<TopNav title="Meus Eventos" showNotifications user={currentUser} />}
      footer={<BottomNav />}
    >
      <div className="space-y-6">
        <Tabs defaultValue="upcoming" className="w-full" onValueChange={(value) => setFilter(value as 'upcoming' | 'past')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upcoming">Próximos</TabsTrigger>
            <TabsTrigger value="past">Anteriores</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {filter === 'upcoming' ? 'Próximos Eventos' : 'Eventos Anteriores'}
          </h2>
          {filter === 'past' && (
            <Button variant="outline" size="sm" asChild>
              <Link href="/events/history">
                Ver histórico completo
              </Link>
            </Button>
          )}
        </div>

        <div className="space-y-4">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-10 space-y-4">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">
                {filter === 'upcoming' 
                  ? "Você não tem eventos futuros agendados." 
                  : "Você não tem eventos anteriores."}
              </p>
              {filter === 'upcoming' && (
                <Button asChild>
                  <Link href="/groups">
                    <Plus className="h-4 w-4 mr-1" /> Explorar Grupos
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredEvents.slice(0, 5).map((event) => {
                const group = userGroups.find(g => g.id === event.groupId);
                const attendance = event.attendees.find(a => a.userId === currentUser.id);
                const attendanceStatus = attendance ? attendance.status : 'pending';
                
                return (
                  <EventCard
                    key={event.id}
                    id={event.id}
                    title={event.title}
                    description={event.description}
                    location={event.location}
                    date={event.date}
                    time={event.time}
                    attendeeCount={event.attendees.filter(a => a.status === 'confirmed').length}
                    groupName={group?.name}
                    attendanceStatus={filter === 'past' ? attendanceStatus : undefined}
                    isPast={filter === 'past'}
                  />
                );
              })}
            </div>
          )}
        </div>
        
        {filteredEvents.length > 5 && (
          <div className="text-center">
            <Button variant="outline" asChild>
              <Link href={filter === 'past' ? "/events/history" : "#"}>
                Ver todos os {filter === 'upcoming' ? 'próximos' : 'anteriores'}
              </Link>
            </Button>
          </div>
        )}
        
        {filteredEvents.length > 0 && filter === 'upcoming' && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Estatísticas</h3>
                  <p className="text-sm text-muted-foreground">
                    Seus próximos eventos
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{filteredEvents.length}</p>
                  <p className="text-sm text-muted-foreground">
                    eventos agendados
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MobileLayout>
  );
}
