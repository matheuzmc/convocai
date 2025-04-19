"use client";

import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Share2 } from "lucide-react";

interface InviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupName: string;
  inviteLink: string;
}

export function InviteDialog({ open, onOpenChange, groupName, inviteLink }: InviteDialogProps) {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink);
    // Aqui seria implementada a lógica para mostrar uma notificação de sucesso
    console.log("Link copiado para a área de transferência");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Convidar para {groupName}</DialogTitle>
          <DialogDescription>
            Compartilhe o link abaixo para convidar pessoas para o seu grupo.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center space-x-2 mt-4">
          <div className="grid flex-1 gap-2">
            <Input
              value={inviteLink}
              readOnly
              className="w-full"
            />
          </div>
          <Button size="icon" onClick={copyToClipboard}>
            <Copy className="h-4 w-4" />
          </Button>
        </div>
        <div className="mt-4">
          <h4 className="text-sm font-medium mb-2">Compartilhar via</h4>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1">
              <Share2 className="h-4 w-4 mr-2" /> WhatsApp
            </Button>
            <Button variant="outline" className="flex-1">
              <Share2 className="h-4 w-4 mr-2" /> Email
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function EventDetailsTabs() {
  return (
    <Tabs defaultValue="info" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="info">Informações</TabsTrigger>
        <TabsTrigger value="participants">Participantes</TabsTrigger>
        <TabsTrigger value="comments">Comentários</TabsTrigger>
      </TabsList>
      <TabsContent value="info" className="space-y-4 mt-4">
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Descrição</h3>
          <p className="text-muted-foreground">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
          </p>
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Regras</h3>
          <p className="text-muted-foreground">
            - Chegar com 15 minutos de antecedência<br />
            - Trazer documento de identificação<br />
            - Usar uniforme adequado
          </p>
        </div>
      </TabsContent>
      <TabsContent value="participants" className="space-y-4 mt-4">
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Confirmados (12)</h3>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                {String.fromCharCode(65 + i)}
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Pendentes (5)</h3>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                {String.fromCharCode(78 + i)}
              </div>
            ))}
          </div>
        </div>
      </TabsContent>
      <TabsContent value="comments" className="space-y-4 mt-4">
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              J
            </div>
            <div className="flex-1">
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm font-medium">João Silva</p>
                <p className="text-sm">Vou chegar um pouco atrasado, me esperem!</p>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Há 2 horas</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              M
            </div>
            <div className="flex-1">
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm font-medium">Maria Oliveira</p>
                <p className="text-sm">Alguém pode me dar carona?</p>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Há 1 hora</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <Input placeholder="Escreva um comentário..." />
          <Button>Enviar</Button>
        </div>
      </TabsContent>
    </Tabs>
  );
}

export function GroupTabs() {
  return (
    <Tabs defaultValue="about" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="about">Sobre</TabsTrigger>
        <TabsTrigger value="events">Eventos</TabsTrigger>
        <TabsTrigger value="members">Membros</TabsTrigger>
      </TabsList>
      
      <TabsContent value="about" className="mt-4 space-y-4">
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Descrição</h3>
          <p className="text-muted-foreground text-sm">
            Este grupo foi criado para reunir pessoas que compartilham o interesse pelo esporte e desejam participar de atividades regulares.
          </p>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Regras</h3>
          <ul className="text-muted-foreground text-sm space-y-1 list-disc pl-5">
            <li>Respeite todos os membros</li>
            <li>Confirme presença com antecedência</li>
            <li>Chegue no horário marcado</li>
            <li>Avise se não puder comparecer</li>
          </ul>
        </div>
      </TabsContent>
      
      <TabsContent value="events" className="mt-4">
        <p className="text-center py-6 text-muted-foreground">
          Lista de eventos será exibida aqui
        </p>
      </TabsContent>
      
      <TabsContent value="members" className="mt-4">
        <p className="text-center py-6 text-muted-foreground">
          Lista de membros será exibida aqui
        </p>
      </TabsContent>
    </Tabs>
  );
}
