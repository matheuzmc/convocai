"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { PhoneCall, ShieldCheck, UserCog, UserX, Loader2, Info } from "lucide-react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUserProfile, checkGroupAdminStatus, updateGroupMemberRole, removeGroupMember, getGroupMembershipDetails, getMemberAttendanceStats } from "@/services/api";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { toast } from "sonner";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MemberDetailsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  groupId: string; // Mantido para futuras ações de admin/grupo
}

export function MemberDetails({ 
  open, 
  onOpenChange, 
  userId, 
  groupId, // Prop `groupId` não usada atualmente, mas mantida para futura implementação de ações de admin.
}: MemberDetailsProps) {
  const queryClient = useQueryClient();
  const { data: currentUser } = useCurrentUser();
  
  const { 
    data: userProfile, 
    isLoading: isLoadingProfile, 
    error: profileError 
  } = useQuery({
    queryKey: ['userProfile', userId], 
    queryFn: () => getUserProfile(userId), 
    enabled: open && !!userId, 
    staleTime: 5 * 60 * 1000,
  });

  const { data: currentUserStatus, isLoading: isLoadingAdminStatus } = useQuery({
    queryKey: ['groupMemberAdminStatus', groupId, currentUser?.id], 
    queryFn: () => checkGroupAdminStatus(groupId, currentUser?.id), 
    enabled: open && !!currentUser?.id && !!groupId,
    staleTime: 5 * 60 * 1000,
  });
  const isCurrentUserAdmin = currentUserStatus?.isAdmin ?? false;

  const { data: displayedUserStatus, isLoading: isLoadingDisplayedAdminStatus } = useQuery({
      queryKey: ['groupMemberAdminStatus', groupId, userId], 
      queryFn: () => checkGroupAdminStatus(groupId, userId), 
      enabled: open && !!userId && !!groupId,
      staleTime: 5 * 60 * 1000, 
  });
  const isDisplayedUserAdmin = displayedUserStatus?.isAdmin ?? false;

  const { 
    data: membershipDetails, 
    isLoading: isLoadingMembership, 
    error: membershipError 
  } = useQuery({
    queryKey: ['groupMembershipDetails', groupId, userId], 
    queryFn: () => getGroupMembershipDetails(groupId, userId), 
    enabled: open && !!userId && !!groupId, 
    staleTime: 15 * 60 * 1000, // Pode ter um staleTime maior
  });

  const { 
    data: attendanceStats, 
    isLoading: isLoadingStats, 
    error: statsError 
  } = useQuery({
    queryKey: ['memberAttendanceStats', groupId, userId], 
    queryFn: () => getMemberAttendanceStats(groupId, userId), 
    enabled: open && !!userId && !!groupId, 
    staleTime: 10 * 60 * 1000, 
  });

  const updateRoleMutation = useMutation({
    mutationFn: (newAdminStatus: boolean) => updateGroupMemberRole(groupId, userId, newAdminStatus),
    onSuccess: (_, newAdminStatus) => {
      toast.success(`Membro ${newAdminStatus ? 'promovido a' : 'rebaixado de'} administrador!`);
      queryClient.invalidateQueries({ queryKey: ['groupDetails', groupId] });
      queryClient.invalidateQueries({ queryKey: ['groupMemberAdminStatus', groupId, userId] });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar papel: ${error.message}`);
    }
  });

  const removeMemberMutation = useMutation({
    mutationFn: () => removeGroupMember(groupId, userId),
    onSuccess: () => {
      toast.success("Membro removido do grupo!");
      queryClient.invalidateQueries({ queryKey: ['groupDetails', groupId] });
      queryClient.invalidateQueries({ queryKey: ['userProfile', userId] });
      queryClient.invalidateQueries({ queryKey: ['groupMembershipDetails', groupId, userId] }); // Invalidate here
      queryClient.invalidateQueries({ queryKey: ['memberAttendanceStats', groupId, userId] }); // Invalidate stats too
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast.error(`Erro ao remover membro: ${error.message}`);
    }
  });

  const handlePromote = () => {
    updateRoleMutation.mutate(true);
  };
  
  const handleDemote = () => {
     updateRoleMutation.mutate(false);
  };
  
  const handleRemove = () => {
    removeMemberMutation.mutate();
  };
  
  const isLoading = isLoadingProfile || isLoadingAdminStatus || isLoadingDisplayedAdminStatus || isLoadingMembership || isLoadingStats;

  if (profileError || membershipError || statsError) {
    const errorMsg = profileError ? "Erro ao carregar perfil." 
                   : membershipError ? "Erro ao carregar detalhes da membresia."
                   : "Erro ao carregar estatísticas de presença.";
    return (
      <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
        <DrawerContent className="h-[85vh] flex items-center justify-center">
           <p className="text-destructive">{errorMsg}</p>
           <DrawerFooter className="pt-2 w-full max-w-md">
             <DrawerClose asChild>
               <Button variant="outline">Fechar</Button>
             </DrawerClose>
           </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  const fullName = `${userProfile?.name || ''} ${userProfile?.last_name || ''}`.trim();
  const nickname = userProfile?.nickname;
  
  const primaryDisplayName = nickname || fullName || (isLoading ? 'Carregando...' : 'Membro');
  const secondaryDisplayName = nickname && fullName ? fullName : null;

  const avatarUrl = userProfile?.avatar_url;
  const fallbackInitials = primaryDisplayName ? primaryDisplayName.split(" ").map((n) => n[0]).join("").toUpperCase() : 'M';
  const userIsAdminInGroup = isDisplayedUserAdmin;
  const phoneNumber = userProfile?.phone_number;
  const attendanceRate = attendanceStats?.attendanceRate ?? 0;
  const eventsConsidered = attendanceStats?.eventsConsidered ?? 0;

  let formattedMemberSince = "Não disponível";
  if (membershipDetails?.joined_at) {
      try {
          formattedMemberSince = format(new Date(membershipDetails.joined_at), 'dd/MM/yyyy', { locale: ptBR });
      } catch (e) {
          console.error("Erro ao formatar data de entrada:", e);
          formattedMemberSince = "Data inválida";
      }
  }
  
  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <DrawerContent className="h-[85vh] overflow-y-auto">
        <div className="mx-auto w-full max-w-md h-full flex flex-col overflow-hidden">
          <div className="sr-only">
            <DrawerTitle>Perfil do Membro</DrawerTitle>
          </div>
          <div className="flex flex-col items-center p-4 pb-6 text-center">
            {isLoading ? (
              <Skeleton className="h-20 w-20 rounded-full mb-3" />
            ) : (
              <Avatar className="h-20 w-20 mb-3">
                {avatarUrl ? (
                  <AvatarImage src={avatarUrl} alt={primaryDisplayName} />
                ) : (
                  <AvatarFallback className="text-2xl">{fallbackInitials}</AvatarFallback>
                )}
              </Avatar>
            )}
            {isLoading ? (
              <Skeleton className="h-6 w-40 mb-1" />
            ) : (
              <h2 className="text-xl font-semibold">{primaryDisplayName}</h2>
            )}
            {!isLoading && secondaryDisplayName && (
              <p className="text-sm text-muted-foreground">{secondaryDisplayName}</p>
            )}
            {!isLoading && userIsAdminInGroup && (
              <Badge variant="secondary" className="mt-2">
                <ShieldCheck className="h-3.5 w-3.5 mr-1" /> Admin
              </Badge>
            )}
          </div>
          <div className="px-4 space-y-5">
            {!isLoadingProfile && phoneNumber && ( 
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-3 gap-2"
                onClick={() => {
                   // Limpar número 
                   let cleanedNumber = phoneNumber.replace(/\D/g, ''); 
                   
                   // Adicionar prefixo 55 se não existir
                   if (cleanedNumber && !cleanedNumber.startsWith('55')) {
                       cleanedNumber = '55' + cleanedNumber;
                   }

                   // Validar se ainda temos um número válido após limpeza e prefixo
                   if (cleanedNumber) { 
                       // Idealmente, adicionar mais validações (tamanho mínimo/máximo)
                       window.open(`https://wa.me/${cleanedNumber}`, '_blank', 'noopener,noreferrer');
                   } else {
                       toast.error("Número de telefone inválido.");
                   }
                 }} 
              >
                <PhoneCall className="h-4 w-4" /> WhatsApp
              </Button>
            )}
            <Separator className="my-4" />
            {isLoading ? (
               <div className="space-y-4 pb-4">
                 <Skeleton className="h-4 w-32 mb-1" /> 
                 <Skeleton className="h-5 w-24" /> 
                 
                 <Skeleton className="h-4 w-36 mb-2 mt-4" />
                 <Skeleton className="h-8 w-full" /> 
                 
                 <Skeleton className="h-4 w-40 mb-2 mt-4" />
                 <Skeleton className="h-5 w-32" />
                 <Skeleton className="h-2 w-full mt-2" />
                 <Skeleton className="h-4 w-48 mt-2" />
                 
                 <Skeleton className="h-4 w-44 mb-2 mt-4" />
                 <Skeleton className="h-5 w-full" />
               </div>
            ) : (
            <div className="space-y-4 pb-4">
              <div>
                   <h3 className="text-sm font-medium text-muted-foreground mb-1">Data de entrada no grupo</h3>
                   <p className="font-medium">{formattedMemberSince}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Preferências esportivas</h3>
                <div className="flex flex-wrap gap-2">
                     {userProfile?.sport_preferences && userProfile.sport_preferences.length > 0 ? (
                        userProfile.sport_preferences.map((pref, i) => ( 
                      <Badge key={i} variant="outline" className="capitalize">
                        {pref.sport} - {pref.position}
                      </Badge>
                     ))
                   ) : (
                      <p className="text-sm text-muted-foreground">Nenhuma preferência informada.</p>
                   )}
                </div>
              </div>
              
              <div>
                   <div className="flex items-center gap-1 mb-2">
                     <h3 className="text-sm font-medium text-muted-foreground">Participação em eventos</h3>
                     <Popover>
                       <PopoverTrigger asChild>
                         <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" role="button" aria-label="Informações sobre taxa de presença"/>
                       </PopoverTrigger>
                       <PopoverContent side="top" className="w-64 p-2"> 
                         <p className="text-xs">
                           Calculada com base nos eventos passados do grupo desde a data de entrada do membro. 
                           Considera apenas presenças confirmadas pelo membro.
                         </p>
                       </PopoverContent>
                     </Popover>
                   </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span>Taxa de presença</span>
                    <span className="font-medium">{attendanceRate}%</span>
                  </div>
                  <Progress value={attendanceRate} className="h-2" />
                     <p className="text-xs text-muted-foreground mt-1">
                       {eventsConsidered > 0 
                         ? `Baseado em ${eventsConsidered} evento${eventsConsidered !== 1 ? 's' : ''} desde a entrada no grupo.`
                         : 'Nenhum evento passado relevante encontrado desde a entrada no grupo.'}
                     </p>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Conquistas e distintivos</h3>
                <div className="flex flex-wrap gap-2.5">
                     <p className="text-sm text-muted-foreground">Nenhuma conquista ainda.</p>
                </div>
              </div>
            </div>
             )}
          </div>
          
          {isCurrentUserAdmin && currentUser?.id !== userId && !isLoading && (
            <>
              <Separator className="mt-auto mb-3" /> 
              <DrawerFooter className="pt-2 w-full max-w-md flex-col sm:flex-col">
                <div className="flex w-full gap-2 mb-2">
                    {!isDisplayedUserAdmin ? (
                        <Button 
                          onClick={handlePromote} 
                          disabled={updateRoleMutation.isPending} 
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          {updateRoleMutation.isPending && updateRoleMutation.variables === true ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <UserCog className="mr-2 h-4 w-4" />} 
                          Promover Admin
                        </Button>
                    ) : (
                         <Button 
                           onClick={handleDemote} 
                           disabled={updateRoleMutation.isPending} 
                           variant="secondary" 
                           className="flex-1"
                         >
                           {updateRoleMutation.isPending && updateRoleMutation.variables === false ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <UserCog className="mr-2 h-4 w-4" />} 
                           Rebaixar Admin
                         </Button>
                    )}
                    <Button 
                      onClick={handleRemove} 
                      disabled={removeMemberMutation.isPending} 
                      variant="destructive" 
                      className="flex-1"
                    >
                      {removeMemberMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <UserX className="mr-2 h-4 w-4" />} 
                      Remover Membro
                  </Button>
                </div>
              </DrawerFooter>
            </>
          )}

          {(!isCurrentUserAdmin || currentUser?.id === userId) && !isLoading && (
             <DrawerFooter className="pt-2 w-full max-w-md mt-auto">
          </DrawerFooter>
           )}

        </div>
      </DrawerContent>
    </Drawer>
  );
} 