import { serve, type Request } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { GoogleAuth } from 'npm:google-auth-library@^9.15.1'

console.log('Edge Function "send-push-notification" is up and running!')

const FCM_API_URL_V1 = (projectId: string) => `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`

async function getFcmTokens(supabaseClient: SupabaseClient, userId: string): Promise<string[]> {
  const { data, error } = await supabaseClient
    .from('profiles')
    .select('fcm_tokens')
    .eq('id', userId)
    .single()

  if (error) {
    console.error(`Error fetching FCM tokens for user ${userId}:`, error.message)
    return []
  }
  // fcm_tokens pode ser null ou um array vazio
  return data?.fcm_tokens?.filter((token: string | null) => token) || []
}

async function removeInvalidToken(supabaseClient: SupabaseClient, userId: string, tokenToRemove: string) {
  const { data: profileData, error: fetchError } = await supabaseClient
    .from('profiles')
    .select('fcm_tokens')
    .eq('id', userId)
    .single()

  if (fetchError) {
    console.error(`Error fetching profile to remove token for user ${userId}:`, fetchError.message)
    return
  }

  const currentTokens = profileData?.fcm_tokens || []
  const updatedTokens = currentTokens.filter((token: string) => token !== tokenToRemove)

  if (currentTokens.length === updatedTokens.length) {
    console.log(`Token ${tokenToRemove} not found for user ${userId}, no update needed.`)
    return
  }

  const { error: updateError } = await supabaseClient
    .from('profiles')
    .update({ fcm_tokens: updatedTokens })
    .eq('id', userId)

  if (updateError) {
    console.error(`Error removing invalid token for user ${userId}:`, updateError.message)
  } else {
    console.log(`Successfully removed invalid token ${tokenToRemove} for user ${userId}.`)
  }
}

async function sendPushNotification(
  projectId: string, 
  accessToken: string,
  fcmToken: string, 
  title: string, 
  body: string,  
  data: { [key: string]: string }
): Promise<{ token: string; status: 'success' | 'failure'; error?: any }> {
  const notificationPayload = {
    message: {
      token: fcmToken,
      data: {
        title: title,         
        body: body,           
        icon: '/icons/icon-192x192.png', // Ícone padrão para a notificação, pode ser sobrescrito pelo SW se desejado
        ...data             // Mescla outros dados como url, click_action
      },
      // Configurações específicas de plataforma para otimizar a entrega e comportamento:
      apns: { // Configurações para Apple Push Notification service (iOS)
        payload: {
          aps: {
            sound: 'default', // Som padrão para a notificação no iOS
            badge: 1,         // Atualiza o badge no ícone do app iOS (normalmente para indicar 1 nova notificação)
            // "content-available": 1 // Use para pushes silenciosos que acordam o app iOS em segundo plano para processar dados
          }
        },
        headers: {
          // 'apns-push-type': 'alert', // 'alert' para notificações visíveis, 'background' para content-available. Padrão é 'alert'.
          'apns-priority': '10'     // Prioridade da notificação APNS: 10 para entrega imediata, 5 para entrega que economiza energia.
        }
      },
      android: { // Configurações para dispositivos Android
        priority: 'high' // Prioridade da mensagem FCM para Android: 'high' ou 'normal'. 'high' tenta entregar imediatamente.
        // ttl: '86400s', // Exemplo de Time To Live para a mensagem no Android
        // notification: { // Removido para não haver conflito, pois o SW controla a notificação visual
        //   channel_id: 'your_channel_id' // Se você usa canais de notificação no Android nativo
        // }
      },
      webpush: { // Configurações para Web Push (PWAs em navegadores desktop e mobile)
        headers: {
          Urgency: 'high' // Urgência da mensagem Web Push: 'very-low', 'low', 'normal', ou 'high'.
          // TTL: '86400' // Exemplo de Time To Live em segundos para Web Push
        },
        fcm_options: {
          // O link é uma conveniência para o FCM, mas o clique é melhor tratado no SW para PWAs.
          link: data?.click_action || data?.url || '/' 
        }
      }
    }
  };

  try {
    const response = await fetch(FCM_API_URL_V1(projectId), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(notificationPayload),
    });

    if (!response.ok) {
      const errorBody = await response.json();
      console.error(`[${(data && data.requestId) || 'N/A'}] FCM send error for token ${fcmToken}: ${response.status}`, JSON.stringify(errorBody, null, 2));
      return { token: fcmToken, status: 'failure', error: errorBody };
    }
    return { token: fcmToken, status: 'success' };
  } catch (error: any) {
    console.error(`[${(data && data.requestId) || 'N/A'}] Exception during FCM send for token ${fcmToken}:`, error?.message, error);
    return { token: fcmToken, status: 'failure', error: { message: error?.message || 'Network or unexpected error' } };
  }
}

serve(async (req: Request) => {
  // DEBUG: Log a unique ID for the request and timestamp
  const requestId = crypto.randomUUID();
  console.log(`[${requestId}] Received request at ${new Date().toISOString()}`);

  try {
    const serviceAccountJsonString = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON")
    if (!serviceAccountJsonString) {
      console.error("GOOGLE_SERVICE_ACCOUNT_JSON is not set.")
      return new Response(JSON.stringify({ error: "Firebase service account key is not set." }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }
    const serviceAccount = JSON.parse(serviceAccountJsonString)
    const projectId = serviceAccount.project_id
    if (!projectId) {
      console.error("Project ID not found in GOOGLE_SERVICE_ACCOUNT_JSON.")
      return new Response(JSON.stringify({ error: "Project ID is missing in service account.", }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error('Supabase URL or Service Role Key is not set.')
      return new Response(JSON.stringify({ error: 'Supabase environment variables are not set.' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey)

    const payload = await req.json()
    // DEBUG: Log o payload completo recebido pela função
    console.log(`[${requestId}] Received webhook payload:`, JSON.stringify(payload, null, 2));

    if (payload.type !== 'INSERT' || payload.table !== 'notifications') {
      console.log(`[${requestId}] Not an insert on notifications table. Skipping.`);
      return new Response(JSON.stringify({ message: 'Skipping non-insert or non-notification event' }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    }

    const notificationRecord = payload.record
    if (!notificationRecord || !notificationRecord.user_id || !notificationRecord.title || !notificationRecord.message) {
      console.error('Invalid notification record data:', notificationRecord)
      return new Response(JSON.stringify({ error: 'Missing required fields in notification record (user_id, title, message).' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
    }

    const { user_id: userId, title, message, related_event_id, related_group_id } = notificationRecord
    // const notificationData = notificationRecord.data || { click_action: '/notifications' }

    // DEBUG: Log o userId extraído
    console.log(`[${requestId}] Processing notification for userId: ${userId}`);

    let targetUrl = '/notifications'; // Fallback URL
    if (related_event_id) {
      targetUrl = `/events/${related_event_id}`;
    } else if (related_group_id) {
      targetUrl = `/groups/${related_group_id}`;
    }

    // O Service Worker (public/firebase-messaging-sw.js) espera event.notification.data.url
    // O webpush.fcm_options.link também usará esta URL.
    const notificationDataForFcm = {
      // Preserva quaisquer outros dados que possam estar em notificationRecord.data no futuro,
      // embora a tabela 'notifications' atualmente não tenha uma coluna 'data'.
      ...(notificationRecord.data || {}), 
      url: targetUrl,
      click_action: targetUrl // Manter para consistência e para o fcm_options.link
    };

    const fcmTokens = await getFcmTokens(supabaseClient, userId)

    // DEBUG: Log os tokens FCM recuperados
    console.log(`[${requestId}] Found ${fcmTokens.length} FCM token(s) for user ${userId}:`, JSON.stringify(fcmTokens));

    if (fcmTokens.length === 0) {
      console.log(`[${requestId}] No FCM tokens found for user ${userId}. Nothing to send.`)
      return new Response(JSON.stringify({ message: `No FCM tokens for user ${userId}` }), { status: 200, headers: { 'Content-Type': 'application/json' } })
    }
    // console.log(`Found ${fcmTokens.length} FCM token(s) for user ${userId}:`, fcmTokens) // Log verboso

    const auth = new GoogleAuth({
      credentials: {
        client_email: serviceAccount.client_email,
        private_key: serviceAccount.private_key,
      },
      scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
    })

    const accessTokenResponse = await auth.getAccessToken()
    if (!accessTokenResponse) {
      console.error('Failed to get Google access token.')
      return new Response(JSON.stringify({ error: 'Could not obtain Google access token.' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }
    const accessToken = accessTokenResponse as string
    // console.log('Successfully obtained Google Access Token.') // Log verboso

    // DEBUG: Log antes de enviar para cada token
    fcmTokens.forEach(token => {
      console.log(`[${requestId}] Preparing to send notification to token: ${token} for user: ${userId}`);
    });

    const sendPromises = fcmTokens.map(token => 
      sendPushNotification(projectId, accessToken, token, title, message, notificationDataForFcm)
    )
    const results = await Promise.all(sendPromises)
    // console.log('FCM send results:', JSON.stringify(results, null, 2)) // Log verboso

    const tokensToRemove: string[] = []
    results.forEach(result => {
      if (result.status === 'failure' && result.token && result.error) {
        const fcmError = result.error
        const errorCode = fcmError.details && fcmError.details[0] ? fcmError.details[0].errorCode : fcmError.error?.status
        const invalidTokenErrorCodes = [
          'UNREGISTERED',
          'INVALID_ARGUMENT', // Pode ser token mal formatado ou outro problema
          'NOT_FOUND' // 'Requested entity was not found.'
        ]
        if (errorCode && invalidTokenErrorCodes.includes(errorCode)) {
           console.log(`[${requestId}] Token ${result.token} is invalid due to ${errorCode}. Adding to removal list.`)
           tokensToRemove.push(result.token)
        } else {
          console.warn(`[${requestId}] Failed to send to token ${result.token}. Error:`, JSON.stringify(fcmError))
        }
      } else if (result.status === 'success') {
        // DEBUG: Log de sucesso para um token específico
        console.log(`[${requestId}] Successfully sent notification to token: ${result.token} for user: ${userId}`);
      }
    })

    if (tokensToRemove.length > 0) {
      console.log(`[${requestId}] Removing invalid tokens:`, tokensToRemove)
      const removalPromises = tokensToRemove.map(token => removeInvalidToken(supabaseClient, userId, token))
      await Promise.all(removalPromises)
      console.log(`[${requestId}] Finished removing invalid tokens.`)
    }

    return new Response(JSON.stringify({ success: true, message: 'Notifications processed.', results_summary: results.map(r => ({token: r.token, status: r.status, error: r.error ? (r.error.details ? r.error.details[0].errorCode : r.error.message) : null})) }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (error: any) {
    // DEBUG: Adicionar requestId ao log de erro crítico
    console.error(`[${requestId}] Critical Error in Edge Function:`, error?.message, error?.stack, error)
    return new Response(
      JSON.stringify({ error: error?.message || 'Internal Server Error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

/* 
  Para testar localmente (após configurar o Supabase CLI e fazer login):
  1. Crie o arquivo supabase/.env e adicione o segredo:
     GOOGLE_SERVICE_ACCOUNT_JSON='{...conteúdo do seu json...}'
     // As URLs e Keys abaixo são geralmente necessárias para o createClient acessar o Supabase localmente.
     // Você pode obter esses valores do output de `supabase status` após `supabase start`.
     SUPABASE_URL=http://localhost:54321 
     SUPABASE_ANON_KEY=your_anon_key 
     // SUPABASE_SERVICE_ROLE_KEY=your_service_role_key (se precisar de acesso privilegiado)

     NUNCA comite este arquivo .env com segredos reais.
  2. Inicie o Supabase localmente: supabase start
  3. Sirva a função: supabase functions serve send-push-notification --no-verify-jwt --env-file ./supabase/.env
  4. Em outra aba do terminal, envie uma requisição POST para a função, por exemplo, com curl:
     curl -i --location --request POST 'http://localhost:54321/functions/v1/send-push-notification' \\
     --header 'Authorization: Bearer YOUR_SUPABASE_ANON_KEY' \\
     --header 'Content-Type: application/json' \\
     --data-raw '{
         "type": "INSERT",
         "table": "notifications",
         "record": {
             "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
             "user_id": "YOUR_REAL_USER_ID_FROM_PROFILES_TABLE_WITH_FCM_TOKEN",
             "title": "Teste de Notificação!",
             "message": "Esta é uma mensagem de teste da sua Edge Function! ✨",
             "type": "info",
             "related_event_id": null,
             "related_group_id": null,
             "is_read": false,
             "created_at": "2023-10-27T10:00:00Z"
         },
         "schema": "public",
         "old_record": null
     }'
*/ 