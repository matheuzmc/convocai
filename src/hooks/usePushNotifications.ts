import { useState, useEffect, useCallback } from 'react';
import { getFirebaseMessaging } from '@/lib/firebase/client';
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
  if (profileData && profileData.fcm_tokens) {
    existingTokens = profileData.fcm_tokens.filter((token: string | null) => token);
  }

  if (!existingTokens.includes(token)) {
    const newTokens = [...existingTokens, token];
    const { error: updateError } = await supabase
      .from(profileTable)
      .update({ fcm_tokens: newTokens })
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

// Função para remover o token FCM do perfil
async function removeFcmTokenFromProfile(token: string, userId: string): Promise<void> {
  console.log(`Tentando remover o token FCM: ${token} para o usuário ${userId}`);
  const supabase = createClient();

  const profileTable = 'profiles';
  const userIdColumn = 'id';

  const { data: profileData, error: fetchError } = await supabase
    .from(profileTable)
    .select('fcm_tokens')
    .eq(userIdColumn, userId)
    .single();

  if (fetchError) {
    console.error('Erro ao buscar perfil para remover token FCM:', fetchError);
    throw fetchError;
  }

  if (profileData && profileData.fcm_tokens) {
    const existingTokens = profileData.fcm_tokens.filter((t: string | null) => t && t !== token);
    
    const { error: updateError } = await supabase
      .from(profileTable)
      .update({ fcm_tokens: existingTokens })
      .eq(userIdColumn, userId);

    if (updateError) {
      console.error('Erro ao remover token FCM do perfil:', updateError);
      throw updateError;
    }
    console.log('Token FCM removido do perfil com sucesso.', existingTokens);
  }
}

export function usePushNotifications() {
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | null>(null);
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [authUser, setAuthUser] = useState<AuthUserType | null>(null);
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState<boolean>(false);
  const [isTokenActive, setIsTokenActive] = useState<boolean>(false); // Controla se o token está ativo no backend

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
      setIsNotificationsEnabled(initialPermission === 'granted');
      // console.log('[usePushNotifications] Initial permission status:', initialPermission); // Pode ser removido ou mantido
    }
  }, []);

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
        const { getToken } = await import('firebase/messaging');
        const currentToken = await getToken(messagingInstance, tokenOptions);

        if (currentToken) {
          setFcmToken(currentToken);
          setIsTokenActive(true);
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

  const requestPermissionAndGetToken = useCallback(async () => {
    if (!VAPID_KEY) {
      console.error('Chave VAPID do Firebase não configurada. Verifique NEXT_PUBLIC_FIREBASE_VAPID_KEY.');
      setError(new Error('Configuração de notificação incompleta.'));
      return false;
    }
    if (!authUser) {
      console.warn('Usuário não autenticado. Token FCM não será solicitado/salvo.');
      setError(new Error('Usuário não autenticado.'));
      return false;
    }

    let currentPermission = permissionStatus;
    if (currentPermission !== 'granted' && currentPermission !== 'denied') {
        try {
            currentPermission = await Notification.requestPermission();
            setPermissionStatus(currentPermission);
            setIsNotificationsEnabled(currentPermission === 'granted');
        } catch (err) {
            console.error('Erro ao solicitar permissão de notificação:', err);
            setError(err as Error);
            return false;
        }
    }

    if (currentPermission === 'granted') {
      await retrieveToken();
      return true;
    } else {
      console.warn('Permissão de notificação não concedida.', currentPermission);
      setError(new Error(`Permissão de notificação não concedida: ${currentPermission}` ));
      return false;
    }
  }, [authUser, permissionStatus, retrieveToken]);

  // Função para "desativar" notificações (remove token do backend)
  const disableNotifications = useCallback(async () => {
    if (!authUser || !fcmToken) {
      console.warn('Usuário não autenticado ou token não disponível.');
      return false;
    }

    try {
      await removeFcmTokenFromProfile(fcmToken, authUser.id);
      setIsTokenActive(false);
      console.log('Notificações desativadas - token removido do backend');
      return true;
    } catch (err) {
      console.error('Erro ao desativar notificações:', err);
      setError(err as Error);
      return false;
    }
  }, [authUser, fcmToken]);

  // Função para reativar notificações (adiciona token de volta ao backend)
  const enableNotifications = useCallback(async () => {
    if (permissionStatus === 'granted' && fcmToken && authUser) {
      try {
        await saveFcmTokenToProfile(fcmToken, authUser.id);
        setIsTokenActive(true);
        console.log('Notificações reativadas - token adicionado ao backend');
        return true;
      } catch (err) {
        console.error('Erro ao reativar notificações:', err);
        setError(err as Error);
        return false;
      }
    } else {
      // Se não tem permissão, solicita
      return await requestPermissionAndGetToken();
    }
  }, [permissionStatus, fcmToken, authUser, requestPermissionAndGetToken]);

  useEffect(() => {
    const setupForegroundMessaging = async () => {
      const messagingInstance = getFirebaseMessaging();
      if (messagingInstance && permissionStatus === 'granted') {
        const { onMessage } = await import('firebase/messaging');
        const unsubscribe = onMessage(messagingInstance, (payload) => {
          console.log('Mensagem recebida em primeiro plano: ', payload);
        });
        return unsubscribe;
      }
    };

    let unsubscribe: (() => void) | undefined;
    setupForegroundMessaging().then((unsub) => {
      unsubscribe = unsub;
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [permissionStatus]);

  useEffect(() => {
    if (permissionStatus === 'granted' && authUser && !fcmToken && !error) {
      retrieveToken();
    }
  }, [permissionStatus, authUser, fcmToken, error, retrieveToken]);

  return { 
    requestPermissionAndGetToken,
    disableNotifications,
    enableNotifications,
    permissionStatus,
    fcmToken,
    error,
    isNotificationsEnabled,
    isTokenActive
  };
} 