"use client";

import React, { useState, useEffect } from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { EventForm, EventFormData } from "@/components/forms/GroupEventForms";
import { createClient } from '@/lib/supabase/client';
import { User as AuthUserType } from "@supabase/supabase-js";
import { Skeleton } from "@/components/ui/skeleton";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createEvent } from "@/services/api";
import { useRouter, useParams } from "next/navigation";
import { Event } from "@/lib/types";
import { toast } from "sonner";

export default function CreateEventPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const params = useParams();
  const groupId = params.id as string;
  const supabase = createClient();
  const [authUser, setAuthUser] = useState<AuthUserType | null>(null);
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

  // Setup mutation for creating an event
  const mutation = useMutation({
    mutationFn: (eventData: EventFormData) => {
        const apiPayload: Omit<Event, 'id' | 'groupId' | 'attendees' | 'createdAt'> = {
            title: eventData.title,
            description: eventData.description || null,
            location: eventData.location || null,
            date: eventData.date,
            time: eventData.time || null,
            isPeriodic: eventData.isPeriodic,
            frequency: eventData.isPeriodic ? (eventData.frequency as Event['frequency']) : null,
            notifyBefore: eventData.notifyBefore ? parseInt(eventData.notifyBefore, 10) : null,
        };
        return createEvent(groupId, apiPayload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groupDetails', groupId] });
      queryClient.invalidateQueries({ queryKey: ['userUpcomingEvents', authUser?.id] });
      queryClient.invalidateQueries({ queryKey: ['userPastEvents', authUser?.id] });
      
      toast.success(`Evento criado com sucesso!`);
      router.push(`/groups/${groupId}`);
    },
    onError: (error) => {
      console.error("Error creating event:", error);
      toast.error(`Erro ao criar evento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    },
  });

  const handleSubmit = (data: EventFormData) => {
    if (!authUser || !groupId) {
        toast.error("Erro: Usuário não autenticado ou ID do grupo inválido."); 
        return;
    }
    mutation.mutate(data);
  };

  // Show loading skeleton
  if (loadingAuth) {
     return (
       <MobileLayout
         header={<TopNav title="Criar Evento" backHref={`/groups/${groupId}`} />}
         footer={<BottomNav />}
       >
         <div className="p-4 space-y-6">
            <Skeleton className="h-10 w-3/4" /> 
            <Skeleton className="h-24 w-full" /> 
            <Skeleton className="h-16 w-full" /> 
            <Skeleton className="h-16 w-full" /> 
            <Skeleton className="h-10 w-full" /> 
         </div>
       </MobileLayout>
     );
  }

  // Check authUser after loading
  if (!authUser) {
     return (
        <MobileLayout
         header={<TopNav title="Erro" backHref={`/groups/${groupId}`} />}
         footer={<BottomNav />}
       >
         <div className="p-4 text-center">Erro: Usuário não autenticado.</div>
       </MobileLayout>
     );
  }

  return (
    <MobileLayout
      header={<TopNav title="Criar Novo Evento" backHref={`/groups/${groupId}`} />}
      footer={<BottomNav />}
    >
      <div className="p-4">
        <div className="space-y-6">
          <p className="text-muted-foreground">
            Preencha os detalhes para agendar um novo evento para o grupo.
          </p>
          <EventForm onSubmit={handleSubmit} isLoading={mutation.isPending} /> 
        </div>
      </div>
    </MobileLayout>
  );
}
