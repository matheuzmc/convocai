"use client";

import React, { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { createGroupAnnouncement, updateGroupAnnouncement } from "@/services/announcementService";
import type { GroupAnnouncement, GroupAnnouncementFormData } from "@/lib/types";
import { toast } from "sonner";

interface AnnouncementFormModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  groupId: string;
  currentAnnouncement?: GroupAnnouncement | null; // Para edição
}

export function AnnouncementFormModal({
  isOpen,
  onOpenChange,
  groupId,
  currentAnnouncement,
}: AnnouncementFormModalProps) {
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!currentAnnouncement;

  useEffect(() => {
    if (isOpen && currentAnnouncement) {
      setContent(currentAnnouncement.content);
      setIsPinned(currentAnnouncement.is_pinned);
      setError(null); // Limpa erros ao abrir para edição
    } else if (isOpen && !currentAnnouncement) {
      // Reset para novo formulário
      setContent("");
      setIsPinned(false);
      setError(null);
    }
  }, [isOpen, currentAnnouncement]);

  const mutation = useMutation({
    mutationFn: (formData: GroupAnnouncementFormData) => {
      if (isEditing && currentAnnouncement) {
        return updateGroupAnnouncement(currentAnnouncement.id, formData);
      } else {
        return createGroupAnnouncement(groupId, formData);
      }
    },
    onSuccess: () => {
      toast.success(isEditing ? "Aviso atualizado com sucesso!" : "Aviso criado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ['groupAnnouncements', groupId] });
      onOpenChange(false); // Fecha o modal
    },
    onError: (err: Error) => {
      console.error("Error saving announcement:", err);
      setError(err.message || "Ocorreu um erro ao salvar o aviso.");
      toast.error(`Erro: ${err.message}`);
    },
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (!content.trim()) {
      setError("O conteúdo do aviso não pode estar vazio.");
      toast.error("O conteúdo do aviso não pode estar vazio.");
      return;
    }
    mutation.mutate({ content, is_pinned: isPinned });
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Aviso" : "Criar Novo Aviso"}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Modifique as informações do aviso abaixo."
              : "Escreva o conteúdo do seu novo aviso para o grupo."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2 pb-4">
          <div className="space-y-2">
            <Label htmlFor="announcement-content">Conteúdo</Label>
            <Textarea
              id="announcement-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Digite seu aviso aqui..."
              rows={5}
              className="resize-none"
              disabled={mutation.isPending}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch 
              id="announcement-pinned"
              checked={isPinned}
              onCheckedChange={setIsPinned}
              disabled={mutation.isPending}
            />
            <Label htmlFor="announcement-pinned">Fixar este aviso no topo?</Label>
          </div>
          
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <DialogFooter className="pt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={mutation.isPending}>
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={mutation.isPending || !content.trim()}>
              {mutation.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</>
              ) : (isEditing ? "Salvar Alterações" : "Criar Aviso")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 