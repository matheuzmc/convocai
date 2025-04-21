"use client";

import React from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getEventById, getUserById, getGroupById, getCurrentUser } from "@/lib/mockData";
import { Calendar, Clock, MapPin, Check, X } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function EventDetailsPage() {
  // Obter o ID do evento da URL
  const params = useParams();
  const eventId = params.id as string;
  
  // Simulando dados do evento
  const event = getEventById(eventId);
  const currentUser = getCurrentUser();
  
  // Verificar se o usuário atual está confirmado para o evento
  const userAttendance = event?.attendees.find(a => a.userId === currentUser.id);
  const isConfirmed = userAttendance?.status === 'confirmed';
  const isDeclined = userAttendance?.status === 'declined';
  
  // Obter dados do grupo
  const group = event ? getGroupById(event.groupId) : null;
  const isAdmin = group?.admins.includes(currentUser.id) || false;

  if (!event || !group) {
    return (
      <MobileLayout
        header={<TopNav title="Evento" backHref="/events" />}
        footer={<BottomNav />}
      >
        <div className="flex flex-col items-center justify-center h-full py-10 text-center">
          <h2 className="text-xl font-semibold mb-2">Evento não encontrado</h2>
          <p className="text-muted-foreground mb-6">
            O evento que você está procurando não existe ou foi removido.
          </p>
          <Button asChild>
            <Link href="/events">Voltar para Eventos</Link>
          </Button>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout
      header={<TopNav title="Detalhes do Evento" backHref={`/groups/${group.id}`} />}
      footer={<BottomNav />}
    >
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">{event.title}</h1>
          <div className="flex items-center gap-2">
            <Link href={`/groups/${group.id}`} className="text-primary hover:underline">
              {group.name}
            </Link>
            {event.isPeriodic && (
              <Badge variant="outline">
                {event.frequency === 'weekly' ? 'Semanal' : 
                 event.frequency === 'biweekly' ? 'Quinzenal' : 'Mensal'}
              </Badge>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Data e Hora</p>
                  <p className="text-sm text-muted-foreground">
                    {event.date} às {event.time}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Local</p>
                  <p className="text-sm text-muted-foreground">
                    {event.location}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Notificação</p>
                  <p className="text-sm text-muted-foreground">
                    {event.notifyBefore} horas antes do evento
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Descrição</h3>
            <p className="text-muted-foreground">
              {event.description}
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Participantes</h3>
              <span className="text-sm text-muted-foreground">
                {event.attendees.filter(a => a.status === 'confirmed').length} confirmados
              </span>
            </div>
            
            <div className="grid gap-2">
              {event.attendees.map((attendee) => {
                const user = getUserById(attendee.userId);
                if (!user) return null;
                
                return (
                  <div key={user.id} className="flex items-center justify-between p-2 rounded-md border">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback>
                          {user.name.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <Badge 
                          variant={attendee.status === 'confirmed' ? 'default' : 
                                  attendee.status === 'declined' ? 'destructive' : 'outline'}
                          className="text-xs"
                        >
                          {attendee.status === 'confirmed' ? 'Confirmado' : 
                           attendee.status === 'declined' ? 'Não vai' : 'Pendente'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
        <div className="pt-4 border-t">
          <div className="flex gap-2">
            {isConfirmed ? (
              <Button variant="outline" className="w-full">
                <X className="mr-2 h-4 w-4" /> Cancelar presença
              </Button>
            ) : isDeclined ? (
              <Button className="w-full">
                <Check className="mr-2 h-4 w-4" /> Confirmar presença
              </Button>
            ) : (
              <>
                <Button variant="outline" className="w-full">
                  <X className="mr-2 h-4 w-4" /> Não vou
                </Button>
                <Button className="w-full">
                  <Check className="mr-2 h-4 w-4" /> Confirmar
                </Button>
              </>
            )}
          </div>
          
          {isAdmin && (
            <Button variant="outline" className="w-full mt-2" asChild>
              <Link href={`/groups/${group.id}/events/${eventId}/edit`}>
                Editar evento
              </Link>
            </Button>
          )}
        </div>
      </div>
    </MobileLayout>
  );
}
