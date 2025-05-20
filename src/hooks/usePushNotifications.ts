import { useState, useEffect, useCallback } from 'react';
import { getFirebaseMessaging } from '@/lib/firebase/client';
import { getToken, onMessage } from 'firebase/messaging';
import { createClient } from '@/lib/supabase/client';
import { User as AuthUserType } from '@supabase/supabase-js';

// Esta VAPID key é obtida do Firebase Console:
// Configurações do Projeto -> Cloud Messaging -> Certificados push da Web (par de chaves)
// É seguro expor esta chave no cliente.
const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

// ATENÇÃO: Esta função agora assume que sua tabela de perfis se chama 'profiles',
// que ela tem uma coluna 'id' (PK, referenciando auth.users.id), e
// uma coluna 'fcm_tokens' do tipo TEXT[] que VOCÊ PRECISA ADICIONAR.
async function saveFcmTokenToProfile(token: string, userId: string): Promise<void> {
  console.log(`Tentando salvar o token FCM: ${token} para o usuário ${userId}`);
  const supabase = createClient();

  const profileTable = 'profiles';
  const userIdColumn = 'id'; // Corrigido para 'id' conforme sua tabela profiles
  // A coluna fcm_tokens é usada diretamente abaixo como string literal.

  const { data: profileData, error: fetchError } = await supabase
    .from(profileTable)
    .select('fcm_tokens') // Seleciona explicitamente fcm_tokens
    .eq(userIdColumn, userId)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116: single row not found (ok)
    console.error('Erro ao buscar perfil para tokens FCM existentes:', fetchError);
    throw fetchError;
  }

  let existingTokens: string[] = [];
  // Agora podemos acessar profileData.fcm_tokens diretamente se os tipos estiverem corretos
  if (profileData?.fcm_tokens) { // profileData pode ser null se não encontrado (PGRST116)
    existingTokens = Array.isArray(profileData.fcm_tokens) ? profileData.fcm_tokens : [];
  } else if (fetchError && fetchError.code === 'PGRST116'){
    // Perfil não encontrado, o que é ok, significa que é o primeiro token para um novo perfil (ou um perfil sem tokens ainda)
    console.log('Nenhum perfil/tokens existentes encontrados, criando novo array de tokens.');
  } else if (!profileData) {
    // Caso profileData seja null/undefined por outra razão que não PGRST116
    console.warn('Dados do perfil não encontrados e não foi erro PGRST116.');
  }

  // 2. Adicionar o novo token apenas se ele não existir no array
  if (!existingTokens.includes(token)) {
    const newTokens = [...existingTokens, token];
    // O payload do update deve estar correto agora que os tipos incluem fcm_tokens
    const { error: updateError } = await supabase
      .from(profileTable)
      .update({ fcm_tokens: newTokens }) // Acessa fcm_tokens diretamente
      .eq(userIdColumn, userId);

    if (updateError) {
      console.error('Erro ao salvar/atualizar token FCM no perfil:', updateError);
      throw updateError;
    }
    console.log('Token FCM salvo/atualizado no perfil com sucesso.', newTokens);
  } else {
    console.log('Token FCM já existe no perfil.', existingTokens);
  }
}

export function usePushNotifications() {
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | null>(null);
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [authUser, setAuthUser] = useState<AuthUserType | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setAuthUser(user);
    };
    getUser();

    if (typeof window !== 'undefined' && 'Notification' in window) {
      const initialPermission = Notification.permission;
      setPermissionStatus(initialPermission);
      // console.log('[usePushNotifications] Initial permission status:', initialPermission); // Pode ser removido ou mantido
    }
  }, []);

  const requestPermissionAndGetToken = async () => {
    if (!VAPID_KEY) {
      console.error('Chave VAPID do Firebase não configurada. Verifique NEXT_PUBLIC_FIREBASE_VAPID_KEY.');
      setError(new Error('Configuração de notificação incompleta.'));
      return;
    }
    if (!authUser) {
      console.warn('Usuário não autenticado. Token FCM não será solicitado/salvo.');
      setError(new Error('Usuário não autenticado.'));
      return;
    }

    let currentPermission = permissionStatus;
    if (currentPermission !== 'granted' && currentPermission !== 'denied') {
        try {
            currentPermission = await Notification.requestPermission();
            setPermissionStatus(currentPermission);
        } catch (err) {
            console.error('Erro ao solicitar permissão de notificação:', err);
            setError(err as Error);
            return;
        }
    }

    if (currentPermission === 'granted') {
      await retrieveToken();
    } else {
      console.warn('Permissão de notificação não concedida.', currentPermission);
      setError(new Error(`Permissão de notificação não concedida: ${currentPermission}` ));
    }
  };

  const retrieveToken = useCallback(async () => {
    if (!VAPID_KEY) {
        console.error('Chave VAPID do Firebase não configurada.');
        setError(new Error('Configuração de notificação incompleta (VAPID key).'));
        return;
    }
    if (!authUser || !authUser.id) {
        console.error("ID do usuário não encontrado, não é possível obter/salvar o token FCM.");
        setError(new Error("ID do usuário não encontrado."));
        return;
    }

    try {
      const messagingInstance = getFirebaseMessaging();
      if (messagingInstance) {
        // Tentar obter o registro do nosso Service Worker principal
        const swRegistration = await navigator.serviceWorker.getRegistration('/');
        
        if (swRegistration) {
          console.log('[usePushNotifications] Usando SW Registration existente do escopo /', swRegistration);
        } else {
          console.warn('[usePushNotifications] Não foi encontrado SW Registration para o escopo /. O Firebase pode tentar registrar o default.');
        }

        const tokenOptions: { vapidKey: string; serviceWorkerRegistration?: ServiceWorkerRegistration } = { 
          vapidKey: VAPID_KEY 
        };

        if (swRegistration) {
          tokenOptions.serviceWorkerRegistration = swRegistration;
        }

        console.log('[usePushNotifications] Chamando getToken com opções:', tokenOptions);
        const currentToken = await getToken(messagingInstance, tokenOptions);

        if (currentToken) {
          setFcmToken(currentToken);
          console.log('Token FCM obtido:', currentToken);
          await saveFcmTokenToProfile(currentToken, authUser.id);
        } else {
          console.warn('Não foi possível obter o token FCM. Verifique a configuração do Service Worker, Firebase e VAPID key.');
          setError(new Error('Falha ao obter token FCM.'));
        }
      } else {
        console.warn('Firebase Messaging instance is null.');
        setError(new Error('Falha ao inicializar Firebase Messaging.'));
      }
    } catch (err) {
      console.error('Erro ao obter token FCM:', err);
      setError(err as Error);
    }
  }, [authUser]);

  useEffect(() => {
    const messagingInstance = getFirebaseMessaging();
    if (messagingInstance && permissionStatus === 'granted') {
      const unsubscribe = onMessage(messagingInstance, (payload) => {
        console.log('Mensagem recebida em primeiro plano: ', payload);
      });
      return () => {
        unsubscribe();
      };
    }
  }, [permissionStatus]);

  useEffect(() => {
    if (permissionStatus === 'granted' && authUser && !fcmToken && !error) {
      retrieveToken();
    }
  }, [permissionStatus, authUser, fcmToken, error, retrieveToken]);

  return { 
    requestPermissionAndGetToken,
    permissionStatus,
    fcmToken,
    error
  };
} 