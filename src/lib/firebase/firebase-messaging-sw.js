// Importa os scripts do Firebase. Você deve hospedá-los ou usar uma CDN.
// Para a v9 modular, os caminhos podem ser diferentes. Verifique a documentação do Firebase.
// Exemplo para Firebase v9 (usando os scripts globais para service workers):
importScripts('https://www.gstatic.com/firebasejs/9.22.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.1/firebase-messaging-compat.js');

// Necessário para o Workbox/next-pwa injetar o manifest de pré-cache quando swSrc é usado
// Mesmo que não vamos usar diretamente o pré-caching neste arquivo específico,
// o next-pwa espera isso para prosseguir com o build ao usar swSrc.
// Se você quiser controle total sobre o caching, precisará adicionar a lógica do Workbox aqui.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const manifest = self.__WB_MANIFEST;

// TODO: As variáveis de ambiente NEXT_PUBLIC_FIREBASE_... precisam ser injetadas 
// durante o processo de build pelo next-pwa/Workbox para que o firebaseConfigFromEnv funcione.
const firebaseConfigFromEnv = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY, 
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// ATENÇÃO: Usando firebaseConfigFromEnv. Se as variáveis de ambiente não forem injetadas no build,
// esta inicialização falhará ou usará valores undefined.
firebase.initializeApp(firebaseConfigFromEnv);
const messaging = firebase.messaging();

// Manipulador para mensagens em segundo plano
// A função onBackgroundMessageHandler pode ter sido renomeada para onBackgroundMessage
// ou o acesso é diferente com os scripts compat. Vamos usar messaging.onBackgroundMessage
messaging.onBackgroundMessage((payload) => {
  console.log('[SW - onBackgroundMessage] Mensagem de DADOS recebida. Payload:', JSON.stringify(payload));

  // Extraia título, corpo, ícone, etc., de payload.data
  // Use valores padrão se não encontrados, para garantir que algo seja exibido.
  const title = payload.data?.title || 'Nova Notificação';
  const body = payload.data?.body || 'Você tem uma nova mensagem.';
  const icon = payload.data?.icon || '/icons/icon-192x192.png';
  
  // Os dados completos (incluindo url, click_action e quaisquer outros campos 
  // que você colocou em 'data' na Edge Function) são passados para a notificação.
  // O manipulador 'notificationclick' usará payload.data.url ou similar.
  const notificationData = payload.data || {}; 
  const badgeIconUrl = payload.data?.badgeIconUrl || '/icons/notification-badge.png'; // URL para o ícone do badge

  const options = {
    body: body,
    icon: icon, // Ícone principal da notificação
    badge: badgeIconUrl, // Ícone pequeno exibido na própria notificação (suporte varia)
    data: notificationData, 
    requireInteraction: true, // Mantém a notificação visível até interação
    // Exemplo de como você poderia adicionar um som se enviado via payload.data:
    // sound: payload.data?.soundUrl || undefined, // URL para um arquivo de som
    // silent: !payload.data?.soundUrl, // Silencia se nenhum som customizado for fornecido

    // Exemplo de tag para agrupamento ou substituição:
    // tag: payload.data?.tag || `convocai-notification-${Date.now()}` // Usar uma tag mais específica se necessário
  };

  console.log('[SW - onBackgroundMessage] Mostrando notificação construída a partir de DADOS. Título:', title, 'Opções:', JSON.stringify(options));
  self.registration.showNotification(title, options);
});

// Adiciona logs detalhados para depuração

self.addEventListener('install', () => {
  console.log('[SW] Service Worker instalado às:', new Date().toISOString());
  self.skipWaiting(); // Garante que o novo SW ative rapidamente
});

self.addEventListener('activate', event => {
  console.log('[SW] Service Worker ativado às:', new Date().toISOString());
  event.waitUntil(clients.claim()); // Controla clientes não controlados
});

/* COMENTADO PARA EVITAR DUPLICAÇÃO - O onBackgroundMessage acima já trata disso
self.addEventListener('push', function(event) {
  const timestamp = new Date().toISOString();
  let payloadData = 'Nenhum payload direto em event.data';
  let notificationTitle = 'Notificação Push';
  let notificationOptions = {};

  console.log(`[SW - self.addEventListener(\'push\')] Evento \'push\' recebido às: ${timestamp}`);

  if (event.data) {
    try {
      payloadData = event.data.json(); // Tente decodificar como JSON
      console.log(`[SW - self.addEventListener(\'push\')] Payload JSON recebido:`, payloadData);

      if (payloadData.notification) {
         notificationTitle = payloadData.notification.title || 'Sem Título';
         notificationOptions = {
           body: payloadData.notification.body || 'Sem Corpo',
           icon: payloadData.notification.icon || '/icons/icon-192x192.png',
           data: payloadData.data || { url: '/' }, 
         };
      } else {
        notificationTitle = payloadData.title || 'Notificação (do data)';
        notificationOptions = {
          body: payloadData.body || payloadData.message || 'Corpo (do data)',
          icon: payloadData.icon || '/icons/icon-192x192.png',
          data: payloadData.data || payloadData || { url: '/' }, 
        };
      }
    } catch {
      payloadData = event.data.text();
      console.log(`[SW - self.addEventListener(\'push\')] Payload de texto recebido: ${payloadData}`);
      notificationTitle = 'Notificação de Texto';
      notificationOptions = { body: payloadData, icon: '/icons/icon-192x192.png', data: { url: '/' } };
    }
  } else {
    console.log('[SW - self.addEventListener(\'push\')] Evento push não continha dados de payload.');
    return; 
  }

  console.log(`[SW - self.addEventListener(\'push\')] Preparando para mostrar notificação às ${new Date().toISOString()}: Titulo="${notificationTitle}", Opções=`, JSON.stringify(notificationOptions));

  const promiseChain = self.registration.showNotification(notificationTitle, notificationOptions)
    .then(() => {
      console.log(`[SW - self.addEventListener(\'push\')] self.registration.showNotification RESOLVIDO às ${new Date().toISOString()}`);
    })
    .catch(err => {
      console.error(`[SW - self.addEventListener(\'push\')] Erro ao mostrar notificação às ${new Date().toISOString()}:`, err);
    });

  event.waitUntil(promiseChain);
});
*/

// Se você tiver um manipulador 'notificationclick', adicione logs a ele também:
self.addEventListener('notificationclick', function(event) {
  const timestamp = new Date().toISOString();
  console.log(`[SW] Evento 'notificationclick' recebido às: ${timestamp}`, event.notification);
  event.notification.close(); // Fecha a notificação

  // Abre a URL especificada em event.notification.data.url ou uma URL padrão
  // Note que 'event.notification.data' aqui deve corresponder ao que foi passado em 'options.data' acima.
  const targetUrl = event.notification.data && event.notification.data.url ? event.notification.data.url : '/';
  console.log(`[SW] Abrindo URL: ${targetUrl}`);

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (let i = 0; i < clientList.length; i++) {
        let client = clientList[i];
        if (client.url && client.url.startsWith(self.location.origin) && 'focus' in client) {
          console.log('[SW] Cliente encontrado, focando e navegando.');
          return client.focus().then(client => client.navigate(targetUrl));
        }
      }
      console.log('[SW] Nenhum cliente encontrado, abrindo nova janela.');
      return clients.openWindow(targetUrl);
    })
  );
}); 