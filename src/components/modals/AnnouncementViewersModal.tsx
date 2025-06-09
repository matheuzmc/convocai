"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, AlertTriangle, EyeOff } from "lucide-react";
import { getAnnouncementViewers } from "@/services/announcementService";
import type { GroupAnnouncement, AnnouncementViewer } from "@/lib/types";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AnnouncementViewersModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  announcement: GroupAnnouncement | null; 
}

export function AnnouncementViewersModal({
  isOpen,
  onOpenChange,
  announcement,
}: AnnouncementViewersModalProps) {
  const announcementId = announcement?.id;

  const { 
    data: viewers, 
    isLoading, 
    error 
  } = useQuery<AnnouncementViewer[], Error>({
    queryKey: ['announcementViewers', announcementId],
    queryFn: () => getAnnouncementViewers(announcementId!),
    enabled: !!isOpen && !!announcementId, // Só busca se o modal estiver aberto e tiver um ID
    staleTime: 2 * 60 * 1000, // 2 minutos
  });

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Data inválida";
    try {
      return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return "Data inválida";
    }
  };

  const getInitials = (name: string | null | undefined): string => {
    if (!name) return "?";
    const parts = name.split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  if (!isOpen || !announcement) return null;

  const descriptionText = `Visto por membros do grupo. Aviso: "${announcement.content.substring(0, 50)}${announcement.content.length > 50 ? '...' : ''}"`;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Visualizações do Aviso</DialogTitle>
          <DialogDescription className="truncate max-w-xs sm:max-w-sm md:max-w-md">
            {descriptionText}
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] mt-4 pr-3">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-2 text-muted-foreground">Carregando visualizações...</p>
            </div>
          )}
          {error && (
            <div className="text-center text-destructive py-10">
              <AlertTriangle className="mx-auto h-8 w-8 mb-2" />
              <p>Erro ao carregar visualizações.</p>
              <p className="text-sm text-muted-foreground">{error.message}</p>
            </div>
          )}
          {!isLoading && !error && viewers && viewers.length > 0 && (
            <ul className="space-y-3">
              {viewers.map((viewer) => (
                <li key={viewer.user_id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={viewer.profile?.avatar_url || undefined} alt={viewer.profile?.name || "Usuário"} />
                    <AvatarFallback>{getInitials(viewer.profile?.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium leading-none">{viewer.profile?.name || "Usuário desconhecido"}</p>
                    <p className="text-xs text-muted-foreground">Visto em: {formatDate(viewer.read_at)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {!isLoading && !error && (!viewers || viewers.length === 0) && (
             <div className="flex flex-col items-center justify-center py-10 text-center">
              <EyeOff className="mx-auto h-10 w-10 text-muted-foreground/60 mb-3" />
              <p className="text-muted-foreground">Ninguém visualizou este aviso ainda.</p>
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="pt-4">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Fechar
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 