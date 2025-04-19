"use client";

import React from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { EventCard } from "@/components/cards/GroupEventCards";
import { Event, getCurrentUser, getUserGroups, getGroupEvents } from "@/lib/mockData";
import { Calendar, Search, Filter, Download } from "lucide-react";

export default function EventHistoryPage() {
  // Simulando dados do usuário e eventos
  const currentUser = getCurrentUser();
  const userGroups = getUserGroups(currentUser.id);
  
  // Obter todos os eventos dos grupos do usuário
  let allEvents: Event[] = [];
  userGroups.forEach(group => {
    const groupEvents = getGroupEvents(group.id);
    allEvents = [...allEvents, ...groupEvents];
  });
  
  // Filtrar apenas eventos passados e ordenar por data (mais recente primeiro)
  const today = new Date();
  const pastEvents = allEvents
    .filter(event => {
      const eventDate = new Date(`${event.date}T${event.time}`);
      return eventDate < today;
    })
    .sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`);
      const dateB = new Date(`${b.date}T${b.time}`);
      return dateB.getTime() - dateA.getTime();
    });
  
  const [filter, setFilter] = React.useState<'all' | 'attended' | 'missed'>('all');
  const [searchQuery, setSearchQuery] = React.useState("");
  const [groupFilter, setGroupFilter] = React.useState("all");
  const [timeFilter, setTimeFilter] = React.useState("all");
  
  // Aplicar filtros
  const filteredEvents = pastEvents.filter(event => {
    // Filtro de busca
    if (searchQuery && !event.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Filtro de participação
    if (filter === 'attended') {
      const attendance = event.attendees.find(a => a.userId === currentUser.id);
      if (!attendance || attendance.status !== 'confirmed') {
        return false;
      }
    } else if (filter === 'missed') {
      const attendance = event.attendees.find(a => a.userId === currentUser.id);
      if (!attendance || attendance.status !== 'declined') {
        return false;
      }
    }
    
    // Filtro de grupo
    if (groupFilter !== "all" && event.groupId !== groupFilter) {
      return false;
    }
    
    // Filtro de tempo
    if (timeFilter !== "all") {
      const eventDate = new Date(`${event.date}T${event.time}`);
      const now = new Date();
      const oneMonth = 30 * 24 * 60 * 60 * 1000;
      const threeMonths = 3 * oneMonth;
      const sixMonths = 6 * oneMonth;
      
      if (timeFilter === "month" && (now.getTime() - eventDate.getTime() > oneMonth)) {
        return false;
      } else if (timeFilter === "three_months" && (now.getTime() - eventDate.getTime() > threeMonths)) {
        return false;
      } else if (timeFilter === "six_months" && (now.getTime() - eventDate.getTime() > sixMonths)) {
        return false;
      }
    }
    
    return true;
  });

  return (
    <MobileLayout
      header={<TopNav title="Histórico de Eventos" backHref="/events" />}
      footer={<BottomNav />}
    >
      <div className="space-y-6">
        <Tabs defaultValue="all" className="w-full" onValueChange={(value) => setFilter(value as 'all' | 'attended' | 'missed')}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="attended">Participei</TabsTrigger>
            <TabsTrigger value="missed">Não participei</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar eventos..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2">
            <div className="flex-1">
              <Select value={groupFilter} onValueChange={setGroupFilter}>
                <SelectTrigger className="h-9">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Grupo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os grupos</SelectItem>
                  {userGroups.map(group => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1">
              <Select value={timeFilter} onValueChange={setTimeFilter}>
                <SelectTrigger className="h-9">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todo período</SelectItem>
                  <SelectItem value="month">Último mês</SelectItem>
                  <SelectItem value="three_months">Últimos 3 meses</SelectItem>
                  <SelectItem value="six_months">Últimos 6 meses</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">
            {filteredEvents.length} {filteredEvents.length === 1 ? 'evento' : 'eventos'} encontrados
          </h2>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" /> Exportar
          </Button>
        </div>

        <div className="space-y-4">
          {filteredEvents.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <h3 className="text-lg font-medium mb-1">Nenhum evento encontrado</h3>
                <p className="text-muted-foreground">
                  Não há eventos que correspondam aos filtros selecionados.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredEvents.map((event) => {
                const group = userGroups.find(g => g.id === event.groupId);
                const attendance = event.attendees.find(a => a.userId === currentUser.id);
                const attendanceStatus = attendance ? attendance.status : 'pending';
                
                return (
                  <div key={event.id} className="relative">
                    <EventCard
                      id={event.id}
                      title={event.title}
                      description={event.description}
                      location={event.location}
                      date={event.date}
                      time={event.time}
                      attendeeCount={event.attendees.filter(a => a.status === 'confirmed').length}
                      groupName={group?.name}
                      attendanceStatus={attendanceStatus}
                      isPast={true}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {filteredEvents.length > 0 && (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground mb-2">
              Mostrando {filteredEvents.length} de {pastEvents.length} eventos passados
            </p>
            <Button variant="outline" size="sm">
              Carregar mais
            </Button>
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
