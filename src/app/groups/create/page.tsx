"use client";

import React, { useState, useEffect } from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GroupForm, GroupFormData } from "@/components/forms/GroupEventForms";
import { Crown } from "lucide-react";
import Link from "next/link";
import { createClient } from '@/lib/supabase/client';
import { User as AuthUserType } from "@supabase/supabase-js";
import { Skeleton } from "@/components/ui/skeleton";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createGroup } from "@/services/api";
import { useRouter } from "next/navigation";
import { SportType } from "@/lib/types";
import { toast } from "sonner";
import { useImageUpload } from "@/hooks/useImageUpload";

export default function CreateGroupPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const supabase = createClient();
  const [authUser, setAuthUser] = useState<AuthUserType | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const {
    fileInputRef,
    triggerFileInput,
    displayImageUrl,
    isProcessing: isProcessingImage,
    selectedFile,
    renderCropModal,
    onSelectFile,
  } = useImageUpload({
    aspectRatio: 16 / 9
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      setLoadingAuth(true);
      const { data: { user } } = await supabase.auth.getUser();
      setAuthUser(user);
      setLoadingAuth(false);
    };
    getUser();
  }, [supabase]);

  const canCreate = true;
  const isPremium = false;

  const mutation = useMutation({
    mutationFn: (payload: { name: string; description: string | null; sport: SportType; image_url: string | null }) => createGroup(payload),
    onSuccess: (newGroupId) => {
      queryClient.invalidateQueries({ queryKey: ['userGroups', authUser?.id] });
      toast.success('Grupo criado com sucesso!');
      router.push(`/groups/${newGroupId}`);
    },
    onError: (error) => {
      console.error("Error creating group:", error);
      toast.error(`Erro ao criar grupo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      setIsSubmitting(false);
    },
    onSettled: () => {
    }
  });

  const handleSubmit = async (data: Omit<GroupFormData, 'image'>) => {
    if (!authUser) {
      toast.error("Erro: Usuário não autenticado.");
      return;
    }

    setIsSubmitting(true);
    let imageUrl: string | null = null;

    if (selectedFile) {
      const fileExtension = selectedFile.name.split('.').pop();
      const uniqueId = `${authUser.id}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const fileName = `${uniqueId}.${fileExtension}`;
      const filePath = fileName;
      const bucketName = 'group-images';

      try {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(filePath, selectedFile, {
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
        console.log(`Imagem carregada para novo grupo: ${imageUrl}`);

      } catch (error) {
        console.error("Erro no upload da imagem:", error);
        toast.error(`Falha no upload da imagem: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        setIsSubmitting(false);
        return;
      }
    }

    const groupPayload = {
      name: data.name,
      description: data.description || null,
      sport: data.sport as SportType,
      image_url: imageUrl
    };

    mutation.mutate(groupPayload);
  };

  if (loadingAuth) {
    return (
      <MobileLayout
        header={<TopNav title="Criar Grupo" backHref="/groups" />}
        footer={<BottomNav />}
      >
        <div className="p-4 space-y-6">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="aspect-video w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </MobileLayout>
    );
  }

  if (!authUser) {
     return (
        <MobileLayout
         header={<TopNav title="Erro" backHref="/groups" />}
         footer={<BottomNav />}
       >
         <div className="p-4 text-center">Erro: Usuário não autenticado.</div>
       </MobileLayout>
     );
  }

  return (
    <MobileLayout
      header={<TopNav title="Criar Grupo" backHref="/groups" />}
      footer={<BottomNav />}
    >
      <div className="p-4">
        {!canCreate && !isPremium ? (
          <div className="space-y-6">
            <Card className="border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Crown className="h-6 w-6 text-yellow-500 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-medium">Limite de grupos atingido</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      No plano gratuito você pode criar apenas 1 grupo. Faça upgrade para o plano Premium para criar grupos ilimitados.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Button className="w-full" asChild>
              <Link href="/plans">Fazer Upgrade para Premium</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <p className="text-muted-foreground">
              Preencha os dados abaixo para criar um novo grupo esportivo.
            </p>
            
            <Card>
              <CardContent className="p-4">
                <GroupForm
                  onSubmit={handleSubmit}
                  isLoading={isSubmitting || isProcessingImage || mutation.isPending}
                  imagePreviewUrl={displayImageUrl}
                  currentImageUrl={null}
                  isUploadingImage={isSubmitting && selectedFile != null}
                  triggerFileInput={triggerFileInput}
                  onFileChange={onSelectFile}
                  fileInputRef={fileInputRef}
                />
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {renderCropModal()}

    </MobileLayout>
  );
}
