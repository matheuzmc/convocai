"use client";

import React, { useState, useEffect } from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { Button } from "@/components/ui/button";
import { Users, Settings, UserPlus, AlertTriangle, Loader2, MoreVertical, LogOut } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { GroupTabs, InviteDialog } from "@/components/ui-elements/DialogsAndTabs";
import { createClient } from '@/lib/supabase/client';
import { User as AuthUserType } from "@supabase/supabase-js";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getGroupDetails, createGroupInvite, leaveGroup } from "@/services/api";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal } from "lucide-react"

export default function GroupDetailsPage() {
  const params = useParams();
  const groupId = params.id as string;
  const router = useRouter();
  const queryClient = useQueryClient();
  
  const supabase = createClient();
  const [authUser, setAuthUser] = useState<AuthUserType | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [generatedInviteLink, setGeneratedInviteLink] = useState<string | null>(null);

  const [isLeaveConfirmOpen, setIsLeaveConfirmOpen] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      setLoadingAuth(true);
      const { data: { user } } = await supabase.auth.getUser();
      setAuthUser(user);
      setLoadingAuth(false);
    };
    getUser();
  }, [supabase]);

  const { 
    data: groupDetailsData, 
    isLoading: isLoadingGroupDetails, 
    error: groupDetailsError 
  } = useQuery({
    queryKey: ['groupDetails', groupId], 
    queryFn: () => getGroupDetails(groupId),
    enabled: !!authUser && !!groupId,
    staleTime: 5 * 60 * 1000,
  });
  
  const group = groupDetailsData?.group ?? null;
  const members = groupDetailsData?.members ?? [];
  const events = groupDetailsData?.events ?? [];
  const isAdmin = groupDetailsData?.isAdmin ?? false;
  const isActive = group?.is_active ?? true;

  // Calcular se o usuário atual é membro
  const isMember = authUser ? members.some(member => member.user_id === authUser.id) : false;

  // --- Calcular contagens e flags para o modal --- 
  const memberCount = group?.memberCount ?? members.length; // Usa contagem do grupo se disponível
  const adminCount = members.filter(member => member.isAdmin).length;
  const isLastMember = isMember && memberCount === 1;
  const isLastAdmin = isAdmin && adminCount === 1 && memberCount > 1; // Só relevante se houver outros membros
  // ----------------------------------------------

  const isLoading = loadingAuth || isLoadingGroupDetails;

  useEffect(() => {
      if (groupDetailsData?.members) {
          console.log("Dados dos membros recebidos pela página:", groupDetailsData.members);
      }
  }, [groupDetailsData]);

  const createInviteMutation = useMutation({
    mutationFn: () => createGroupInvite(groupId),
    onSuccess: (token) => {
      const link = `${window.location.origin}/groups/join?token=${token}`;
      setGeneratedInviteLink(link);
      setInviteDialogOpen(true);
      toast.success("Link de convite gerado!");
    },
    onError: (error) => {
      console.error("Error creating invite link:", error);
      toast.error(`Erro ao gerar convite: ${error.message}`);
    }
  });

  const handleInviteClick = () => {
    if (isAdmin) {
      setGeneratedInviteLink(null);
      createInviteMutation.mutate();
    } else {
      toast.error("Apenas administradores podem gerar convites.");
    }
  };

  const leaveGroupMutation = useMutation({
    mutationFn: () => leaveGroup(groupId),
    onSuccess: () => {
      toast.success("Você saiu do grupo.");
      queryClient.invalidateQueries({ queryKey: ['userGroups'] });
      queryClient.invalidateQueries({ queryKey: ['groupDetails', groupId] });
      queryClient.invalidateQueries({ queryKey: ['userUpcomingEvents'] });
      queryClient.invalidateQueries({ queryKey: ['userPastEvents'] });
      
      router.push('/groups'); 
    },
    onError: (error) => {
      console.error("Error leaving group:", error);
      toast.error(`Erro ao sair do grupo: ${error.message}`);
    }
  });

  const handleLeaveGroupConfirm = () => {
    leaveGroupMutation.mutate();
  };

  if (isLoading) {
    return (
      <MobileLayout
        header={<TopNav title="Carregando..." backHref="/groups" />}
        footer={<BottomNav />}
      >
        <div className="space-y-6 p-4">
           <Skeleton className="h-40 -mx-4" />
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                 <Skeleton className="h-5 w-20" />
                 <Skeleton className="h-5 w-16" />
              </div>
              <div className="flex gap-2">
                 <Skeleton className="h-9 w-9" />
                 <Skeleton className="h-9 w-9" />
              </div>
           </div>
           <Skeleton className="h-10 w-full" />
           <Skeleton className="h-60 w-full" />
        </div>
      </MobileLayout>
    );
  }
  
  if (groupDetailsError) {
     return (
      <MobileLayout
        header={<TopNav title="Erro" backHref="/groups" />}
        footer={<BottomNav />}
      >
        <div className="p-4 text-center text-destructive">
          <AlertTriangle className="mx-auto h-8 w-8 mb-2"/>
          Erro ao carregar detalhes do grupo.
        </div>
      </MobileLayout>
    );
  }
  
  if (!group) {
     return (
      <MobileLayout
        header={<TopNav title="Não Encontrado" backHref="/groups" />}
        footer={<BottomNav />}
      >
        <div className="p-4 text-center">Grupo não encontrado.</div>
      </MobileLayout>
    );
  }
  
  const baseInviteLink = typeof window !== 'undefined' ? `${window.location.origin}/groups/join` : '';

  return (
    <MobileLayout
      header={
        <TopNav 
          title={group.name}
          backHref="/groups" 
          showNotifications 
        />
      }
      footer={<BottomNav />}
    >
      <div className="space-y-4 px-4">
        <div className="h-40 -mx-4 overflow-hidden relative">
           <Image
            src={group.image || '/placeholder.svg'} 
            alt={group.name}
            className="w-full h-full object-cover"
            fill
            priority
            sizes="100vw"
            blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2U2ZTZlNiIvPjwvc3ZnPg=="
            placeholder="blur"
          />
          <div className="absolute inset-0 bg-gradient-to-t to-transparent dark:from-black/30 dark:via-black/10 dark:to-transparent"></div>
        </div>


        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center text-sm text-muted-foreground">
              <Users className="mr-1 h-4 w-4" />
              {`${memberCount} membros`}
            </div>
            <span className="text-muted-foreground">•</span>
            <div className="text-sm text-muted-foreground capitalize">
              {group.sport || 'Esporte'}
            </div>
          </div>
          
          <div className="flex gap-2 items-center">
            {isAdmin && (
              <Button 
                variant="outline" 
                size="icon" 
                asChild 
                title="Configurações do Grupo"
                disabled={!isActive}
              >
                <Link href={`/groups/${groupId}/settings`}>
                  <Settings className="h-4 w-4" />
                </Link>
              </Button>
            )}
            {isAdmin && !(!isActive) && (
              <Button 
                variant="outline" 
                size="icon" 
                onClick={handleInviteClick} 
                disabled={createInviteMutation.isPending}
                title={"Gerar link de convite"}
              >
                {createInviteMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
              </Button>
            )}

            {/* Mover AlertDialog para envolver Dropdown e Conteúdo */}
            {/* Mostrar menu APENAS se o usuário for membro */}
            {isMember && (
              <AlertDialog open={isLeaveConfirmOpen} onOpenChange={setIsLeaveConfirmOpen}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" title="Mais opções">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <AlertDialogTrigger asChild> 
                      <DropdownMenuItem 
                        className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                        onSelect={(e) => e.preventDefault()}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Sair do Grupo</span>
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                  </DropdownMenuContent>
                </DropdownMenu>

                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar Saída</AlertDialogTitle>
                    <AlertDialogDescription>
                      {`Tem certeza que deseja sair do grupo "${group?.name}"?`}
                      {isLastMember && (
                        <span className="block font-semibold text-destructive mt-2">
                          Atenção: Você é o último membro. Sair excluirá este grupo permanentemente.
                        </span>
                      )}
                      {isLastAdmin && (
                         <span className="block font-semibold text-warning mt-2">
                          Atenção: Você é o último administrador. Ao sair, o grupo será desativado e não será possível realizar novas ações (como criar eventos ou convidar), mas ele permanecerá visível para os membros restantes.
                        </span>
                      )}
                      {!isLastMember && (
                         <span className="block mt-2">Esta ação não pode ser desfeita.</span>
                      )}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setIsLeaveConfirmOpen(false)}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleLeaveGroupConfirm} 
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      disabled={leaveGroupMutation.isPending}
                    >
                      {leaveGroupMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Sair do Grupo
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

          </div>
        </div>

        {/* --- Adicionar Alerta de Grupo Inativo --- */} 
        {!isActive && (
          <Alert variant="destructive" className="mt-4">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Grupo Inativo</AlertTitle>
            <AlertDescription>
              Este grupo não possui administradores ativos. Funcionalidades como criar eventos ou convidar membros estão desativadas.
            </AlertDescription>
          </Alert>
        )}
        {/* --- Fim do Alerta --- */}

        <GroupTabs 
          events={events} 
          members={members}
          groupId={groupId}
          isAdmin={isAdmin}
          groupName={group.name}
          description={group.description ?? 'Sem informações cadastradas.'}
        />
      </div>

      <InviteDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        groupName={group.name} 
        inviteLink={generatedInviteLink ?? baseInviteLink} 
      />
    </MobileLayout>
  );
}
