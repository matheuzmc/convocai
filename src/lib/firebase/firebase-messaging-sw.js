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

// TODO: Substitua estas variáveis de ambiente pelos valores do seu firebaseConfig
// Copie os mesmos valores de src/lib/firebase/client.ts ou use variáveis de ambiente se possível
const firebaseConfigFromEnv = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY, // Atenção: Service Workers não têm acesso direto a process.env do Node
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// const firebaseConfig = {
//   apiKey: "AIzaSyBLtFPy67g2tnTg_NVFaUuppj5_I92WHsA", // Atenção: Service Workers não têm acesso direto a process.env do Node
//   authDomain: "convocai-934c0.firebaseapp.com",
//   projectId: "convocai-934c0",
//   storageBucket: "convocai-934c0.firebasestorage.app",
//   messagingSenderId: "982650173473",
//   appId: "1:982650173473:web:a0237158cf156de3014b60",
// };

// ATENÇÃO: Usando firebaseConfigFromEnv. Se as variáveis de ambiente não forem injetadas no build,
// esta inicialização falhará ou usará valores undefined.
// Você precisará configurar seu processo de build (ex: com next-pwa ou workbox) 
// para substituir essas variáveis process.env.* pelos valores reais durante o build do service worker.
firebase.initializeApp(firebaseConfigFromEnv);
const messaging = firebase.messaging(); // getMessaging() é chamado de forma diferente com os scripts compat

// Manipulador para mensagens em segundo plano
// A função onBackgroundMessageHandler pode ter sido renomeada para onBackgroundMessage
// ou o acesso é diferente com os scripts compat. Vamos usar messaging.onBackgroundMessage
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  // TODO: Customize notification here
  const notificationTitle = payload.notification?.title || 'Nova Notificação';
  const notificationOptions = {
    body: payload.notification?.body || 'Você tem uma nova mensagem.',
    icon: payload.notification?.icon || '/icons/icon-192x192.png', // Use um ícone padrão do seu PWA
    data: payload.data // Para passar dados como URLs para o evento de clique
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Manipulador para cliques na notificação (opcional, mas recomendado)
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click Received.', event.notification.data);
  event.notification.close();

  // TODO: Lógica para abrir a janela/URL correta
  // Exemplo: event.notification.data?.url ou uma URL padrão
  const urlToOpen = event.notification.data?.url || '/'; 
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clientList) => {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
}); 