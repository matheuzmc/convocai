"use client"

import React, { useState, useEffect } from "react";
import { MobileLayout } from "@/components/layout/MobileLayout"
import { TopNav } from "@/components/navigation/TopNav"
import { BottomNav } from "@/components/navigation/BottomNav"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { GroupCard } from "@/components/cards/GroupEventCards"
import { EventCard } from "@/components/cards/GroupEventCards"
import { NotificationCard } from "@/components/cards/NotificationMemberCards"
import { Plus, ArrowRight } from "lucide-react"
import Link from "next/link"
import { Group, Event, Notification } from "@/lib/types"
import { createClient } from '@/lib/supabase/client';
import { User } from "@supabase/supabase-js";
import { Skeleton } from "@/components/ui/skeleton"
import { useQuery } from "@tanstack/react-query"
import { 
  getUserGroups, 
  getUpcomingEvents, 
  getUnreadNotifications 
} from "@/services/api"

export default function DashboardPage() {
  const supabase = createClient();
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      setLoadingAuth(true);
      const { data: { user } } = await supabase.auth.getUser();
      setAuthUser(user);
      setLoadingAuth(false);
    };
    getUser();
  }, [supabase]);

  // Fetch user groups using React Query
  const { 
    data: userGroupsData, 
    isLoading: isLoadingGroups, 
    error: groupsError
  } = useQuery<Group[]>({
    queryKey: ['userGroups', authUser?.id],
    queryFn: getUserGroups,
    enabled: !!authUser,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch upcoming events using React Query
  const { 
    data: upcomingEventsData, 
    isLoading: isLoadingEvents, 
    error: eventsError 
  } = useQuery<Event[]>({
    queryKey: ['upcomingEvents', authUser?.id],
    queryFn: getUpcomingEvents,
    enabled: !!authUser,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch unread notifications using React Query
  const { 
    data: unreadNotificationsData, 
    isLoading: isLoadingNotifications, 
    error: notificationsError 
  } = useQuery<Notification[]>({
    queryKey: ['unreadNotifications', authUser?.id],
    queryFn: getUnreadNotifications,
    enabled: !!authUser,
    staleTime: 2 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });

  // Show loading skeleton while auth OR initial data is loading
  const showLoadingSkeleton = loadingAuth || 
                              (!!authUser && isLoadingGroups) || 
                              (!!authUser && isLoadingEvents) ||
                              (!!authUser && isLoadingNotifications);

  if (showLoadingSkeleton) {
    return (
      <MobileLayout
        header={<TopNav title="Início" showNotifications />}
        footer={<BottomNav />}
      >
        <div className="space-y-8 p-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          {/* Skeleton for upcoming events - show specifically when events are loading */}
          <div className="space-y-4">
             <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-6 w-20" />
             </div>
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
          {/* Skeleton for groups - show specifically when groups are loading */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-6 w-20" />
            </div>
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
           {/* Skeleton for notifications - show specifically when loading */}
           <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-36" />
                <Skeleton className="h-6 w-20" />
             </div>
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
      </MobileLayout>
    );
  }
  
  // Handle potential errors
  if (groupsError) {
    console.error("Error fetching groups:", groupsError);
  }
  if (eventsError) {
    console.error("Error fetching events:", eventsError);
  }
  if (notificationsError) {
    console.error("Error fetching notifications:", notificationsError);
  }

  // Use fetched data, default to empty array if undefined/null
  const userGroups = userGroupsData ?? [];
  const upcomingEvents = upcomingEventsData ?? [];
  const unreadNotifications = Array.isArray(unreadNotificationsData) ? unreadNotificationsData : [];

  return (
    <MobileLayout
      header={<TopNav title="Início" showNotifications />}
      footer={<BottomNav />}
    >
      <div className="space-y-8 p-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Olá, {authUser?.user_metadata?.name?.split(' ')[0] ?? 'Usuário'}!</h1>
          <p className="text-muted-foreground">
            Bem-vindo ao seu painel de grupos esportivos
          </p>
        </div>

        {/* Próximos eventos - Use fetched data */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Próximos Eventos</h2>
            {upcomingEvents.length > 0 && (
              <Button variant="ghost" size="sm" asChild>
                <Link href="/events" className="flex items-center">
                  Ver todos <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>

          {/* Loading state handled by showLoadingSkeleton above */}
          {/* Error/Empty state */}
          {!isLoadingEvents && upcomingEvents.length === 0 && (
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-muted-foreground py-4">
                  {eventsError ? "Erro ao carregar eventos." : "Você não tem eventos futuros agendados."}
                </p>
                <Button asChild>
                  <Link href="/groups">
                    <Plus className="h-4 w-4 mr-1" /> Explorar Grupos
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Show events if available */}
          {!isLoadingEvents && upcomingEvents.length > 0 && (
            <div className="grid gap-4">
              {upcomingEvents.slice(0, 3).map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                />
              ))}
            </div>
          )}
        </div>

        {/* Seus grupos - Use fetched data */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Seus Grupos</h2>
            {userGroups.length > 0 && (
              <Button variant="ghost" size="sm" asChild>
                <Link href="/groups" className="flex items-center">
                  Ver todos <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
          
          {/* Show empty state or error state */}
          {!isLoadingGroups && userGroups.length === 0 && (
             <Card>
              <CardContent className="p-4 text-center">
                <p className="text-muted-foreground py-4">
                  {groupsError ? "Erro ao carregar grupos." : "Você ainda não participa de nenhum grupo."}
                </p>
                <Button asChild>
                  <Link href="/groups/create">
                    <Plus className="h-4 w-4 mr-1" /> Criar Grupo
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Show groups if available */}
          {!isLoadingGroups && userGroups.length > 0 && (
            <div className="grid gap-4">
              {userGroups.slice(0, 2).map((group) => (
                <GroupCard
                  key={group.id}
                  id={group.id}
                  name={group.name}
                  description={group.description ?? ''}
                  sport={group.sport}
                  image={group.image}
                  memberCount={group.memberCount ?? 0}
                />
              ))}
            </div>
          )}
        </div>

        {/* Notificações recentes - Use fetched data */}
        {/* Conditionally render section only if loading is finished AND there are notifications OR an error occurred */}
        {(!isLoadingNotifications && unreadNotifications.length > 0) || notificationsError ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Notificações</h2>
              {/* Show "Ver todas" only if there are notifications */}
              {unreadNotifications.length > 0 && (
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/notifications" className="flex items-center">
                    Ver todas <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>

            {/* Handle Error state */}
            {notificationsError && (
                <Card>
                    <CardContent className="p-4 text-center text-destructive">
                        Erro ao carregar notificações.
                    </CardContent>
                </Card>
            )}

            {/* Show notifications if available and no error */}
            {!notificationsError && unreadNotifications.length > 0 && (
                <div className="grid gap-4">
                {unreadNotifications.slice(0, 3).map((notification) => (
                    <NotificationCard
                    key={notification.id}
                    id={notification.id}
                    title={notification.title}
                    message={notification.message}
                    type={notification.type as "info" | "success" | "warning"}
                    isRead={notification.isRead}
                    createdAt={notification.createdAt}
                    relatedId={notification.relatedId}
                    />
                ))}
                </div>
            )}
          </div>
        ) : null} 

      </div>
    </MobileLayout>
  )
}
