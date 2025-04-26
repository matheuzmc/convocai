"use client";

import React, { useState, useEffect, useRef } from "react";
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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateUserProfile, getUserProfile, UserProfileData } from "@/services/api";
import { toast } from "sonner";
import { ImageCropModal } from '@/components/features/ImageCropModal';
import { getStoragePathFromUrl } from '@/lib/utils';
import { AVATAR_COMPRESSION_OPTIONS } from '@/lib/constants';

// Definir SportPref fora ou no topo do componente para reutilização
type SportPref = { sport: SportType; position: string };

export default function ProfilePage() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  
  const [authUser, setAuthUser] = useState<AuthUserType | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [isFetchingProfile, setIsFetchingProfile] = useState(true);

  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [nickname, setNickname] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [sportPreferences, setSportPreferences] = useState<SportPref[]>([]);
  const [newSport, setNewSport] = useState<SportType | ''>( '');
  const [newPosition, setNewPosition] = useState('');
  const [editMode, setEditMode] = useState(false);

  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const [imgSrc, setImgSrc] = useState('');
  const [showCropModal, setShowCropModal] = useState(false);

  useEffect(() => {
    const getInitialData = async () => {
      setLoadingAuth(true);
      setIsFetchingProfile(true);
      const { data: { user } } = await supabase.auth.getUser();
      setAuthUser(user);
      setLoadingAuth(false);

      if (user) {
        try {
          const profileData: UserProfileData | null = await getUserProfile(user.id);
          setUserProfile(profileData);
          if (profileData) {
             setName(profileData.name ?? "");
             setLastName(profileData.last_name ?? "");
             setNickname(profileData.nickname ?? "");
             setPhoneNumber(profileData.phone_number ?? "");
             setSportPreferences((profileData.sport_preferences as SportPref[]) ?? []);
             setAvatarPreviewUrl(profileData.avatar_url);
          }
        } catch (error) {
           console.error("Failed to fetch user profile:", error);
           toast.error("Falha ao carregar dados do perfil.");
        } finally {
           setIsFetchingProfile(false);
        }
      } else {
         setIsFetchingProfile(false);
      }
    };
    getInitialData();
  }, [supabase]);

  const handleAddSportPreference = () => {
    const currentPrefs = sportPreferences;
    if (newSport && newPosition && !currentPrefs.some((p: SportPref) => p.sport === newSport)) {
      setSportPreferences([...currentPrefs, { sport: newSport, position: newPosition }]);
      setNewSport('');
      setNewPosition('');
      setEditMode(false);
    }
  };

  const handleRemoveSportPreference = (sportToRemove: SportType) => {
    setSportPreferences((prevState) => 
        prevState.filter((p: SportPref) => p.sport !== sportToRemove)
    );
  };

  const handleCancelAdd = () => {
    setNewSport('');
    setNewPosition('');
    setEditMode(false);
  };

  const getSportDisplayName = (sport: SportType) => {
    const sportNames: Record<SportType, string> = {
      'futebol': 'Futebol',
      'basquete': 'Basquete',
      'vôlei': 'Vôlei',
      'tênis': 'Tênis',
      'corrida': 'Corrida',
      'ciclismo': 'Ciclismo',
      'natação': 'Natação',
      'handebol': 'Handebol',
      'futsal': 'Futsal',
      'beach_tennis': 'Beach Tennis',
      'outro': 'Outro'
    };
    return sportNames[sport] || sport;
  };
  
  const mutation = useMutation({
    mutationFn: (updatedProfileData: Partial<{ 
      name: string | null; 
      sport_preferences: SportPref[]; 
      avatar_url: string | null;
      phone_number: string | null;
    }>) => {
        if (!authUser) throw new Error("Usuário não autenticado");
        return updateUserProfile(updatedProfileData);
    },
    onSuccess: () => {
      toast.success("Perfil atualizado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ['userProfile', authUser?.id] });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
    onError: (error: Error) => {
      console.error("Error updating profile:", error);
      toast.error(`Erro ao atualizar perfil: ${error.message}`);
    },
  });

  const handleSaveChanges = async () => {
    if (!authUser || !userProfile) return;

    // Validação do Sobrenome
    if (!lastName || lastName.trim() === "") {
      toast.error("Por favor, preencha o campo Sobrenome.");
      return; // Impede o salvamento se o sobrenome estiver vazio
    }

    let newAvatarUrl = avatarPreviewUrl; // Inicia com a preview atual (pode ser a cortada ou a do banco)
    
    // Verifica se a preview atual é diferente da URL original do banco
    // E se não é nula (ou seja, se uma nova imagem foi selecionada/cortada)
    const hasNewAvatarFile = selectedAvatarFile !== null;

    const profileUpdates: Partial<{ 
        name: string | null; 
        last_name: string | null; // Adicionado
        nickname: string | null; // Adicionado
        sport_preferences: SportPref[];
        avatar_url: string | null;
        phone_number: string | null;
    }> = {
        name: name !== (userProfile?.name ?? "") ? name : undefined,
        last_name: lastName !== (userProfile?.last_name ?? "") ? lastName : undefined, // Adicionado
        nickname: nickname !== (userProfile?.nickname ?? "") ? nickname : undefined, // Adicionado
        phone_number: phoneNumber !== (userProfile?.phone_number ?? "") ? phoneNumber : undefined,
        sport_preferences: JSON.stringify(sportPreferences) !== JSON.stringify(userProfile?.sport_preferences ?? []) ? sportPreferences : undefined,
        // avatar_url será tratado abaixo após o upload
    };

    // Se um novo arquivo de avatar foi selecionado e CORTADO
    if (hasNewAvatarFile && selectedAvatarFile) {
      setIsUploadingAvatar(true);
      const bucketName = 'avatars';
      const fileExtension = selectedAvatarFile.name.split('.').pop() || 'webp'; 
      const filePath = `${authUser.id}/avatar.${fileExtension}?t=${new Date().getTime()}`;

      console.log('[handleSaveChanges] Iniciando upload para:', filePath);
      
      try {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(filePath, selectedAvatarFile, {
            cacheControl: '0',
            upsert: true,
          });

        if (uploadError) throw uploadError;
        if (!uploadData) throw new Error("Upload bem-sucedido, mas sem dados retornados.");

        const { data: publicUrlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(filePath); 

        const finalUrl = publicUrlData.publicUrl.split('?')[0] + `?t=${new Date().getTime()}`;

        if (!finalUrl) {
          throw new Error('Avatar carregado, mas falha ao obter URL pública.');
        }
        
        newAvatarUrl = finalUrl; // Atualiza a URL para a recém-carregada
        profileUpdates.avatar_url = newAvatarUrl; // Adiciona ao payload de update

        console.log(`Novo avatar carregado: ${newAvatarUrl}`);
        
        const oldAvatarPath = getStoragePathFromUrl(userProfile?.avatar_url, bucketName);
        if (oldAvatarPath && newAvatarUrl !== userProfile?.avatar_url) {
          console.log(`Tentando excluir avatar antigo: ${oldAvatarPath}`);
          supabase.storage.from(bucketName).remove([oldAvatarPath])
            .then(({ error: deleteError }) => {
              if (deleteError) console.warn("Falha ao excluir avatar antigo:", deleteError);
              else console.log("Avatar antigo excluído com sucesso.");
            });
        }

      } catch (error) {
        toast.error(`Erro durante o upload do avatar: ${error instanceof Error ? error.message : String(error)}`);
        setSelectedAvatarFile(null); 
        setAvatarPreviewUrl(userProfile?.avatar_url || null);
        // Não retorna aqui ainda, pode haver outras mudanças para salvar
        // Apenas remove a tentativa de atualizar avatar_url
        delete profileUpdates.avatar_url;
        newAvatarUrl = userProfile?.avatar_url || null; // Reseta newAvatarUrl para a original
        //setIsUploadingAvatar(false); // Movido para finally
      } finally {
          setIsUploadingAvatar(false);
      }
    } else {
      // Se não houve novo upload, não incluímos avatar_url nos updates
      delete profileUpdates.avatar_url;
      // Mantém newAvatarUrl como a URL original (ou a preview, caso não tenha mudado)
      newAvatarUrl = avatarPreviewUrl; 
    }
    
    // Remove chaves explicitamente undefined
    Object.keys(profileUpdates).forEach(keyStr => {
        const key = keyStr as keyof typeof profileUpdates;
        if (profileUpdates[key] === undefined) {
            delete profileUpdates[key];
        }
    });

    // Se houver ALGO para atualizar (dados ou SÓ o avatar que foi carregado com sucesso)
    if (Object.keys(profileUpdates).length > 0) {
        console.log("Atualizando perfil com:", profileUpdates);
        mutation.mutate(profileUpdates, {
             onSuccess: () => {
                toast.success("Perfil atualizado com sucesso!");
                queryClient.invalidateQueries({ queryKey: ['userProfile', authUser?.id] });
                queryClient.invalidateQueries({ queryKey: ['currentUser'] });
                // Se o upload foi bem-sucedido, a preview já está ok.
                // Limpa o selectedAvatarFile para evitar re-upload acidental
                setSelectedAvatarFile(null);
             },
             onError: (error: Error) => {
                console.error("Error updating profile:", error);
                toast.error(`Erro ao atualizar perfil: ${error.message}`);
                // Se a MUTATION falhar, mas o upload do avatar pode ter funcionado antes
                // O que fazer com a preview? Reverter? Manter? Por ora, mantemos.
             }
        });
    } else {
        toast.info("Nenhuma alteração detectada para salvar.");
        // Mesmo sem alterações, se um avatar foi selecionado (e falhou no upload ou não houve outras mudanças)
        // limpamos o estado local dele.
        if (selectedAvatarFile) {
           setSelectedAvatarFile(null);
           setAvatarPreviewUrl(userProfile?.avatar_url || null); // Reverte preview
        }
    }

    // Limpa a URL do objeto original da imagem que foi para o modal (se ainda existir)
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
      
      // Revogar URL antiga se existir
      if (imgSrc) {
        URL.revokeObjectURL(imgSrc);
      }

      const newImgSrc = URL.createObjectURL(file);
      setImgSrc(newImgSrc);
      setShowCropModal(true);
      // Limpa o valor do input para permitir selecionar o mesmo arquivo novamente
      e.target.value = "";
    } else {
       // Se nenhum arquivo for selecionado (ex: usuário cancela a janela de seleção)
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

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }
    };
  }, [avatarPreviewUrl]);

  const isLoading = loadingAuth || isFetchingProfile || mutation.isPending || isUploadingAvatar;
  const isProcessingAvatar = isUploadingAvatar;

  // Callback para quando o modal confirma o corte
  const handleCropComplete = (croppedFile: File) => {
      setSelectedAvatarFile(croppedFile);

      // Revoga URL antiga do avatarPreviewUrl se for um blob
      if (avatarPreviewUrl && avatarPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }
      // Cria nova preview URL para o arquivo cortado/comprimido
      const newPreviewUrl = URL.createObjectURL(croppedFile);
      setAvatarPreviewUrl(newPreviewUrl);
      
      // Limpa o imgSrc original que foi passado para o modal
      if (imgSrc) {
          URL.revokeObjectURL(imgSrc);
          setImgSrc('');
      }
      // Fecha o modal implicitamente, pois onConfirm é chamado antes de onClose no modal
      // setShowCropModal(false); // Não é necessário aqui
  };

  if (loadingAuth || isFetchingProfile) {
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

  if (!authUser || !userProfile) {
     return (
        <MobileLayout
          header={<TopNav title="Perfil" backHref="/menu" />}
          footer={<BottomNav />}
        >
           <div className="p-4 text-center">Erro ao carregar perfil ou usuário não encontrado.</div>
        </MobileLayout>
     );
  }

  const displayName = userProfile.name || authUser.email || "Usuário";
  const fallbackInitials = displayName?.split(" ").map((n: string) => n[0]).join("").toUpperCase() || "U";
  const currentAvatarUrl = avatarPreviewUrl || userProfile.avatar_url;

  return (
    <MobileLayout
      header={<TopNav title="Perfil" backHref="/menu" />}
      footer={<BottomNav />}
    >
      <div className="space-y-6 p-4">
        <div className="flex flex-col items-center justify-center py-4">
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
              userProfile.is_premium 
                ? "bg-primary/10 text-primary" 
                : "bg-muted text-muted-foreground"
            }`}>
              {userProfile.is_premium ? "Plano Premium" : "Plano Gratuito"}
            </span>
          </p>
        </div>

        <Card>
          <CardContent className="p-4 space-y-4">
            <h3 className="text-lg font-medium">Informações Pessoais</h3>
            
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                placeholder="Seu primeiro nome"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Sobrenome</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={isLoading}
                placeholder="Seu sobrenome"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nickname">Apelido (Opcional)</Label>
              <Input
                id="nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                disabled={isLoading}
                placeholder="Como você gosta de ser chamado?"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone (com DDD)</Label>
              <div className="flex items-center space-x-2">
                <Phone className="h-5 w-5 text-muted-foreground" /> 
                <Input 
                  id="phone" 
                  type="tel"
                  value={phoneNumber} 
                  onChange={(e) => setPhoneNumber(e.target.value)} 
                  placeholder="(XX) XXXXX-XXXX" 
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
              {!editMode && (
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
              {(sportPreferences).map((pref: SportPref, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-2 border rounded-md"
                >
                  <div>
                    <p className="font-medium">{getSportDisplayName(pref.sport)}</p>
                    <p className="text-sm text-muted-foreground">Posição: {pref.position}</p>
                  </div>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    onClick={() => handleRemoveSportPreference(pref.sport)}
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
                  <Select 
                    value={newSport} 
                    onValueChange={(value) => setNewSport(value as SportType)}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="sport">
                      <SelectValue placeholder="Selecione um esporte" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="futebol">Futebol</SelectItem>
                      <SelectItem value="basquete">Basquete</SelectItem>
                      <SelectItem value="vôlei">Vôlei</SelectItem>
                      <SelectItem value="tênis">Tênis</SelectItem>
                      <SelectItem value="corrida">Corrida</SelectItem>
                      <SelectItem value="ciclismo">Ciclismo</SelectItem>
                      <SelectItem value="natação">Natação</SelectItem>
                      <SelectItem value="handebol">Handebol</SelectItem>
                      <SelectItem value="futsal">Futsal</SelectItem>
                      <SelectItem value="beach_tennis">Beach Tennis</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
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
                    disabled={isLoading}
                  />
                </div>
                
                <div className="flex gap-2 justify-end mt-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleCancelAdd}
                    disabled={isLoading}
                  >
                    <X className="h-4 w-4 mr-1" /> Cancelar
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={handleAddSportPreference}
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

        <Button onClick={handleSaveChanges} className="w-full" disabled={isLoading}>
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
