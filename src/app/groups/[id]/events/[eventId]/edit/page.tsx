"use client";

import React from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { EventForm, EventFormData } from "@/components/forms/GroupEventForms";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { getEventDetails, updateEvent, checkGroupAdminStatus } from "@/services/api";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Event } from "@/lib/types";

export default function EditEventPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  
  const groupId = params.id as string;
  const eventId = params.eventId as string;
  
  const { data: currentUser, isLoading: isLoadingUser } = useCurrentUser();

  // Buscar detalhes do evento para preencher o form
  const { 
    data: eventDetails, 
    isLoading: isLoadingEvent, 
    error: eventError 
  } = useQuery({
    queryKey: ['eventDetails', eventId], 
    queryFn: () => getEventDetails(eventId),
    enabled: !!eventId, 
  });
  const event = eventDetails?.event; // Obter o evento dos detalhes

  // Verificar se o usuário atual é admin do grupo
  const { 
    data: adminStatus, 
    isLoading: isLoadingAdmin, 
    error: adminError 
  } = useQuery({
    queryKey: ['groupMemberAdminStatus', groupId, currentUser?.id],
    queryFn: () => checkGroupAdminStatus(groupId, currentUser?.id),
    enabled: !!currentUser?.id && !!groupId,
  });
  const isAdmin = adminStatus?.isAdmin ?? false;

  // Mutação para atualizar o evento
  const updateMutation = useMutation({
    mutationFn: (formData: EventFormData) => {
      // Preparar payload para updateEvent
      const updatePayload: Partial<Omit<Event, 'id' | 'groupId' | 'attendees' | 'createdAt'>> = {
        title: formData.title,
        description: formData.description || null,
        location: formData.location || null,
        date: formData.date,
        time: formData.time || null,
        isPeriodic: formData.isPeriodic,
        frequency: (formData.frequency && ['weekly', 'monthly'].includes(formData.frequency)) 
                     ? formData.frequency as 'weekly' | 'monthly' 
                     : null,
        notifyBefore: formData.notifyBefore ? parseInt(formData.notifyBefore, 10) : null,
      };
      return updateEvent(eventId, updatePayload);
    },
    onSuccess: () => {
      toast.success("Evento atualizado com sucesso!");
      // Invalidar queries relevantes
      queryClient.invalidateQueries({ queryKey: ['eventDetails', eventId] });
      queryClient.invalidateQueries({ queryKey: ['groupDetails', groupId] });
      queryClient.invalidateQueries({ queryKey: ['userUpcomingEvents', currentUser?.id] }); 
      // Redirecionar para detalhes do evento
      router.push(`/events/${eventId}`);
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar evento: ${error.message}`);
    },
  });

  const handleSubmit = (data: EventFormData) => {
    updateMutation.mutate(data);
  };

  const isLoading = isLoadingUser || isLoadingEvent || isLoadingAdmin;
  const error = eventError || adminError;

  // --- Renderização --- 

  if (isLoading) {
    return (
      <MobileLayout
        header={<TopNav title="Editar Evento" backHref={`/events/${eventId}`} />}
        footer={<BottomNav />}
      >
         <div className="p-4 space-y-6">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-5 w-1/2" />
            <div className="pt-4 space-y-4 border-t">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-9 w-full" />
              <div className="flex gap-4">
                 <Skeleton className="h-9 w-1/2" />
                 <Skeleton className="h-9 w-1/2" />
              </div>
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-1/2" />
              <Skeleton className="h-10 w-full mt-4" />
            </div>
         </div>
      </MobileLayout>
    );
  }
  
  // Verificar erros após o loading
  if (error) {
     return (
      <MobileLayout
        header={<TopNav title="Erro" backHref={`/events/${eventId}`} />}
        footer={<BottomNav />}
      >
        <div className="p-4 text-center text-destructive">
          <AlertTriangle className="mx-auto h-8 w-8 mb-2"/>
          Erro ao carregar dados para edição.
          {error && <p className="text-xs mt-2">{(error as Error).message}</p>}
        </div>
      </MobileLayout>
    );
  }
  
  // Verificar se o evento foi encontrado
  if (!event) {
     return (
      <MobileLayout
        header={<TopNav title="Não Encontrado" backHref={`/groups/${groupId}`} />}
        footer={<BottomNav />}
      >
        <div className="p-4 text-center">Evento não encontrado.</div>
      </MobileLayout>
    );
  }

  // Verificar se é admin DEPOIS de carregar tudo
  if (!isAdmin) {
    return (
      <MobileLayout
        header={<TopNav title="Acesso Negado" backHref={`/events/${eventId}`} />}
        footer={<BottomNav />}
      >
        <div className="flex flex-col items-center justify-center h-full py-10 text-center">
           <AlertTriangle className="mx-auto h-8 w-8 mb-4 text-destructive"/>
          <h2 className="text-xl font-semibold mb-2">Acesso Restrito</h2>
          <p className="text-muted-foreground mb-6">
            Apenas administradores do grupo podem editar este evento.
          </p>
          <Button asChild>
            <Link href={`/events/${eventId}`}>Voltar para o Evento</Link>
          </Button>
        </div>
      </MobileLayout>
    );
  }

  // Preparar dados iniciais para o formulário
  const initialFormData: EventFormData = {
      title: event.title ?? '',
      description: event.description ?? '',
      date: event.date ?? '',
      time: event.time ?? '',
      location: event.location ?? '',
      isPeriodic: event.isPeriodic ?? false,
      frequency: event.frequency as ('weekly' | 'monthly' | null),
      notifyBefore: event.notifyBefore?.toString() ?? '',
  };

  return (
    <MobileLayout
      header={<TopNav title="Editar Evento" backHref={`/events/${eventId}`} />}
      footer={<BottomNav />}
    >
      <div className="p-4 space-y-6">
        <h2 className="text-xl font-semibold">Editar evento: {event.title}</h2>
        
        <p className="text-muted-foreground">
          Atualize as informações do evento abaixo.
        </p>
        
        <EventForm 
          onSubmit={handleSubmit} 
          initialData={initialFormData}
          isEdit={true}
          isLoading={updateMutation.isPending}
        />
      </div>
    </MobileLayout>
  );
} 