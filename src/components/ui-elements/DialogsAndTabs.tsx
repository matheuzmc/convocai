"use client";

import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Share2 } from "lucide-react";
import Link from "next/link";
import { EventCard } from "@/components/cards/GroupEventCards";
import { MemberCard } from "@/components/cards/NotificationMemberCards";
import { Event as EventType } from "@/lib/types";
import { GroupMemberWithProfile } from "@/lib/types";
import { toast } from "sonner";

// Placeholder function (replace with actual data fetching if needed)
/* // Removed unused placeholder function
const getGroupById = (groupId: string): Group | null => {
  // TODO: Replace with actual API call to get group by ID
  console.warn(`Placeholder function getGroupById called for group ${groupId}`);
  return null; 
};
*/

// Interfaces para tipagem
/* // Removed unused interface
interface Attendee {
  userId: string;
  status: 'confirmed' | 'pending' | 'declined';
}
*/

interface InviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupName: string;
  inviteLink: string;
}

export function InviteDialog({ open, onOpenChange, groupName, inviteLink }: InviteDialogProps) {
  const copyToClipboard = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) { 
        await navigator.clipboard.writeText(inviteLink);
        console.log("Link copiado (API Clipboard)");
        toast.success("Link copiado para a área de transferência!");
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = inviteLink;
        
        textArea.style.position = "absolute";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        textArea.style.opacity = "0";
        
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        let success = false;
        try {
          success = document.execCommand('copy');
          console.log("Link copiado (execCommand fallback):");
        } catch (err) {
          console.error("Erro ao copiar com execCommand:", err);
          success = false;
        }
        
        document.body.removeChild(textArea);
        
        if (success) {
          toast.success("Link copiado para a área de transferência!");
        } else {
          throw new Error("Não foi possível copiar o link.");
        }
      }
    } catch (error) {
      console.error("Falha ao copiar o link:", error);
      toast.error(`Erro ao copiar: ${error instanceof Error ? error.message : "Tente manualmente."}`);
    }
  };

  // Função para compartilhar via WhatsApp
  const handleShareWhatsApp = () => {
    // Monta a mensagem com o nome do grupo e o link
    const messageText = `Olá! Use este link para entrar no meu grupo '${groupName}' no Convocai: ${inviteLink}`;
    // Codifica a mensagem para URL
    const encodedText = encodeURIComponent(messageText);
    // Cria a URL do WhatsApp
    const whatsappUrl = `https://wa.me/?text=${encodedText}`;

    try {
      // Abre a URL (funciona em desktop e mobile)
      window.open(whatsappUrl, '_blank')?.focus(); // Adiciona focus() para tentar trazer a janela/aba para frente
      console.log("Tentativa de compartilhar via WhatsApp URL:", whatsappUrl);
    } catch (error) {
      console.error("Erro ao tentar abrir link do WhatsApp:", error);
      toast.error("Não foi possível abrir o WhatsApp. Verifique se está instalado.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="pt-5">
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
              aria-label="Link de convite do grupo"
            />
          </div>
          <Button size="icon" onClick={copyToClipboard}>
            <Copy className="h-4 w-4" />
          </Button>
        </div>
        <div className="mt-4">
          <h4 className="text-sm font-medium mb-2">Compartilhar via</h4>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex-1" 
              onClick={handleShareWhatsApp}
            >
              <Share2 className="h-4 w-4 mr-2" /> WhatsApp
            </Button>
            <Button variant="outline" className="flex-1" disabled>
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

export function GroupTabs({ 
  events = [], 
  members = [], 
  groupId = "", 
  isAdmin = false,
  groupName = "Grupo",
  description = "Descrição não fornecida"
}: { 
  events?: EventType[],
  members?: GroupMemberWithProfile[],
  groupId?: string,
  isAdmin?: boolean,
  groupName?: string,
  description?: string
}) {
  const [historyDialogOpen, setHistoryDialogOpen] = React.useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = React.useState(false);
  
  // TODO: Fetch group details if needed, e.g., for invite link generation
  // const group = getGroupById(groupId);
  const inviteLink = groupId ? `${window.location.origin}/groups/${groupId}/join` : "#"; // Placeholder invite link

  // Filtrar eventos por data (comparando apenas a data, ignorando hora/fuso)
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Zera a hora para comparar apenas a data

  const upcomingEvents = events
    .filter(event => {
      // Assume event.date está no formato YYYY-MM-DD
      // Cria a data do evento no início do dia para evitar problemas de fuso/hora
      const eventDateParts = event.date.split('-').map(Number);
      // new Date(year, monthIndex, day) - monthIndex é 0-based
      const eventDate = new Date(eventDateParts[0], eventDateParts[1] - 1, eventDateParts[2]);
      eventDate.setHours(0, 0, 0, 0); 
      return eventDate >= today;
    })
    .sort((a, b) => {
      // Ordenar primeiro por data, depois por hora
      const dateA = new Date(`${a.date}T${a.time}`);
      const dateB = new Date(`${b.date}T${b.time}`);
      if (a.date !== b.date) {
         return dateA.getTime() - dateB.getTime(); // Compara a data completa se diferentes
      }
      // Se a data for a mesma, ordena pela hora (opcional, mas pode ser útil)
      return dateA.getTime() - dateB.getTime(); // A comparação original já fazia isso
    });
    
  const pastEvents = events
    .filter(event => {
      const eventDateParts = event.date.split('-').map(Number);
      const eventDate = new Date(eventDateParts[0], eventDateParts[1] - 1, eventDateParts[2]);
      eventDate.setHours(0, 0, 0, 0);
      return eventDate < today;
    })
    .sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`);
      const dateB = new Date(`${b.date}T${b.time}`);
      return dateB.getTime() - dateA.getTime(); // Mais recentes primeiro (ordenação ok)
    });

  return (
    <>
      <Tabs defaultValue="events" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="events">Eventos</TabsTrigger>
          <TabsTrigger value="about">Sobre</TabsTrigger>
          <TabsTrigger value="members">Membros</TabsTrigger>
        </TabsList>
        
        <TabsContent value="about" className="mt-4 space-y-4">
          <div className="space-y-2 w-full">
            <p className="text-muted-foreground text-sm whitespace-pre-wrap break-words w-full">
              {description}
            </p>
          </div>
        </TabsContent>
        
        <TabsContent value="events" className="mt-4 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-medium">Próximos Eventos</h3>
              {pastEvents.length > 0 && (
                <button 
                  type="button"
                  className="text-xs text-primary hover:underline bg-transparent border-none p-0 h-auto mt-1 inline-block cursor-pointer"
                  onClick={() => setHistoryDialogOpen(true)}
                  title="Ver histórico de eventos"
                >
                  Ver histórico de eventos
                </button>
              )}
            </div>
            
            {isAdmin && groupId && (
              <Button size="sm" asChild className="mt-1">
                <Link href={`/groups/${groupId}/events/create`}>
                  Criar Novo Evento
                </Link>
              </Button>
            )}
          </div>

          {upcomingEvents.length === 0 ? (
            <p className="text-center py-6 text-muted-foreground">
              Nenhum evento agendado para este grupo.
            </p>
          ) : (
            <div className="grid gap-4 mt-2">
              {upcomingEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="members" className="mt-4 space-y-4">
          <div className="grid gap-2">
            {members.length === 0 ? (
              <p className="text-center py-6 text-muted-foreground">
                Nenhum membro encontrado neste grupo.
              </p>
            ) : (
              <>
                <div className="pb-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Administradores</h3>
                </div>
                
                {members
                  .filter(member => member.isAdmin)
                  .map((member) => (
                    <MemberCard
                      key={member.id}
                      id={member.id}
                      name={`${member.name || ''} ${member.last_name || ''}`.trim()}
                      nickname={member.nickname}
                      avatar={member.avatar || ''}
                      groupId={groupId}
                    />
                  ))}
                
                <div className="pt-4 pb-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Membros</h3>
                </div>
                
                {members
                  .filter(member => !member.isAdmin)
                  .map((member) => (
                    <MemberCard
                      key={member.id}
                      id={member.id}
                      name={`${member.name || ''} ${member.last_name || ''}`.trim()}
                      nickname={member.nickname}
                      avatar={member.avatar || ''}
                      groupId={groupId}
                    />
                  ))}
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
          <DialogHeader className="pt-5">
            <DialogTitle>Histórico de Eventos</DialogTitle>
            <DialogDescription>
              Eventos anteriores realizados por este grupo
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-2">
            {pastEvents.length === 0 ? (
              <p className="text-center py-4 text-muted-foreground">
                Nenhum evento passado para este grupo.
              </p>
            ) : (
              <div className="grid gap-4">
                {pastEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                  />
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {groupId && (
        <InviteDialog
          open={inviteDialogOpen}
          onOpenChange={setInviteDialogOpen}
          groupName={groupName}
          inviteLink={inviteLink}
        />
      )}
    </>
  );
}
