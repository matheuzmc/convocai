# Solução do Problema de Notificações Push Duplicadas

## 1. Visão Geral do Problema

O sistema estava enviando e exibindo notificações push duplicadas para os usuários no PWA. Cada evento que deveria gerar uma única notificação resultava em duas notificações visuais idênticas ou muito semelhantes para o usuário final.

## 2. Investigação e Diagnóstico

A investigação passou por várias etapas:

*   **Verificação da Lógica da Edge Function:**
    *   Inicialmente, analisamos os logs da Edge Function (`supabase/functions/send-push-notification/index.ts`) para garantir que ela não estava sendo invocada múltiplas vezes para o mesmo evento ou enviando a mesma mensagem para múltiplos tokens FCM do mesmo usuário de forma indevida.
    *   Os logs detalhados (com `requestId`) confirmaram que a Edge Function era chamada apenas uma vez por evento de gatilho e processava o número esperado de tokens FCM (geralmente um por usuário/dispositivo).

*   **Análise dos Logs do Service Worker (`src/lib/firebase/firebase-messaging-sw.js`):**
    *   Adicionamos logs detalhados aos manipuladores de eventos do Service Worker (`install`, `activate`, `push`, `notificationclick`) e ao manipulador `messaging.onBackgroundMessage()` do Firebase SDK.
    *   A pista crucial surgiu quando observamos que tanto o manipulador `self.addEventListener('push', ...)` (que havíamos adicionado para depuração e depois comentamos) quanto o manipulador `messaging.onBackgroundMessage()` estavam, em diferentes fases da depuração, tentando exibir uma notificação.
    *   Finalmente, a observação de que notificações com conteúdos ligeiramente diferentes ("BLABLABLA" vs. "TESTE ÚNICO") estavam chegando simultaneamente confirmou que diferentes partes do sistema estavam gerando notificações.

## 3. Causa Raiz Identificada

A causa raiz da duplicação era a interação entre duas formas de exibição de notificações quando uma mensagem FCM chega ao cliente (Service Worker) e o aplicativo está em segundo plano ou fechado:

1.  **Exibição Automática pelo SDK do Firebase:**
    *   Quando a Edge Function enviava um payload para o FCM que continha um objeto `notification` (com campos como `title`, `body`), o SDK do Firebase no Service Worker (`firebase-messaging-compat.js`) automaticamente tentava exibir essa notificação no sistema do usuário.

2.  **Exibição Explícita pelo Código do Service Worker:**
    *   Paralelamente, o mesmo payload FCM (que também continha um objeto `data` com informações adicionais) era passado para o manipulador `messaging.onBackgroundMessage()` no `firebase-messaging-sw.js`.
    *   O código dentro deste manipulador também lia informações (originalmente do `payload.notification` ou, após nossas modificações de depuração, do `payload.data`) e chamava `self.registration.showNotification()` para exibir uma segunda notificação.

Essencialmente, a mesma mensagem push estava acionando duas rotas de exibição de notificação.

## 4. Solução Implementada (Opção B: Controle Total no Service Worker)

A solução adotada foi centralizar a responsabilidade de exibir a notificação exclusivamente no código do Service Worker, tratando a mensagem FCM puramente como uma mensagem de dados.

**Modificações na Edge Function (`supabase/functions/send-push-notification/index.ts`):**

*   **Remoção do Campo `notification`:** O objeto `notification` foi completamente removido do payload enviado ao FCM.
*   **Envio de Detalhes da Notificação via Campo `data`:** Todas as informações necessárias para exibir a notificação (título, corpo, ícone, URL de destino para clique, etc.) agora são enviadas exclusivamente dentro do objeto `data` do payload FCM.

    Exemplo da estrutura do payload enviado ao FCM pela Edge Function:
    ```json
    {
      "message": {
        "token": "USER_FCM_TOKEN",
        "data": {
          "title": "Título Real da Notificação",
          "body": "Corpo Real da Mensagem",
          "icon": "/icons/icon-192x192.png",
          "url": "/caminho/para/abrir/no/clique",
          "click_action": "/caminho/para/abrir/no/clique"
          // ... outros dados personalizados ...
        },
        "apns": { /* Configurações APNS, ex: som, badge */ },
        "android": { /* Configurações Android, ex: prioridade */ },
        "webpush": { /* Configurações Webpush, ex: fcm_options.link */ }
      }
    }
    ```

**Modificações no Service Worker (`src/lib/firebase/firebase-messaging-sw.js`):**

*   **Manipulador `messaging.onBackgroundMessage()` como Única Fonte de Exibição:**
    *   Este manipulador agora é o único responsável por processar a mensagem push recebida (que é uma mensagem de dados).
    *   Ele extrai `title`, `body`, `icon`, `data` (para o clique) e outras informações relevantes diretamente de `payload.data`.
    *   Em seguida, ele chama explicitamente `self.registration.showNotification(title, options)` para construir e exibir a notificação.
*   **Manipulador `self.addEventListener('push', ...)` Comentado:** O manipulador genérico `push` que foi adicionado para fins de depuração (e que poderia também causar duplicação se não coordenado com o SDK do Firebase) foi mantido comentado para evitar conflitos.

    Trecho relevante do `firebase-messaging-sw.js`:
    ```javascript
    messaging.onBackgroundMessage((payload) => {
      console.log('[SW - onBackgroundMessage] Mensagem de DADOS recebida. Payload:', JSON.stringify(payload));

      const title = payload.data?.title || 'Nova Notificação';
      const body = payload.data?.body || 'Você tem uma nova mensagem.';
      const icon = payload.data?.icon || '/icons/icon-192x192.png';
      const notificationData = payload.data || {}; 

      const options = {
        body: body,
        icon: icon,
        data: notificationData 
        // ... outras opções de notificação podem ser adicionadas aqui
      };

      console.log('[SW - onBackgroundMessage] Mostrando notificação construída a partir de DADOS. Título:', title, 'Opções:', JSON.stringify(options));
      self.registration.showNotification(title, options);
    });
    ```

## 5. Benefícios da Solução Implementada

*   **Eliminação da Duplicação:** Remove a ambiguidade sobre quem exibe a notificação.
*   **Controle Centralizado:** Todo o controle sobre a aparência e comportamento da notificação reside no código do Service Worker.
*   **Consistência:** Garante que as notificações tenham uma aparência consistente, pois são geradas por um único fluxo de código.
*   **Flexibilidade:** Permite customizações avançadas da notificação (ações, imagens, badges) diretamente no Service Worker.
*   **Depuração Simplificada:** Torna mais fácil rastrear problemas de exibição de notificações, pois o fluxo é explícito.
*   **Maior Robustez:** Menos suscetível a mudanças de comportamento em futuras atualizações do SDK do Firebase relacionadas ao tratamento automático de payloads `notification`.

## 6. Verificação e Resultados

Após a implementação das modificações e a limpeza completa do cache do navegador e do Service Worker antigo:
*   O sistema passou a enviar e exibir **apenas uma notificação push** por evento, como esperado.
*   Os logs confirmaram que apenas o manipulador `messaging.onBackgroundMessage` estava processando a mensagem de dados e exibindo a notificação.

Este documento serve como registro da análise e da solução aplicada para garantir a correta funcionalidade do sistema de notificações push. 