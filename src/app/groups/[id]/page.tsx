"use client";

import React from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { Button } from "@/components/ui/button";
import { EventCard } from "@/components/cards/GroupEventCards";
import { MemberCard } from "@/components/cards/NotificationMemberCards";
import { getGroupById, getGroupEvents, getGroupMembers, isGroupAdmin, getCurrentUser } from "@/lib/mockData";
import { Calendar, Users, Settings, Share2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Image from "next/image";
import { GroupTabs, InviteDialog } from "@/components/ui-elements/DialogsAndTabs";

export default function GroupDetailsPage() {
  // Obter o ID do grupo da URL
  const params = useParams();
  const groupId = params.id as string;
  
  // Simulando dados do grupo, eventos e membros
  const group = getGroupById(groupId);
  const events = getGroupEvents(groupId);
  const members = getGroupMembers(groupId);
  const currentUser = getCurrentUser();
  const isAdmin = isGroupAdmin(currentUser.id, groupId);
  
  // Estado para controlar o diálogo de convite
  const [inviteDialogOpen, setInviteDialogOpen] = React.useState(false);

  if (!group) {
    return (
      <MobileLayout
        header={<TopNav title="Grupo não encontrado" backHref="/groups" />}
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
      header={
        <TopNav 
          title={group.name} 
          backHref="/groups" 
          showNotifications 
          user={currentUser}
        />
      }
      footer={<BottomNav />}
    >
      <div className="space-y-6">
        <div className="h-40 -mx-4 overflow-hidden relative">
          <Image
            src={group.image}
            alt={group.name}
            className="w-full h-full object-cover"
            fill
            priority
            sizes="100vw"
            blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2U2ZTZlNiIvPjwvc3ZnPg=="
            placeholder="blur"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
          <div className="absolute bottom-0 left-0 p-4 w-full">
            <h1 className="text-2xl font-bold text-white drop-shadow-sm">{group.name}</h1>
            <p className="text-white font-medium text-sm line-clamp-2 drop-shadow-sm">{group.description}</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center text-sm text-muted-foreground">
              <Users className="mr-1 h-4 w-4" />
              {members.length} membros
            </div>
            <span className="text-muted-foreground">•</span>
            <div className="text-sm text-muted-foreground capitalize">
              {group.sport}
            </div>
          </div>
          
          <div className="flex gap-2">
            {isAdmin && (
              <Button variant="outline" size="icon" asChild>
                <Link href={`/groups/${groupId}/settings`}>
                  <Settings className="h-4 w-4" />
                </Link>
              </Button>
            )}
            <Button variant="outline" size="icon" onClick={() => setInviteDialogOpen(true)}>
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <GroupTabs />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Próximos Eventos</h3>
            {isAdmin && (
              <Button size="sm" asChild>
                <Link href={`/groups/${groupId}/events/create`}>
                  <Calendar className="h-4 w-4 mr-1" /> Novo Evento
                </Link>
              </Button>
            )}
          </div>

          {events.length === 0 ? (
            <p className="text-center py-6 text-muted-foreground">
              Nenhum evento agendado para este grupo.
            </p>
          ) : (
            <div className="grid gap-4">
              {events.slice(0, 3).map((event) => (
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
              {events.length > 3 && (
                <Button variant="outline" asChild>
                  <Link href={`/groups/${groupId}/events`}>
                    Ver todos os eventos
                  </Link>
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Membros</h3>
            {isAdmin && (
              <Button size="sm" variant="outline" onClick={() => setInviteDialogOpen(true)}>
                <Users className="h-4 w-4 mr-1" /> Convidar
              </Button>
            )}
          </div>

          <div className="grid gap-2">
            {members.slice(0, 5).map((member) => (
              <MemberCard
                key={member.id}
                id={member.id}
                name={member.name}
                avatar={member.avatar}
                isAdmin={group.admins.includes(member.id)}
                groupId={groupId}
              />
            ))}
            {members.length > 5 && (
              <Button variant="outline" asChild>
                <Link href={`/groups/${groupId}/members`}>
                  Ver todos os membros
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      <InviteDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        groupName={group.name}
        inviteLink={`https://sportsgroupapp.com/invite/${groupId}`}
      />
    </MobileLayout>
  );
}
