"use client";

import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Share2, Calendar, History } from "lucide-react";
import Link from "next/link";
import { EventCard } from "@/components/cards/GroupEventCards";
import { MemberCard } from "@/components/cards/NotificationMemberCards";
import { getGroupById } from "@/lib/mockData";

// Interfaces para tipagem
interface Attendee {
  userId: string;
  status: 'confirmed' | 'pending' | 'declined';
}

interface Event {
  id: string;
  title: string;
  description: string;
  location: string;
  date: string;
  time: string;
  attendees: Attendee[];
  groupId: string;
}

interface Member {
  id: string;
  name: string;
  avatar: string;
  isAdmin?: boolean;
}

interface InviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupName: string;
  inviteLink: string;
}

export function InviteDialog({ open, onOpenChange, groupName, inviteLink }: InviteDialogProps) {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink);
    // Aqui seria implementada a lógica para mostrar uma notificação de sucesso
    console.log("Link copiado para a área de transferência");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="pt-5">
          <DialogTitle>Convidar para {groupName}</DialogTitle>
          <DialogDescription>
            Compartilhe o link abaixo para convidar pessoas para o seu grupo.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center space-x-2 mt-4">
          <div className="grid flex-1 gap-2">
            <Input
              value={inviteLink}
              readOnly
              className="w-full"
              onFocus={(e) => e.target.blur()}
            />
          </div>
          <Button size="icon" onClick={copyToClipboard}>
            <Copy className="h-4 w-4" />
          </Button>
        </div>
        <div className="mt-4">
          <h4 className="text-sm font-medium mb-2">Compartilhar via</h4>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1">
              <Share2 className="h-4 w-4 mr-2" /> WhatsApp
            </Button>
            <Button variant="outline" className="flex-1">
              <Share2 className="h-4 w-4 mr-2" /> Email
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function EventDetailsTabs() {
  return (
    <Tabs defaultValue="info" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="info">Informações</TabsTrigger>
        <TabsTrigger value="participants">Participantes</TabsTrigger>
        <TabsTrigger value="comments">Comentários</TabsTrigger>
      </TabsList>
      <TabsContent value="info" className="space-y-4 mt-4">
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Descrição</h3>
          <p className="text-muted-foreground">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
          </p>
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Regras</h3>
          <p className="text-muted-foreground">
            - Chegar com 15 minutos de antecedência<br />
            - Trazer documento de identificação<br />
            - Usar uniforme adequado
          </p>
        </div>
      </TabsContent>
      <TabsContent value="participants" className="space-y-4 mt-4">
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Confirmados (12)</h3>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                {String.fromCharCode(65 + i)}
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Pendentes (5)</h3>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                {String.fromCharCode(78 + i)}
              </div>
            ))}
          </div>
        </div>
      </TabsContent>
      <TabsContent value="comments" className="space-y-4 mt-4">
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              J
            </div>
            <div className="flex-1">
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm font-medium">João Silva</p>
                <p className="text-sm">Vou chegar um pouco atrasado, me esperem!</p>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Há 2 horas</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              M
            </div>
            <div className="flex-1">
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm font-medium">Maria Oliveira</p>
                <p className="text-sm">Alguém pode me dar carona?</p>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Há 1 hora</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <Input placeholder="Escreva um comentário..." />
          <Button>Enviar</Button>
        </div>
      </TabsContent>
    </Tabs>
  );
}

export function GroupTabs({ 
  events = [], 
  members = [], 
  groupId = "", 
  isAdmin = false
}: { 
  events?: Event[], 
  members?: Member[], 
  groupId?: string,
  isAdmin?: boolean
}) {
  const [historyDialogOpen, setHistoryDialogOpen] = React.useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = React.useState(false);
  
  // Filtrar eventos por data
  const today = new Date();
  const upcomingEvents = events
    .filter(event => {
      const eventDate = new Date(`${event.date}T${event.time}`);
      return eventDate >= today;
    })
    .sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`);
      const dateB = new Date(`${b.date}T${b.time}`);
      return dateA.getTime() - dateB.getTime();
    });
    
  const pastEvents = events
    .filter(event => {
      const eventDate = new Date(`${event.date}T${event.time}`);
      return eventDate < today;
    })
    .sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`);
      const dateB = new Date(`${b.date}T${b.time}`);
      return dateB.getTime() - dateA.getTime(); // Mais recentes primeiro
    });

  return (
    <>
      <Tabs defaultValue="events" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="events">Eventos</TabsTrigger>
          <TabsTrigger value="about">Sobre</TabsTrigger>
          <TabsTrigger value="members">Membros</TabsTrigger>
        </TabsList>
        
        <TabsContent value="about" className="mt-4 space-y-4">
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Descrição</h3>
            <p className="text-muted-foreground text-sm">
              Este grupo foi criado para reunir pessoas que compartilham o interesse pelo esporte e desejam participar de atividades regulares.
            </p>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Regras</h3>
            <ul className="text-muted-foreground text-sm space-y-1 list-disc pl-5">
              <li>Respeite todos os membros</li>
              <li>Confirme presença com antecedência</li>
              <li>Chegue no horário marcado</li>
              <li>Avise se não puder comparecer</li>
            </ul>
          </div>
        </TabsContent>
        
        <TabsContent value="events" className="mt-4 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-medium">Próximos Eventos</h3>
              {pastEvents.length > 0 && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 rounded-full" 
                  onClick={() => setHistoryDialogOpen(true)}
                  title="Ver histórico de eventos"
                >
                  <History className="h-4 w-4 text-muted-foreground" />
                </Button>
              )}
            </div>
            
            {isAdmin && groupId && (
              <Button size="sm" asChild>
                <Link href={`/groups/${groupId}/events/create`}>
                  <Calendar className="h-4 w-4 mr-1" /> Novo Evento
                </Link>
              </Button>
            )}
          </div>

          {upcomingEvents.length === 0 ? (
            <p className="text-center py-6 text-muted-foreground">
              Nenhum evento agendado para este grupo.
            </p>
          ) : (
            <div className="grid gap-4 mt-2">
              {upcomingEvents.map((event) => (
                <EventCard
                  key={event.id}
                  id={event.id}
                  title={event.title}
                  description={event.description}
                  location={event.location}
                  date={event.date}
                  time={event.time}
                  attendeeCount={event.attendees.filter((a: Attendee) => a.status === 'confirmed').length}
                  isPast={false}
                />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="members" className="mt-4 space-y-4">
          <div className="grid gap-2">
            {members.length === 0 ? (
              <p className="text-center py-6 text-muted-foreground">
                Nenhum membro encontrado neste grupo.
              </p>
            ) : (
              <>
                <div className="pb-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Administradores</h3>
                </div>
                
                {members
                  .filter(member => member.isAdmin)
                  .map((member) => (
                    <MemberCard
                      key={member.id}
                      id={member.id}
                      name={member.name}
                      avatar={member.avatar}
                      isAdmin={true}
                      groupId={groupId}
                    />
                  ))}
                
                <div className="pt-4 pb-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Membros</h3>
                </div>
                
                {members
                  .filter(member => !member.isAdmin)
                  .map((member) => (
                    <MemberCard
                      key={member.id}
                      id={member.id}
                      name={member.name}
                      avatar={member.avatar}
                      isAdmin={false}
                      groupId={groupId}
                    />
                  ))}
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
          <DialogHeader className="pt-5">
            <DialogTitle>Histórico de Eventos</DialogTitle>
            <DialogDescription>
              Eventos anteriores realizados por este grupo
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-2">
            {pastEvents.length === 0 ? (
              <p className="text-center py-4 text-muted-foreground">
                Nenhum evento passado para este grupo.
              </p>
            ) : (
              <div className="grid gap-4">
                {pastEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    id={event.id}
                    title={event.title}
                    description={event.description}
                    location={event.location}
                    date={event.date}
                    time={event.time}
                    attendeeCount={event.attendees.filter((a: Attendee) => a.status === 'confirmed').length}
                    isPast={true}
                  />
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {groupId && (
        <InviteDialog
          open={inviteDialogOpen}
          onOpenChange={setInviteDialogOpen}
          groupName={getGroupById(groupId)?.name || "Grupo"}
          inviteLink={`https://sportsgroupapp.com/invite/${groupId}`}
        />
      )}
    </>
  );
}
