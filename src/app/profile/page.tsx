"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, Plus, Save, Trash2, X, Loader2, Camera, Phone } from "lucide-react";
import Link from "next/link";
import { SportType } from "@/lib/types";
import { User as AuthUserType } from "@supabase/supabase-js";
import { createClient } from '@/lib/supabase/client';
import { Skeleton } from "@/components/ui/skeleton";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { updateUserProfile, getUserProfile, UserProfileData } from "@/services/api";
import { toast } from "sonner";
import { ImageCropModal } from '@/components/features/ImageCropModal';
import { getStoragePathFromUrl } from '@/lib/utils';
import { AVATAR_COMPRESSION_OPTIONS } from '@/lib/constants';

// Definir SportPref fora ou no topo do componente para reutilização
type SportPref = { sport: SportType; position: string };

// Array com os valores do tipo SportType para iteração
// ATENÇÃO: Manter este array sincronizado com o tipo SportType em @/lib/types
const sportTypeValues: SportType[] = [
  'futebol', 
  'basquete', 
  'vôlei', 
  'tênis', 
  'corrida', 
  'ciclismo', 
  'natação', 
  'handebol', 
  'futsal', 
  'beach_tennis', 
  'outro'
];

export default function ProfilePage() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  
  const [authUser, setAuthUser] = useState<AuthUserType | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [nickname, setNickname] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [sportPreferences, setSportPreferences] = useState<SportPref[]>([]);
  const [newSport, setNewSport] = useState<SportType | ''>( '');
  const [newPosition, setNewPosition] = useState('');
  const [editMode, setEditMode] = useState(false);

  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);

  const [imgSrc, setImgSrc] = useState('');
  const [showCropModal, setShowCropModal] = useState(false);

  useEffect(() => {
    const fetchAuthUser = async () => {
      setLoadingAuth(true);
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.error("Error fetching auth user:", error);
        toast.error("Erro ao verificar sessão.");
      }
      setAuthUser(user);
      setLoadingAuth(false);
    };
    fetchAuthUser();
  }, [supabase]);

  const profileQuery = useQuery({
    queryKey: ['userProfile', authUser?.id],
    queryFn: () => {
      if (!authUser?.id) throw new Error("User ID not available");
      return getUserProfile(authUser.id);
    },
    enabled: !!authUser?.id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  useEffect(() => {
    if (profileQuery.isSuccess && profileQuery.data) {
      const data = profileQuery.data;
      setName(data.name ?? "");
      setLastName(data.last_name ?? "");
      setNickname(data.nickname ?? "");
      setPhoneNumber(data.phone_number ?? "");
      setSportPreferences((data.sport_preferences as SportPref[]) ?? []);
    } else if (profileQuery.isError) {
      console.error("Failed to fetch user profile after initial load:", profileQuery.error);
      setName("");
      setLastName("");
      setNickname("");
      setPhoneNumber("");
      setSportPreferences([]);
    }
  }, [profileQuery.data, profileQuery.isSuccess, profileQuery.isError, profileQuery.error]);

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }
    };
  }, [avatarPreviewUrl]);

  const mutation = useMutation({
    mutationFn: async (updates: Parameters<typeof updateUserProfile>[0]) => {
       if (!authUser) throw new Error("Usuário não autenticado.");
       return updateUserProfile(updates);
    },
  });

  const handleAddSport = () => {
    if (newSport && newPosition) {
      if (sportPreferences.length >= 3) {
        toast.error("Você pode adicionar no máximo 3 esportes.");
        return;
      }
      if (sportPreferences.some(pref => pref.sport === newSport)) {
        toast.error("Este esporte já foi adicionado.");
        return;
      }
      setSportPreferences([...sportPreferences, { sport: newSport, position: newPosition }]);
      setNewSport('');
      setNewPosition('');
      setEditMode(false);
    } else {
       toast.warning("Selecione o esporte e digite a posição.");
    }
  };

  const handleRemoveSport = (sportToRemove: SportType) => {
    setSportPreferences(sportPreferences.filter(pref => pref.sport !== sportToRemove));
  };

  const handleCropComplete = (croppedFile: File) => {
    if (avatarPreviewUrl) {
      URL.revokeObjectURL(avatarPreviewUrl);
    }
    setSelectedAvatarFile(croppedFile);
    const newPreviewUrl = URL.createObjectURL(croppedFile);
    setAvatarPreviewUrl(newPreviewUrl);

    if (imgSrc) {
        URL.revokeObjectURL(imgSrc);
        setImgSrc('');
    }
    setShowCropModal(false);
  };

  const handleSaveChanges = async () => {
    const currentProfileData = profileQuery.data;
    if (!authUser || !currentProfileData) {
      toast.error("Erro: Dados do usuário não estão carregados ou são inválidos.");
      return;
    }

    const profileUpdates: Partial<UserProfileData & { avatar_url: string | null }> = {};

    if (name !== (currentProfileData.name ?? "")) profileUpdates.name = name;
    if (lastName !== (currentProfileData.last_name ?? "")) profileUpdates.last_name = lastName;
    if (nickname !== (currentProfileData.nickname ?? "")) profileUpdates.nickname = nickname;
    if (phoneNumber !== (currentProfileData.phone_number ?? "")) profileUpdates.phone_number = phoneNumber;

    const originalPrefsString = JSON.stringify((currentProfileData.sport_preferences as SportPref[]) ?? []);
    const currentPrefsString = JSON.stringify(sportPreferences);
    if (originalPrefsString !== currentPrefsString) {
        profileUpdates.sport_preferences = sportPreferences;
    }

    let newAvatarUrl = currentProfileData.avatar_url || null;
    const hasNewAvatarFile = !!selectedAvatarFile;

    if (hasNewAvatarFile && selectedAvatarFile) {
      setIsUploadingAvatar(true);
      const bucketName = 'avatars';
      const fileExtension = selectedAvatarFile.name.split('.').pop() || 'webp';
      const fileName = `avatar-${Date.now()}.${fileExtension}`;
      const filePath = `${authUser.id}/${fileName}`;

      const oldAvatarPath = getStoragePathFromUrl(currentProfileData.avatar_url, bucketName);

      console.log('[handleSaveChanges] Iniciando upload para:', filePath);
      console.log('[handleSaveChanges] Caminho antigo (para exclusão):', oldAvatarPath);

      try {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(filePath, selectedAvatarFile, {
            cacheControl: '0',
          });

        if (uploadError) throw uploadError;
        if (!uploadData) throw new Error("Upload bem-sucedido, mas sem dados retornados.");

        const { data: publicUrlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(filePath);

        const finalUrl = publicUrlData.publicUrl.split('?')[0];

        if (!finalUrl) {
          throw new Error('Avatar carregado, mas falha ao obter URL pública.');
        }
        
        newAvatarUrl = finalUrl;
        profileUpdates.avatar_url = newAvatarUrl;

        console.log(`Novo avatar carregado: ${newAvatarUrl}`);

        if (oldAvatarPath) {
          console.log(`Tentando excluir avatar antigo do storage: ${oldAvatarPath}`);
          supabase.storage.from(bucketName).remove([oldAvatarPath])
            .then(({ error: deleteError }) => {
              if (deleteError) {
                console.warn("Falha ao excluir avatar antigo do storage:", deleteError);
              } else {
                console.log("Avatar antigo excluído com sucesso do storage.");
              }
            });
        }
        
      } catch (error) {
        console.error('Erro durante o upload do avatar:', error);
        toast.error(`Erro durante o upload do avatar: ${error instanceof Error ? error.message : String(error)}`);
        setSelectedAvatarFile(null);
        delete profileUpdates.avatar_url;
        newAvatarUrl = currentProfileData.avatar_url || null;
      } finally {
        setIsUploadingAvatar(false);
      }
    } else {
      delete profileUpdates.avatar_url;
      newAvatarUrl = currentProfileData.avatar_url || null;
    }

    Object.keys(profileUpdates).forEach(keyStr => {
      const key = keyStr as keyof typeof profileUpdates;
      if (profileUpdates[key] === undefined) {
        delete profileUpdates[key];
      }
    });

    if (Object.keys(profileUpdates).length > 0) {
      console.log("Atualizando perfil com:", profileUpdates);
      mutation.mutate(profileUpdates, {
        onSuccess: () => {
          toast.success("Perfil atualizado com sucesso!");
          queryClient.invalidateQueries({ queryKey: ['userProfile', authUser.id] });
          queryClient.invalidateQueries({ queryKey: ['currentUser'] });
          queryClient.invalidateQueries({ queryKey: ['groupDetails'] });
          setSelectedAvatarFile(null);
          setAvatarPreviewUrl(null);
        },
        onError: (error: Error) => {
          console.error("Error updating profile:", error);
          toast.error(`Erro ao atualizar perfil: ${error.message}`);
          setSelectedAvatarFile(null);
          setAvatarPreviewUrl(null);
        }
      });
    } else if (hasNewAvatarFile && !profileUpdates.avatar_url) {
        toast.info("Upload do avatar falhou. Nenhuma outra alteração detectada.");
        setSelectedAvatarFile(null);
        setAvatarPreviewUrl(null);
    } else if (!hasNewAvatarFile) {
        toast.info("Nenhuma alteração detectada para salvar.");
    }

    if (imgSrc) {
      URL.revokeObjectURL(imgSrc);
      setImgSrc('');
    }
  };

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];

      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        toast.error("Formato de imagem inválido. Use JPG, PNG ou WEBP.");
        return;
      }
      
      if (imgSrc) {
        URL.revokeObjectURL(imgSrc);
      }

      const newImgSrc = URL.createObjectURL(file);
      setImgSrc(newImgSrc);
      setShowCropModal(true);
      e.target.value = "";
    } else {
       setImgSrc('');
       setShowCropModal(false);
    }
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onSelectFile(event);
  };

  const triggerAvatarInput = () => {
    avatarFileInputRef.current?.click();
  };

  const hasPendingChanges = useMemo(() => {
    const currentProfileData = profileQuery.data;
    if (!currentProfileData) return false;
    const originalPrefsString = JSON.stringify((currentProfileData.sport_preferences as SportPref[]) ?? []);
    const currentPrefsString = JSON.stringify(sportPreferences);

    return (
      name !== (currentProfileData.name ?? "") ||
      lastName !== (currentProfileData.last_name ?? "") ||
      nickname !== (currentProfileData.nickname ?? "") ||
      phoneNumber !== (currentProfileData.phone_number ?? "") ||
      originalPrefsString !== currentPrefsString ||
      !!selectedAvatarFile
    );
  }, [name, lastName, nickname, phoneNumber, sportPreferences, profileQuery.data, selectedAvatarFile]);

  const isLoading = loadingAuth || profileQuery.isLoading || profileQuery.isFetching || mutation.isPending || isUploadingAvatar;
  const isProcessingAvatar = isUploadingAvatar;

  if (loadingAuth || profileQuery.isLoading) {
     return (
      <MobileLayout
        header={<TopNav title="Perfil" backHref="/menu" />}
        footer={<BottomNav />}
      >
        <div className="space-y-6 p-4">
            <div className="flex flex-col items-center justify-center py-4">
                <Skeleton className="h-24 w-24 rounded-full" />
                <Skeleton className="h-6 w-32 mt-4" />
                <Skeleton className="h-4 w-40 mt-1" />
                <Skeleton className="h-5 w-28 mt-1" />
            </div>
            <Card>
                <CardContent className="p-4 space-y-4">
                    <Skeleton className="h-6 w-40 mb-4" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-9 w-full" />
                    </div>
                     <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-9 w-full" />
                    </div>
                     <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-9 w-full" />
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardContent className="p-4 space-y-4">
                    <Skeleton className="h-6 w-48 mb-4" />
                     <Skeleton className="h-10 w-full" />
                     <Skeleton className="h-10 w-full" />
                </CardContent>
            </Card>
             <Skeleton className="h-10 w-full" />
        </div>
      </MobileLayout>
    );
  }

  if (!authUser || profileQuery.isError || (profileQuery.isSuccess && !profileQuery.data)) {
     return (
        <MobileLayout
          header={<TopNav title="Perfil" backHref="/menu" />}
          footer={<BottomNav />}
        >
           <div className="p-4 text-center">Erro ao carregar perfil ou usuário não encontrado. Tente recarregar a página.</div>
           {profileQuery.error && <p className="text-xs text-destructive">Detalhe: {(profileQuery.error as Error).message}</p>}
        </MobileLayout>
     );
  }

  const currentProfileData = profileQuery.data!;

  const displayName = nickname || name || "Usuário";
  const fallbackInitials = ((name?.[0] || '') + (lastName?.[0] || '')).toUpperCase() || 'U';
  const currentAvatarUrl = avatarPreviewUrl ? avatarPreviewUrl : (currentProfileData.avatar_url || '');

  return (
    <MobileLayout
      header={<TopNav title="Perfil" backHref="/menu" />}
      footer={<BottomNav />}
    >
      <div className="space-y-6 p-4 pb-24">
        <div className="flex flex-col items-center justify-center py-4 border-b pb-6 mb-6">
          <div className="relative group">
            <input
              type="file"
              accept="image/png, image/jpeg, image/webp"
              ref={avatarFileInputRef}
              onChange={handleAvatarChange}
              className="hidden"
              disabled={isLoading}
            />
            <Avatar className="h-24 w-24 border-2 border-transparent group-hover:border-primary transition-colors duration-200 cursor-pointer" onClick={triggerAvatarInput}>
              {currentAvatarUrl ? (
                <AvatarImage src={currentAvatarUrl} alt={displayName} key={currentAvatarUrl} />
              ) : (
                <AvatarFallback>{fallbackInitials}</AvatarFallback>
              )}
            </Avatar>
            <div
              className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
              onClick={triggerAvatarInput}
              aria-label="Alterar foto de perfil"
            >
              <Camera className="h-6 w-6 text-white" />
            </div>
            {(isProcessingAvatar) && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full">
                <Loader2 className="h-6 w-6 text-white animate-spin" />
              </div>
            )}
          </div>
          <h2 className="text-xl font-semibold mt-4">{`${name} ${lastName}`}</h2>
          <p className="text-sm text-muted-foreground">{authUser.email}</p>
          <p className="text-sm mt-1">
            <span className={`px-2 py-0.5 rounded-full text-xs ${
              currentProfileData.is_premium
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground"
            }`}>
              {currentProfileData.is_premium ? "Plano Premium" : "Plano Gratuito"}
            </span>
          </p>
        </div>

        <Card>
          <CardContent className="p-4 space-y-4">
            <h3 className="text-lg font-medium">Informações Pessoais</h3>
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" disabled={isLoading} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Sobrenome</Label>
              <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Seu sobrenome" disabled={isLoading} />
            </div>
             <div className="space-y-2">
              <Label htmlFor="nickname">Apelido (Opcional)</Label>
              <Input id="nickname" value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="Como te chamam?" disabled={isLoading} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="phoneNumber">Telefone (com DDD)</Label>
                <div className="flex items-center space-x-2">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <Input 
                        id="phoneNumber" 
                        type="tel" 
                        value={phoneNumber} 
                        onChange={(e) => setPhoneNumber(e.target.value)} 
                        placeholder='(XX) XXXXX-XXXX'
                        disabled={isLoading}
                    />
                </div>
                <p className="text-xs text-muted-foreground px-1">
                  Usado para facilitar o contato via WhatsApp entre membros do grupo.
                </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-4">
             <div className="flex items-center justify-between">
                 <h3 className="text-lg font-medium">Preferências Esportivas</h3>
                 {sportPreferences.length < 3 && !editMode && (
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => setEditMode(true)}
                      disabled={isLoading}
                    >
                      <Plus className="h-4 w-4 mr-1" /> Adicionar
                    </Button>
                 )}
             </div>
            
            <div className="space-y-3">
                {sportPreferences.map((pref, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-2 border rounded-md"
                  >
                    <div>
                      <p className="font-medium">{pref.sport}</p> 
                      <p className="text-sm text-muted-foreground">Posição: {pref.position}</p>
                    </div>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      onClick={() => handleRemoveSport(pref.sport)}
                      disabled={isLoading}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </div>
                ))}
            </div>

            {editMode && (
              <div className="space-y-3 border rounded-md p-3">
                <h4 className="font-medium text-sm">Adicionar preferência esportiva</h4>
                <div className="space-y-2">
                  <Label htmlFor="sport">Esporte</Label>
                  <Select value={newSport} onValueChange={(value) => setNewSport(value as SportType)} disabled={isLoading}>
                    <SelectTrigger id="sport">
                      <SelectValue placeholder="Selecione um esporte" />
                    </SelectTrigger>
                    <SelectContent>
                      {sportTypeValues.map(sport => (
                        <SelectItem key={sport} value={sport}>{sport}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">Posição/Função preferida</Label>
                  <Input 
                    id="position"
                    value={newPosition} 
                    onChange={(e) => setNewPosition(e.target.value)} 
                    placeholder="Ex: Goleiro, Armador, Levantador..."
                    disabled={isLoading || !newSport} 
                  />
                </div>
                <div className="flex gap-2 justify-end mt-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => { setEditMode(false); setNewSport(''); setNewPosition(''); }}
                    disabled={isLoading}
                  >
                    <X className="h-4 w-4 mr-1" /> Cancelar
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={handleAddSport}
                    disabled={!newSport || !newPosition || isLoading}
                  >
                    <Check className="h-4 w-4 mr-1" /> Adicionar
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
           <CardContent className="p-4 space-y-4">
             <h3 className="text-lg font-medium">Segurança</h3>
             <Button variant="outline" className="w-full" asChild>
               <Link href="/profile/change-password">
                 Alterar senha
               </Link>
             </Button>
           </CardContent>
        </Card>

        <Button onClick={handleSaveChanges} className="w-full" disabled={isLoading || !hasPendingChanges}>
          {(mutation.isPending || isProcessingAvatar) ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {isUploadingAvatar ? 'Enviando foto...' :
            (mutation.isPending ? 'Salvando...' : 'Salvar Alterações')}
        </Button>
      </div>

      <ImageCropModal
        isOpen={showCropModal}
        onClose={() => setShowCropModal(false)}
        imageSrc={imgSrc}
        aspectRatio={1}
        circularCrop={true}
        compressionOptions={AVATAR_COMPRESSION_OPTIONS}
        onConfirm={handleCropComplete}
      />
    </MobileLayout>
  );
}
