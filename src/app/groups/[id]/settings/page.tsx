"use client";

import React, { useState, useEffect } from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, AlertTriangle, Loader2, Camera, UploadCloud } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getGroupDetails, updateGroup, deleteGroup, uploadGroupImage } from "@/services/api";
import { toast } from "sonner";
import { Group, SportType } from "@/lib/types";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { TriangleAlert } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useImageUpload } from "@/hooks/useImageUpload";
import { triggerGroupUpdateNotification, triggerGroupDeletedNotification } from "@/app/notifications/actions";

// Definir array de valores do SportType
const sportTypeValues: SportType[] = [
  'futebol', 'basquete', 'vôlei', 'tênis', 'corrida', 'ciclismo',
  'natação', 'handebol', 'futsal', 'beach_tennis', 'outro'
];

export default function GroupSettingsPage() {
  const params = useParams();
  const groupId = params.id as string;
  const router = useRouter();
  const queryClient = useQueryClient();
  
  const { data: currentUser, isLoading: isLoadingUser } = useCurrentUser();
  
  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [sport, setSport] = useState<SportType | undefined>(undefined);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const [isSaving, setIsSaving] = useState(false);

  const { 
    data: groupDetailsData, 
    isLoading: isLoadingGroupDetails, 
    error: groupDetailsError,
  } = useQuery({
    queryKey: ['groupDetails', groupId], 
    queryFn: () => getGroupDetails(groupId),
    enabled: !!currentUser && !!groupId,
    staleTime: 5 * 60 * 1000,
  });
  
  const group = groupDetailsData?.group ?? null;
  const isAdmin = groupDetailsData?.isAdmin ?? false;
  const isLoading = isLoadingUser || isLoadingGroupDetails;

  const {
    fileInputRef, 
    triggerFileInput,
    displayImageUrl: displayImageUrlFromHook,
    isProcessing: isProcessingImage,
    selectedFile,
    renderCropModal,
    onSelectFile,
    clearSelection: clearImageSelection
  } = useImageUpload({
      initialImageUrl: group?.image,
      aspectRatio: 16/9
  });

  // Lógica para verificar mudanças
  const hasChanges = 
    groupName !== (group?.name ?? "") || 
    description !== (group?.description ?? "") ||
    sport !== (group?.sport as SportType | undefined) ||
    selectedFile !== null; 

  const updateGroupMutation = useMutation({
    mutationFn: (updates: Partial<Group>) => {
        if (!group?.id) throw new Error("ID do grupo não encontrado");
        return updateGroup(group.id, updates);
    },
    onSuccess: (data, variables) => {
      toast.success("Grupo atualizado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ['groupDetails', groupId] });
      queryClient.invalidateQueries({ queryKey: ['userGroups'] });
      clearImageSelection();

      const changedSummary: string[] = [];
      if (variables.name !== undefined && variables.name !== group?.name) changedSummary.push("nome");
      if (variables.description !== undefined && variables.description !== group?.description) changedSummary.push("descrição");
      if (variables.image !== undefined && variables.image !== group?.image) changedSummary.push("imagem");
      if (variables.sport !== undefined && variables.sport !== group?.sport) changedSummary.push("esporte");
      
      if (currentUser?.id && groupId && changedSummary.length > 0) {
        triggerGroupUpdateNotification(groupId, currentUser.id, changedSummary)
          .then(result => {
            if (result?.error) {
              console.warn("Falha ao disparar notificação de atualização de grupo:", result.error);
            } else if (result?.success) {
              console.log(`Notificação de atualização de grupo disparada para ${result.count} usuários.`);
            }
          })
          .catch(err => {
            console.error("Erro ao chamar triggerGroupUpdateNotification:", err);
          });
      }
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar grupo: ${error.message}`);
    },
    onSettled: () => {
      setIsSaving(false);
    }
  });

  const deleteGroupMutation = useMutation({
     mutationFn: async () => {
         if (!group?.id || !group.name) throw new Error("ID ou nome do grupo não encontrado para exclusão.");
         
         // Disparar notificação ANTES de deletar o grupo
         if (currentUser?.id) {
           try {
             console.log(`Attempting to trigger deletion notification for group ${group.id} by user ${currentUser.id}`);
             const notificationResult = await triggerGroupDeletedNotification(group.id, group.name, currentUser.id);
             if (notificationResult?.error) {
                console.warn("Falha ao disparar notificação de exclusão de grupo (controlado):", notificationResult.error);
             } else if (notificationResult?.success) {
                console.log(`Notificação de exclusão de grupo para ${group.name} disparada para ${notificationResult.count} usuários.`);
             }
           } catch (notificationError: unknown) {
             let errorMessage = "Erro desconhecido ao notificar";
             if (notificationError instanceof Error) {
               errorMessage = notificationError.message;
             }
             console.warn("Erro não tratado ao disparar notificação de exclusão de grupo:", errorMessage);
             // Não impedir a exclusão do grupo por falha na notificação, mas logar.
           }
         }
         return deleteGroup(group.id);
     },
     onSuccess: () => {
       toast.success("Grupo excluído com sucesso!");
       queryClient.invalidateQueries({ queryKey: ['userGroups'] });
       router.push('/groups');
     },
     onError: (error) => {
       toast.error(`Erro ao excluir grupo: ${error.message}`);
       setShowDeleteConfirm(false);
     }
   });

  useEffect(() => {
    if (group) {
      setGroupName(group.name ?? "");
      setDescription(group.description ?? "");
      setSport(group.sport as SportType | undefined);
    }
  }, [group]);

  const displayImageUrl = displayImageUrlFromHook || '/placeholder.svg';

  const handleSaveChanges = async () => {
    if (!group) return;

    setIsSaving(true);

    let imageUrl = group.image;
    const updates: Partial<Pick<Group, 'name' | 'description' | 'sport' | 'image'>> = {};
    let requiresApiUpdate = false;
    
    if (groupName !== (group?.name ?? "")) { updates.name = groupName; requiresApiUpdate = true; }
    if (description !== (group?.description ?? "")) { updates.description = description; requiresApiUpdate = true; }
    if (sport !== (group?.sport as SportType | undefined)) { updates.sport = sport; requiresApiUpdate = true; }

    if (selectedFile) {
      try {
        imageUrl = await uploadGroupImage(selectedFile, groupId);
        updates.image = imageUrl;
        requiresApiUpdate = true;
        console.log(`Nova imagem carregada para grupo ${groupId}: ${imageUrl}`);
      } catch (error) {
        toast.error(`Erro durante o upload da nova imagem: ${error instanceof Error ? error.message : String(error)}`);
        setIsSaving(false);
        return;
      } 
    } 

    if (requiresApiUpdate) {
        updateGroupMutation.mutate(updates);
    } else {
        toast.info("Nenhuma alteração detectada para salvar.");
        setIsSaving(false);
    }
  };
  
  const handleDeleteGroup = () => {
    deleteGroupMutation.mutate();
    setShowDeleteConfirm(false);
  };

  if (isLoading && !group) {
    return (
      <MobileLayout
        header={<TopNav title="Configurações" backHref={`/groups/${groupId ?? ''}`} />}
        footer={<BottomNav />}
      >
         <div className="p-4 space-y-6">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full mt-8 border-destructive" />
         </div>
      </MobileLayout>
    );
  }

  if (groupDetailsError) {
     return (
       <MobileLayout
         header={<TopNav title="Erro" backHref={`/groups/${groupId ?? ''}`} />}
         footer={<BottomNav />}
       >
          <div className="p-4 text-center text-destructive">
             <AlertTriangle className="mx-auto h-8 w-8 mb-2"/>
             Erro ao carregar dados do grupo.
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

  return (
    <MobileLayout
      header={<TopNav title="Configurações do Grupo" backHref={`/groups/${groupId}`} />}
      footer={<BottomNav />}
    >
      {group && (
        <div className="space-y-6 p-4 pb-24">
          {!isAdmin && (
             <Alert variant="default" className="m-0 mb-6 bg-amber-50 border border-amber-200 text-amber-800">
               <TriangleAlert className="h-4 w-4 !text-amber-600" />
               <AlertTitle>Acesso Restrito</AlertTitle>
               <AlertDescription>
                 Você pode visualizar as configurações, mas apenas administradores podem fazer alterações neste grupo.
               </AlertDescription>
             </Alert>
          )}
          
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="groupName">Nome do Grupo</Label>
                <Input 
                  id="groupName" 
                  value={groupName} 
                  onChange={(e) => setGroupName(e.target.value)}
                  disabled={!isAdmin || isSaving || updateGroupMutation.isPending || deleteGroupMutation.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea 
                  id="description" 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  disabled={!isAdmin || isSaving || updateGroupMutation.isPending || deleteGroupMutation.isPending}
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sport">Esporte Principal</Label>
                <Select 
                  value={sport} 
                  onValueChange={(value) => setSport(value as SportType)} 
                  disabled={!isAdmin || isSaving || updateGroupMutation.isPending || deleteGroupMutation.isPending}
                >
                  <SelectTrigger id="sport">
                    <SelectValue placeholder="Selecione o esporte" />
                  </SelectTrigger>
                  <SelectContent>
                    {sportTypeValues.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-3">
              <Label>Imagem do Grupo (Banner)</Label>
              <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-dashed border-input flex items-center justify-center bg-muted/40">
                <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={onSelectFile}
                    accept="image/jpeg, image/png, image/webp" 
                    className="hidden" 
                    disabled={!isAdmin || isSaving || isProcessingImage || deleteGroupMutation.isPending}
                  />
                
                {isProcessingImage ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
                    <Loader2 className="h-6 w-6 text-white animate-spin" />
                  </div>
                ) : displayImageUrl ? (
                   <Image 
                      key={displayImageUrl}
                      src={displayImageUrl}
                      alt={groupName || "Imagem do Grupo"} 
                      fill={true}
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                      priority={false}
                      unoptimized
                      onError={() => {
                        if (displayImageUrlFromHook && displayImageUrl === displayImageUrlFromHook) {
                           toast.error("Erro ao carregar prévia da imagem.");
                        }
                      }}
                    />
                ) : (
                  <div className="text-center text-muted-foreground p-4">
                    <UploadCloud className="mx-auto h-10 w-10 mb-2" />
                    <p className="text-sm">Nenhuma imagem selecionada</p>
                    <p className="text-xs">Clique no ícone da câmera para adicionar</p>
                  </div>
                )}
                
                {isAdmin && !isProcessingImage && (
                  <button
                    type="button"
                    onClick={triggerFileInput}
                    disabled={isSaving || deleteGroupMutation.isPending}
                    className="absolute bottom-2 right-2 bg-background/80 hover:bg-background text-foreground rounded-full p-2 transition-colors duration-200 border border-border shadow-sm z-20"
                    aria-label="Alterar imagem do grupo"
                  >
                    <Camera className="h-5 w-5" />
                  </button>
                )}

              </div>
              <p className="text-xs text-muted-foreground">
                 Opcional. Recomendado: formato paisagem (16:9).
              </p>
            </CardContent>
          </Card>

          {isAdmin && (
            <div className="flex justify-end gap-4">
                <Button 
                    onClick={handleSaveChanges} 
                    disabled={!isAdmin || isSaving || isProcessingImage || deleteGroupMutation.isPending || !hasChanges }
                  >
                    {(isSaving || isProcessingImage) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {isSaving ? (selectedFile ? 'Enviando/Salvando...' : 'Salvando...') : 'Salvar Alterações'}
                </Button>
            </div>
          )}

          {isAdmin && (
            <div>
              <h2 className="text-lg font-semibold text-destructive mb-2">Zona de Perigo</h2>
              <Card className="border-destructive bg-destructive/5 dark:bg-destructive/10">
                <CardContent className="p-4">
                  <div className="flex flex-col gap-4">
                    <div>
                      <h3 className="font-semibold text-destructive">Excluir Grupo</h3>
                      <p className="text-sm text-muted-foreground">
                        Esta ação não pode ser desfeita. Todos os dados associados a este grupo, incluindo eventos e histórico, serão permanentemente perdidos.
                      </p>
                    </div>
                    <Button 
                      variant="destructive" 
                      onClick={() => setShowDeleteConfirm(true)} 
                      className="w-full" 
                      disabled={deleteGroupMutation.isPending || isSaving}
                    >
                      {deleteGroupMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                          <Trash2 className="mr-2 h-4 w-4" />
                      )}
                      Excluir Grupo Permanentemente
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. Isso excluirá permanentemente o grupo 
                  <span className="font-semibold"> {group.name}</span>. 
                  Membros, eventos e outras informações associadas podem ser perdidos.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deleteGroupMutation.isPending}>Cancelar</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDeleteGroup} 
                  disabled={deleteGroupMutation.isPending}
                  className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                >
                  {deleteGroupMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sim, excluir grupo
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
      
      {renderCropModal()}
    </MobileLayout>
  );
}
