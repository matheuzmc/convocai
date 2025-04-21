"use client"

import * as React from "react"
import { MobileLayout } from "@/components/layout/MobileLayout"
import { TopNav } from "@/components/navigation/TopNav"
import { BottomNav } from "@/components/navigation/BottomNav"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { GroupCard } from "@/components/cards/GroupEventCards"
import { EventCard } from "@/components/cards/GroupEventCards"
import { NotificationCard } from "@/components/cards/NotificationMemberCards"
import { getCurrentUser, getUserGroups, getGroupEvents, getUserNotifications, Event } from "@/lib/mockData"
import { Plus, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  // Simulando dados do usuário, grupos, eventos e notificações
  const currentUser = getCurrentUser()
  const userGroups = getUserGroups(currentUser.id)
  
  // Obter eventos dos grupos do usuário
  let allEvents: Event[] = []
  userGroups.forEach(group => {
    const groupEvents = getGroupEvents(group.id)
    allEvents = [...allEvents, ...groupEvents]
  })
  
  // Filtrar apenas eventos futuros e ordenar por data
  const today = new Date()
  const upcomingEvents = allEvents
    .filter(event => {
      const eventDate = new Date(`${event.date}T${event.time}`)
      return eventDate >= today
    })
    .sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`)
      const dateB = new Date(`${b.date}T${b.time}`)
      return dateA.getTime() - dateB.getTime()
    })
  
  // Obter notificações não lidas
  const unreadNotifications = getUserNotifications(currentUser.id)
    .filter(notification => !notification.isRead)

  return (
    <MobileLayout
      header={<TopNav title="Início" showNotifications user={currentUser} />}
      footer={<BottomNav />}
    >
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Olá, {currentUser.name.split(' ')[0]}!</h1>
          <p className="text-muted-foreground">
            Bem-vindo ao seu painel de grupos esportivos
          </p>
        </div>

        {/* Próximos eventos */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Próximos Eventos</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/events" className="flex items-center">
                Ver todos <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {upcomingEvents.length === 0 ? (
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-muted-foreground py-4">
                  Você não tem eventos agendados.
                </p>
                <Button asChild>
                  <Link href="/groups">
                    <Plus className="h-4 w-4 mr-1" /> Explorar Grupos
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {upcomingEvents.slice(0, 3).map((event) => (
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

        {/* Seus grupos */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Seus Grupos</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/groups" className="flex items-center">
                Ver todos <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {userGroups.length === 0 ? (
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-muted-foreground py-4">
                  Você ainda não participa de nenhum grupo.
                </p>
                <Button asChild>
                  <Link href="/groups/create">
                    <Plus className="h-4 w-4 mr-1" /> Criar Grupo
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {userGroups.slice(0, 2).map((group) => (
                <GroupCard
                  key={group.id}
                  id={group.id}
                  name={group.name}
                  description={group.description}
                  sport={group.sport}
                  image={group.image}
                  memberCount={group.members.length}
                />
              ))}
            </div>
          )}
        </div>

        {/* Notificações recentes */}
        {unreadNotifications.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Notificações</h2>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/notifications" className="flex items-center">
                  Ver todas <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>

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
          </div>
        )}
      </div>
    </MobileLayout>
  )
}
