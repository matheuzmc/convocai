"use client";

import React, { useState, useEffect, useRef } from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, AlertTriangle, Loader2, Camera } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from '@/lib/supabase/client';
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getGroupDetails, updateGroup, deleteGroup } from "@/services/api";
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
import { ImageCropModal } from '@/components/features/ImageCropModal';
import { getStoragePathFromUrl } from '@/lib/utils';
import { GROUP_IMAGE_COMPRESSION_OPTIONS } from '@/lib/constants';

// Definir array de valores do SportType
const sportTypeValues: SportType[] = [
  'futebol', 'basquete', 'vôlei', 'tênis', 'corrida', 'ciclismo',
  'natação', 'handebol', 'futsal', 'beach_tennis', 'outro'
];

export default function GroupSettingsPage() {
  const params = useParams();
  const groupId = params.id as string;
  const supabase = createClient();
  const router = useRouter();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { data: currentUser, isLoading: isLoadingUser } = useCurrentUser();
  
  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [sport, setSport] = useState<SportType | undefined>(undefined);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showGroupCropModal, setShowGroupCropModal] = useState(false);
  const [groupImgSrc, setGroupImgSrc] = useState('');

  const { 
    data: groupDetailsData, 
    isLoading: isLoadingGroupDetails, 
    error: groupDetailsError,
    isSuccess,
  } = useQuery({
    queryKey: ['groupDetails', groupId], 
    queryFn: () => getGroupDetails(groupId),
    enabled: !!currentUser && !!groupId,
    staleTime: 5 * 60 * 1000,
  });
  
  const group = groupDetailsData?.group ?? null;
  const isAdmin = groupDetailsData?.isAdmin ?? false;
  const isLoading = isLoadingUser || isLoadingGroupDetails || (isSuccess && !groupDetailsData);

  const updateGroupMutation = useMutation({
    mutationFn: (updates: Partial<Group>) => {
        if (!group?.id) throw new Error("ID do grupo não encontrado");
        return updateGroup(group.id, updates);
    },
    onSuccess: () => {
      toast.success("Grupo atualizado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ['groupDetails', groupId] });
      setSelectedImageFile(null);
      if (imagePreviewUrl) {
          URL.revokeObjectURL(imagePreviewUrl);
          setImagePreviewUrl(null);
      }
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar grupo: ${error.message}`);
    },
    onSettled: () => {
      setIsUploadingImage(false);
    }
  });

  const deleteGroupMutation = useMutation({
     mutationFn: () => {
         if (!group?.id) throw new Error("ID do grupo não encontrado");
         return deleteGroup(group.id);
     },
     onSuccess: () => {
       toast.success("Grupo excluído com sucesso!");
       queryClient.invalidateQueries({ queryKey: ['groups'] });
       router.push('/groups');
     },
     onError: (error) => {
       toast.error(`Erro ao excluir grupo: ${error.message}`);
       setShowDeleteConfirm(false);
     }
   });

  useEffect(() => {
    if (isSuccess && group) {
      setGroupName(group.name ?? "");
      setDescription(group.description ?? "");
      setSport(group.sport as SportType | undefined);
      setSelectedImageFile(null);
      setImagePreviewUrl(prevUrl => {
        if (prevUrl) {
          URL.revokeObjectURL(prevUrl);
        }
        return null;
      });
    }
  }, [group, isSuccess]);

  useEffect(() => {
    const currentPreviewUrl = imagePreviewUrl; 
    const currentGroupSrc = groupImgSrc;
    
    return () => {
      if (currentPreviewUrl) {
        URL.revokeObjectURL(currentPreviewUrl);
        console.log("Revogando preview URL:", currentPreviewUrl.substring(0, 20) + "...");
      }
      if (currentGroupSrc) { 
        URL.revokeObjectURL(currentGroupSrc);
        console.log("Revogando group src URL:", currentGroupSrc.substring(0, 20) + "...");
      }
    };
  }, [imagePreviewUrl, groupImgSrc]);

  const onSelectGroupFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
          toast.error("Formato de imagem inválido. Use JPG, PNG ou WEBP.");
          event.target.value = "";
          return;
      }
      
      if (groupImgSrc) {
        URL.revokeObjectURL(groupImgSrc);
      }

      const newImgSrc = URL.createObjectURL(file);
      setGroupImgSrc(newImgSrc);
      setShowGroupCropModal(true);
      
      event.target.value = ""; 

    } else {
      setGroupImgSrc('');
      setShowGroupCropModal(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleGroupCropComplete = (croppedFile: File) => {
      setSelectedImageFile(croppedFile);

      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
      const newPreviewUrl = URL.createObjectURL(croppedFile);
      setImagePreviewUrl(newPreviewUrl);
      
      if (groupImgSrc) {
          URL.revokeObjectURL(groupImgSrc);
          setGroupImgSrc('');
      }
  };

  const hasChanges = 
    groupName !== (group?.name ?? "") || 
    description !== (group?.description ?? "") ||
    sport !== (group?.sport as SportType | undefined) ||
    selectedImageFile !== null; 
    
  console.log('>>> Verificando mudanças:', { // DEBUG LOG
      groupNameChanged: groupName !== (group?.name ?? ""),
      descriptionChanged: description !== (group?.description ?? ""),
      sportChanged: sport !== (group?.sport as SportType | undefined),
      imageSelected: selectedImageFile !== null,
      selectedImageFile: selectedImageFile,
      hasChanges: hasChanges
  });

  const handleSaveChanges = async () => {
    if (!group) return;

    let imageUrl = group.image;
    const updates: Partial<Group> = {};
    
    if (groupName !== (group?.name ?? "")) updates.name = groupName;
    if (description !== (group?.description ?? "")) updates.description = description;
    if (sport !== (group?.sport as SportType | undefined)) updates.sport = sport;

    if (selectedImageFile) {
      setIsUploadingImage(true);

      const fileExtension = selectedImageFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExtension}`;
      const filePath = `${groupId}/${fileName}`;
      const bucketName = 'group-images';

      try {
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from(bucketName)
            .upload(filePath, selectedImageFile, {
              cacheControl: '3600',
              upsert: false,
            });
        
        if (uploadError) throw uploadError;
        if (!uploadData) throw new Error("Upload bem-sucedido, mas sem dados retornados.");

        const { data: publicUrlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(filePath);

        if (!publicUrlData || !publicUrlData.publicUrl) {
           throw new Error('Imagem carregada, mas falha ao obter URL pública.');
        }
        imageUrl = publicUrlData.publicUrl;
        updates.image = imageUrl;

        console.log(`Nova imagem carregada: ${imageUrl}`);

        // --- Início: Lógica para excluir imagem antiga do grupo ---
        const oldImagePath = getStoragePathFromUrl(group.image, bucketName);

        if (oldImagePath && imageUrl !== group.image) {
          console.log(`Tentando excluir imagem antiga do grupo: ${oldImagePath}`);
          supabase.storage
            .from(bucketName)
            .remove([oldImagePath])
            .then(({ error: deleteError }) => {
              if (deleteError) {
                console.warn("Falha ao excluir imagem antiga do grupo:", deleteError);
              } else {
                console.log("Imagem antiga do grupo excluída com sucesso.");
              }
            });
        }
        // --- Fim: Lógica para excluir imagem antiga do grupo ---

      } catch (error) {
        toast.error(`Erro durante o upload da imagem: ${error instanceof Error ? error.message : String(error)}`);
        setIsUploadingImage(false);
        setSelectedImageFile(null);
        setImagePreviewUrl(null);
        return;
      } 
    } 

    if (Object.keys(updates).length > 0) {
        console.log("Atualizando grupo com:", updates);
        updateGroupMutation.mutate(updates);
    } else {
        toast.info("Nenhuma alteração detectada para salvar.");
        setIsUploadingImage(false);
        if (!Object.keys(updates).length && selectedImageFile) {
            setSelectedImageFile(null);
            if (imagePreviewUrl) { URL.revokeObjectURL(imagePreviewUrl); setImagePreviewUrl(null); }
        }
    }
  };
  
  const handleDeleteGroup = () => {
    deleteGroupMutation.mutate();
    setShowDeleteConfirm(false);
  };

  if (isLoading) {
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

  if (!isAdmin) {
    return (
      <MobileLayout
        header={<TopNav title="Acesso Restrito" backHref={`/groups/${groupId}`} />}
        footer={<BottomNav />}
      >
        <div className="flex flex-col items-center justify-center h-full py-10 text-center">
          <AlertTriangle className="mx-auto h-8 w-8 mb-4 text-destructive"/>
          <h2 className="text-xl font-semibold mb-2">Acesso Negado</h2>
          <p className="text-muted-foreground mb-6">
            Apenas administradores podem acessar as configurações do grupo.
          </p>
          <Button asChild>
            <Link href={`/groups/${groupId}`}>Voltar para o Grupo</Link>
          </Button>
        </div>
      </MobileLayout>
    );
  }
  
  const displayImageUrl = imagePreviewUrl || groupDetailsData?.group?.image || '/placeholder-group.jpg';

  return (
    <MobileLayout
      header={<TopNav title="Configurações do Grupo" backHref={`/groups/${groupId}`} />}
      footer={<BottomNav />}
    >
      {isLoading && (
        <div className="space-y-6 p-4">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-20 w-20 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-1/2" />
        </div>
      )}

      {!isLoading && groupDetailsError && (
        <div className="p-4 text-center text-destructive">
          <AlertTriangle className="mx-auto h-8 w-8 mb-2" />
          Erro ao carregar detalhes do grupo. Tente novamente.
          <p className="text-sm text-muted-foreground mt-1">
            {groupDetailsError ? (groupDetailsError as Error).message : 'Ocorreu um erro desconhecido'}
          </p>
        </div>
      )}

      {!isLoading && !groupDetailsError && !group && (
         <div className="p-4 text-center text-muted-foreground">Grupo não encontrado.</div>
      )}

      {!isLoading && !isAdmin && group && (
        <Alert variant="default" className="m-4 bg-amber-50 border border-amber-200 text-amber-800">
          <TriangleAlert className="h-4 w-4 !text-amber-600" />
          <AlertTitle>Acesso Restrito</AlertTitle>
          <AlertDescription>
            Você pode visualizar as configurações, mas apenas administradores podem fazer alterações neste grupo.
          </AlertDescription>
        </Alert>
      )}

      {!isLoading && group && (
        <div className="space-y-6 p-4 pb-24">
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="groupName">Nome do Grupo</Label>
                <Input 
                  id="groupName" 
                  value={groupName} 
                  onChange={(e) => setGroupName(e.target.value)}
                  disabled={!isAdmin || isLoading || updateGroupMutation.isPending || deleteGroupMutation.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea 
                  id="description" 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  disabled={!isAdmin || isLoading || updateGroupMutation.isPending || deleteGroupMutation.isPending}
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sport">Esporte Principal</Label>
                <Select 
                  value={sport} 
                  onValueChange={(value) => setSport(value as SportType)} 
                  disabled={!isAdmin || isLoading || updateGroupMutation.isPending || deleteGroupMutation.isPending}
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
              <div className="w-full max-w-md mx-auto aspect-video relative overflow-hidden border rounded-md bg-muted">
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={onSelectGroupFile}
                    accept="image/jpeg, image/png, image/webp" 
                    className="hidden" 
                    disabled={!isAdmin || isLoading || isUploadingImage || updateGroupMutation.isPending || deleteGroupMutation.isPending}
                  />
                 <Image 
                    key={displayImageUrl}
                    src={displayImageUrl}
                    alt={groupName || "Imagem do Grupo"} 
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    priority={false}
                    onError={() => {
                      if (imagePreviewUrl) {
                        URL.revokeObjectURL(imagePreviewUrl);
                        setImagePreviewUrl(null);
                      }
                    }}
                  />
                   <div 
                      className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                      onClick={triggerFileInput}
                      aria-label="Alterar imagem do grupo"
                    >
                      <Camera className="h-8 w-8 text-white" />
                    </div>
                    {(isUploadingImage || updateGroupMutation.isPending) && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                          <Loader2 className="h-6 w-6 text-white animate-spin" />
                        </div>
                    )}
              </div>
            </CardContent>
          </Card>

          {isAdmin && (
            <div className="flex justify-end gap-4">
                <Button 
                    onClick={handleSaveChanges} 
                    disabled={isLoading || isUploadingImage || updateGroupMutation.isPending || deleteGroupMutation.isPending || (!selectedImageFile && groupName === group.name && description === (group.description ?? "") && sport === (group.sport as SportType | undefined)) }
                  >
                    {(updateGroupMutation.isPending || isUploadingImage) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isUploadingImage ? 'Enviando imagem...' : (updateGroupMutation.isPending ? 'Salvando...' : 'Salvar Alterações')}
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
                      disabled={deleteGroupMutation.isPending} 
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
      
      <ImageCropModal
          isOpen={showGroupCropModal}
          onClose={() => setShowGroupCropModal(false)}
          imageSrc={groupImgSrc}
          aspectRatio={16 / 9}
          circularCrop={false}
          compressionOptions={GROUP_IMAGE_COMPRESSION_OPTIONS}
          onConfirm={handleGroupCropComplete}
       />
    </MobileLayout>
  );
}
