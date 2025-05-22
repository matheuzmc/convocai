'use client';

import React, { Suspense, useState, useEffect } from 'react'; // Add useState, useEffect
import { useSearchParams, useRouter } from 'next/navigation';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
// import { useAuth } from '@/contexts/AuthContext'; // Remove useAuth
import { createClient } from '@/lib/supabase/client'; // Import Supabase client helper
import { User as AuthUserType } from "@supabase/supabase-js"; // Import Supabase User type
import { acceptGroupInvite, getInviteDetailsByToken } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { TopNav } from '@/components/navigation/TopNav';
import { BottomNav } from '@/components/navigation/BottomNav';
import { Loader2, AlertTriangle, PartyPopper } from 'lucide-react';
import Link from 'next/link';
import { toast } from "sonner"; // Import toast
import { triggerNewGroupMemberNotification } from '@/app/notifications/actions'; // Importar a Server Action

// Wrapper component to access searchParams
function AcceptInviteContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    // const { user: currentUser, loading: authLoading } = useAuth(); // Remove useAuth
    const queryClient = useQueryClient();
    const supabase = createClient();
    const [authUser, setAuthUser] = useState<AuthUserType | null>(null);
    const [loadingAuth, setLoadingAuth] = useState(true);

    useEffect(() => {
      const getUser = async () => {
        setLoadingAuth(true);
        const { data: { user } } = await supabase.auth.getUser();
        setAuthUser(user);
        setLoadingAuth(false);
      };
      getUser();
    }, [supabase]);

    // Query para buscar detalhes do convite (nome do grupo)
    const { 
        data: inviteDetailsData, 
        isLoading: isLoadingInviteDetails, 
        isError: isInviteDetailsError, 
        isSuccess: isInviteDetailsSuccess 
    } = useQuery({
        queryKey: ['inviteDetails', token],
        queryFn: () => {
            if (!token) return null; // Não executar se não houver token
            return getInviteDetailsByToken(token);
        },
        enabled: !!token, // Habilitar apenas se o token existir
        staleTime: Infinity, // Detalhes do convite não mudam
        retry: false, // Não tentar novamente se o token for inválido
    });

    const mutation = useMutation({
        mutationFn: () => {
            if (!token) throw new Error("Token de convite inválido ou ausente.");
            // A função acceptGroupInvite já valida o token internamente (expiração, uso, etc.)
            return acceptGroupInvite(token);
        },
        onSuccess: (data) => { // data agora é { groupId: string }
            if (!data?.groupId) {
                 // Caso inesperado onde acceptGroupInvite teve sucesso mas não retornou groupId
                 toast.error("Erro ao processar entrada no grupo.");
                 console.error("acceptGroupInvite succeeded but returned no groupId");
                 return;
            }
            queryClient.invalidateQueries({ queryKey: ['userGroups', authUser?.id] });
            queryClient.invalidateQueries({ queryKey: ['groupDetails', data.groupId] });
            toast.success("Você entrou no grupo com sucesso!");
            

            // Disparar a notificação de novo membro
            if (authUser?.id && data.groupId) {
                // Chamada à Server Action (não precisa de await aqui, é fire-and-forget do ponto de vista do cliente)
                // O actorUserId aqui é o próprio novo membro, pois ele aceitou o convite.
                triggerNewGroupMemberNotification(data.groupId, authUser.id, authUser.id)
                    .then(result => {
                        if (result?.error) {
                            console.warn("Falha ao disparar notificação de novo membro:", result.error);
                        } else if (result?.success) {
                            console.log(`Notificação de novo membro disparada para ${result.count} usuários.`);
                        }
                    })
                    .catch(err => {
                        console.error("Erro ao chamar triggerNewGroupMemberNotification:", err);
                    });
            }
            router.push(`/groups/${data.groupId}`); // Mover o router.push para depois da lógica de notificação
        },
        onError: (error) => {
            console.error("Error accepting invite:", error);
            const defaultError = "Ocorreu um erro ao tentar entrar no grupo.";
            const errorMessage = error instanceof Error ? error.message : defaultError;

            // Verificar se o erro é de autenticação
            if (errorMessage.includes("User not authenticated") || errorMessage === "Você precisa estar logado para aceitar um convite.") {
                // Mensagem informativa antes de redirecionar
                toast.info("Você precisa fazer login para aceitar o convite.");
                // Redirecionar para login, passando a URL atual como 'next'
                const currentPath = window.location.pathname + window.location.search;
                router.push(`/login?next=${encodeURIComponent(currentPath)}`);
            } else {
                // Mapear outros erros comuns da API para mensagens amigáveis
                let displayError = errorMessage;
                if (errorMessage.includes("Invalid or non-existent invitation token")) {
                    displayError = "Este link de convite é inválido ou não existe mais.";
                } else if (errorMessage.includes("Invitation token has expired")) {
                    displayError = "Este link de convite expirou.";
                } else if (errorMessage.includes("Invitation token has already been used")) {
                    displayError = "Este link de convite já foi utilizado.";
                } else if (errorMessage.includes("User is already a member")) {
                    displayError = "Você já é membro deste grupo.";
                }
                // Exibir toast para outros erros
                toast.error(displayError);
            }
        },
    });

    const handleAccept = () => {
        mutation.mutate();
    };

    // Estado de carregamento combinado
    const isLoading = loadingAuth || isLoadingInviteDetails;

    // Determinar o nome do grupo para exibição
    const groupNameToDisplay = isInviteDetailsSuccess && inviteDetailsData ? inviteDetailsData.groupName : "...";
    const canAccept = !isLoading && isInviteDetailsSuccess && !!inviteDetailsData && !mutation.isPending;
    const showInvalidInviteError = isInviteDetailsError || (isInviteDetailsSuccess && !inviteDetailsData);

    if (isLoading) {
      return (
          <Card className="w-full max-w-md mx-auto">
              <CardHeader className="text-center">
                <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary mb-4" />
                <CardTitle>Carregando Convite...</CardTitle>
                <CardDescription>Verificando informações do convite.</CardDescription>
              </CardHeader>
            </Card>
      );
    }

    if (showInvalidInviteError) {
         return (
           <Card className="w-full max-w-md mx-auto">
              <CardHeader className="text-center">
                 <AlertTriangle className="h-8 w-8 mx-auto text-destructive mb-4" />
                 <CardTitle>Convite Inválido</CardTitle>
                 <CardDescription>O link de convite utilizado é inválido, expirou ou já foi utilizado.</CardDescription>
              </CardHeader>
              <CardFooter className="flex justify-center">
                 <Button variant="outline" className="w-full" asChild>
                    <Link href="/events">Voltar ao início</Link>
                 </Button>
              </CardFooter>
           </Card>
         );
    }

    // Conteúdo principal quando o convite é válido (mesmo que o usuário já seja membro, a API cuidará disso no accept)
    return (
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <PartyPopper className="h-12 w-12 mx-auto text-primary mb-4" />
            {/* Usar nome do grupo buscado */}
            <CardTitle>Convite para {groupNameToDisplay || 'Grupo'}</CardTitle>
            <CardDescription>
              Você foi convidado para entrar no grupo 
              <span className="font-semibold"> {groupNameToDisplay || 'este grupo'}</span>. 
              Clique abaixo para aceitar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Mostrar erro da mutação (accept) se houver */} 
            {mutation.isError && (
                 <div className="bg-destructive/10 p-3 rounded-md text-center text-sm text-destructive mb-4">
                    <p>{mutation.error instanceof Error ? mutation.error.message : "Erro ao entrar no grupo."}</p>
                 </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-2 pt-6">
            <Button 
                className="w-full" 
                onClick={handleAccept}
                // Desabilitar se não puder aceitar ou se a mutação estiver pendente
                disabled={!canAccept || mutation.isPending} 
            >
               {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
               {mutation.isPending ? 'Entrando...' : 'Entrar no Grupo'}
            </Button>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/events">Agora não</Link>
            </Button>
          </CardFooter>
        </Card>
    );
}

// Main page component using Suspense
export default function JoinGroupPage() {
  return (
    <MobileLayout
      header={<TopNav title="Aceitar Convite" />}
      footer={<BottomNav />}
    >
      <div className="container mx-auto p-4 flex justify-center items-center min-h-[calc(100vh-120px)]"> 
         {/* Wrap the content that uses useSearchParams in Suspense */}
         <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin text-primary" />}>
            <AcceptInviteContent />
         </Suspense>
      </div>
    </MobileLayout>
  );
} 