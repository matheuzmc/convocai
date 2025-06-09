"use client";

import React, { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getGroupAnnouncements, markAnnouncementAsRead } from "@/services/announcementService";
import type { GroupAnnouncement } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, MessageSquarePlus, Eye, Loader2, Pin, PinOff, Trash2, Edit3 } from "lucide-react";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Image from "next/image";
import { useCurrentUser } from "@/hooks/useCurrentUser";

// Props esperadas pelo componente
interface AnnouncementsTabContentProps {
  groupId: string;
  isAdmin: boolean;
  onOpenCreateAnnouncementModal: () => void;
  onOpenViewersModal: (announcement: GroupAnnouncement) => void;
  onEditAnnouncement: (announcement: GroupAnnouncement) => void;
  onDeleteAnnouncement: (announcementId: string) => void;
  onTogglePin: (announcementId: string, currentPinStatus: boolean) => void;
}

export function AnnouncementsTabContent({
  groupId,
  isAdmin,
  onOpenCreateAnnouncementModal,
  onOpenViewersModal,
  onEditAnnouncement,
  onDeleteAnnouncement,
  onTogglePin
}: AnnouncementsTabContentProps) {
  const queryClient = useQueryClient();
  const { data: currentUser, isLoading: isLoadingUser, error: userError } = useCurrentUser();

  const isLoadingAuth = isLoadingUser;
  const authError = userError;

  const { 
    data: announcements, 
    isLoading: isLoadingAnnouncements, 
    error: announcementsError 
  } = useQuery<GroupAnnouncement[], Error>({
    queryKey: ['groupAnnouncements', groupId],
    queryFn: () => getGroupAnnouncements(groupId),
    enabled: !!groupId && !!currentUser && !authError,
    staleTime: 1 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (announcementId: string) => markAnnouncementAsRead(announcementId),
    onSuccess: (_, announcementId) => {
      console.log(`Announcement ${announcementId} marked as read in backend.`);
      queryClient.invalidateQueries({ queryKey: ['groupAnnouncements', groupId] });
    },
    onError: (error, announcementId) => {
      console.error(`Error marking announcement ${announcementId} as read:`, error);
    }
  });

  useEffect(() => {
    if (announcements && currentUser) {
      console.log("[AnnouncementsTab DEBUG] useEffect - Loaded announcements:", JSON.stringify(announcements, null, 2));
      announcements.forEach(announcement => {
        console.log(`[AnnouncementsTab DEBUG] Checking Ann. ID: ${announcement.id}, Pin: ${announcement.is_pinned}, currentUserHasRead from data: ${announcement.currentUserHasRead}`);
        if (announcement.currentUserHasRead === false) {
          console.log(`[AnnouncementsTab DEBUG] Attempting to mark Ann. ID: ${announcement.id} as read.`);
          markAsReadMutation.mutate(announcement.id);
        }
      });
    }
  }, [announcements, currentUser, markAsReadMutation]);

  if (isLoadingAuth || (isLoadingAnnouncements && !!currentUser && !authError)) {
    return (
      <div className="flex flex-col items-center justify-center h-40">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-2 text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (authError || announcementsError) {
    return (
      <div className="text-center text-destructive py-4">
        <AlertTriangle className="mx-auto h-8 w-8 mb-2" />
        <p>Erro ao carregar dados.</p>
        {authError && <p className="text-sm text-muted-foreground">Erro ao buscar usuário: {authError.message}</p>}
        {announcementsError && <p className="text-sm text-muted-foreground">Erro ao buscar avisos: {announcementsError.message}</p>}
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="text-center text-muted-foreground py-4">
        <AlertTriangle className="mx-auto h-8 w-8 mb-2" />
        <p>Usuário não autenticado ou não encontrado.</p>
      </div>
    );
  }

  if (!announcements || announcements.length === 0) {
    return (
      <div className="text-center py-10">
        <MessageSquarePlus className="mx-auto h-12 w-12 text-muted-foreground/50" />
        <p className="mt-4 text-lg font-medium text-muted-foreground">Nenhum aviso por aqui ainda.</p>
        {isAdmin && (
          <Button onClick={onOpenCreateAnnouncementModal} className="mt-4">
            <MessageSquarePlus className="mr-2 h-4 w-4" /> Criar Primeiro Aviso
          </Button>
        )}
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return "Data inválida";
    }
  };

  const formatRelativeDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
      
      if (diffInSeconds < 60) return `há ${diffInSeconds} seg`;
      const diffInMinutes = Math.floor(diffInSeconds / 60);
      if (diffInMinutes < 60) return `há ${diffInMinutes} min`;
      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) return `há ${diffInHours}h`;
      return format(date, "dd/MM/yy", { locale: ptBR });
    } catch {
      return "";
    }
  };

  return (
    <div className="space-y-4 py-4">
      {isAdmin && (
        <div className="flex justify-end mb-4">
          <Button onClick={onOpenCreateAnnouncementModal}>
            <MessageSquarePlus className="mr-2 h-4 w-4" /> Novo Aviso
          </Button>
        </div>
      )}
      {announcements.map((announcement) => (
        <Card key={announcement.id} className={`relative ${announcement.is_pinned ? 'border-primary border-2' : ''}`}>
          {announcement.is_pinned && (
            <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-2 py-0.5 rounded-full text-xs flex items-center">
              <Pin className="h-3 w-3 mr-1" /> FIXADO
            </div>
          )}
          <CardHeader className="pb-2 pt-4 pr-10">
            <div className="flex items-start space-x-3">
              <Image 
                src={announcement.created_by_profile?.avatar_url || '/avatar-placeholder.svg'}
                alt={announcement.created_by_profile?.name || 'Admin'}
                width={40}
                height={40}
                className="rounded-full bg-muted"
              />
              <div>
                <CardTitle className="text-base font-semibold">
                  {announcement.created_by_profile?.name || 'Administrador'}
                </CardTitle>
                <p className="text-xs text-muted-foreground" title={formatDate(announcement.created_at)}>
                  {formatRelativeDate(announcement.created_at)}
                  {announcement.updated_at !== announcement.created_at && 
                    <span title={`Editado em ${formatDate(announcement.updated_at)}`}> (editado)</span>
                  }
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pb-3">
            <p className="text-sm whitespace-pre-wrap break-words">
              {announcement.content}
            </p>
          </CardContent>
          {isAdmin && (
            <CardFooter className="flex justify-between items-center pt-2 pb-3 px-4 border-t">
              <Button variant="link" size="sm" className="p-0 h-auto text-xs text-muted-foreground" onClick={() => onOpenViewersModal(announcement)}>
                <Eye className="mr-1 h-3 w-3" /> Ver quem visualizou (0)
              </Button>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" title={announcement.is_pinned ? "Desafixar" : "Fixar"} onClick={() => onTogglePin(announcement.id, announcement.is_pinned)} className="h-7 w-7">
                  {announcement.is_pinned ? <PinOff className="h-4 w-4"/> : <Pin className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="icon" title="Editar" onClick={() => onEditAnnouncement(announcement)} className="h-7 w-7">
                  <Edit3 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" title="Excluir" onClick={() => onDeleteAnnouncement(announcement.id)} className="h-7 w-7 text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardFooter>
          )}
        </Card>
      ))}
    </div>
  );
} 