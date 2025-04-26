"use client";

import React, { useState, useMemo } from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EventCard } from "@/components/cards/GroupEventCards";
import { Calendar, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { getPastEvents, getUserGroups } from "@/services/api";

export default function EventHistoryPage() {
  const [selectedGroupId, setSelectedGroupId] = useState<string>("all");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("all");

  const { 
    data: pastEvents = [],
    isLoading: isLoadingEvents, 
    error: eventsError 
  } = useQuery({
    queryKey: ['userPastEvents'],
    queryFn: getPastEvents
  });

  const { 
    data: userGroups = [],
    isLoading: isLoadingGroups, 
    error: groupsError 
  } = useQuery({
    queryKey: ['userGroups'],
    queryFn: getUserGroups
  });

  const filteredEvents = useMemo(() => {
    let events = pastEvents;

    if (selectedGroupId !== "all") {
      events = events.filter(event => event.groupId === selectedGroupId);
    }

    if (selectedPeriod !== "all") {
      const now = new Date();
      const periodDate = new Date();
      if (selectedPeriod === "last7") {
        periodDate.setDate(now.getDate() - 7);
      } else if (selectedPeriod === "last30") {
        periodDate.setDate(now.getDate() - 30);
      } else if (selectedPeriod === "last90") {
        periodDate.setDate(now.getDate() - 90);
      }
      periodDate.setHours(0, 0, 0, 0);
      
      events = events.filter(event => {
        const eventDateParts = event.date.split('-').map(Number);
        const eventDate = new Date(eventDateParts[0], eventDateParts[1] - 1, eventDateParts[2]);
        eventDate.setHours(0,0,0,0);
        return eventDate >= periodDate;
      });
    }
    
    return events;

  }, [pastEvents, selectedGroupId, selectedPeriod]);

  const isLoading = isLoadingEvents || isLoadingGroups;
  const error = eventsError || groupsError;

  if (error) {
    return (
      <MobileLayout
        header={<TopNav title="Histórico de Eventos" backHref="/dashboard" />}
        footer={<BottomNav />}
      >
        <div className="p-4 text-center text-destructive">
          <AlertTriangle className="mx-auto h-8 w-8 mb-2"/>
          Erro ao carregar histórico.
          {error && <p className="text-xs mt-2">{(error as Error).message}</p>}
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout
      header={<TopNav title="Histórico de Eventos" backHref="/dashboard" />}
      footer={<BottomNav />}
    >
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={selectedGroupId} onValueChange={setSelectedGroupId} disabled={isLoading}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filtrar por grupo..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os grupos</SelectItem>
              {isLoadingGroups ? (
                 <SelectItem value="loading" disabled>Carregando...</SelectItem>
              ) : (
                 userGroups.map(group => (
                   <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                 ))
              )}
                </SelectContent>
              </Select>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod} disabled={isLoading}>
             <SelectTrigger className="w-full sm:w-[180px]">
               <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
               <SelectValue placeholder="Filtrar por período..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todo período</SelectItem>
              <SelectItem value="last7">Últimos 7 dias</SelectItem>
              <SelectItem value="last30">Últimos 30 dias</SelectItem>
              <SelectItem value="last90">Últimos 90 dias</SelectItem>
                </SelectContent>
              </Select>
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">
            {filteredEvents.length} {filteredEvents.length === 1 ? 'evento' : 'eventos'} encontrados
          </h2>
        </div>

        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
               <Skeleton className="h-24 w-full rounded-xl" />
               <Skeleton className="h-24 w-full rounded-xl" />
               <Skeleton className="h-24 w-full rounded-xl" />
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-10">
                <p className="text-muted-foreground">
                Nenhum evento passado encontrado{selectedGroupId !== 'all' || selectedPeriod !== 'all' ? ' para os filtros selecionados' : ''}.
                </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredEvents.map((event) => {
                return (
                    <EventCard
                    key={event.id}
                    event={event}
                  />
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
