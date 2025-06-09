# Plano de Implementação: Mural de Avisos do Grupo

**ID do Projeto Supabase Staging:** `zcjmpmsrtyfpzculvujz`

## 1. Backend (Supabase)

### 1.1. Novas Tabelas

#### Tabela `group_announcements`
- `id`: `UUID` (Chave Primária, default: `gen_random_uuid()`)
- `group_id`: `UUID` (Chave Estrangeira para `groups.id`, não nulo)
- `created_by`: `UUID` (Chave Estrangeira para `profiles.id` via `auth.users.id`, não nulo - o admin que criou)
- `content`: `TEXT` (Conteúdo do aviso, não nulo)
- `is_pinned`: `BOOLEAN` (Default: `false`, não nulo)
- `created_at`: `TIMESTAMPTZ` (Default: `now()`, não nulo)
- `updated_at`: `TIMESTAMPTZ` (Default: `now()`, não nulo)
- *Índices:* `group_id`, (`group_id`, `is_pinned`, `created_at` DESC)

#### Tabela `announcement_read_receipts`
- `announcement_id`: `UUID` (Chave Estrangeira para `group_announcements.id`, não nulo)
- `user_id`: `UUID` (Chave Estrangeira para `profiles.id` via `auth.users.id`, não nulo)
- `read_at`: `TIMESTAMPTZ` (Default: `now()`, não nulo)
- *Chave Primária Composta:* (`announcement_id`, `user_id`)
- *Índices:* `user_id`

### 1.2. Políticas de Row Level Security (RLS)

#### Para `group_announcements`
- `SELECT`: Permitir para membros do grupo (`EXISTS (SELECT 1 FROM public.group_members WHERE group_id = group_announcements.group_id AND user_id = auth.uid())`).
- `INSERT`: Permitir para administradores do grupo (`EXISTS (SELECT 1 FROM public.group_members WHERE group_id = group_announcements.group_id AND user_id = auth.uid() AND is_admin = TRUE)`). O `created_by` deve ser `auth.uid()`.
- `UPDATE`: Permitir para o criador do aviso ou administradores do grupo (`(created_by = auth.uid() OR EXISTS (SELECT 1 FROM public.group_members WHERE group_id = group_announcements.group_id AND user_id = auth.uid() AND is_admin = TRUE))`).
- `DELETE`: Permitir para o criador do aviso ou administradores do grupo (mesma lógica do `UPDATE`).

#### Para `announcement_read_receipts`
- `SELECT`: Permitir para administradores do grupo do aviso correspondente (`EXISTS (SELECT 1 FROM public.group_announcements ga JOIN public.group_members gm ON ga.group_id = gm.group_id WHERE ga.id = announcement_read_receipts.announcement_id AND gm.user_id = auth.uid() AND gm.is_admin = TRUE)`).
- `INSERT`: Permitir para o próprio usuário se ele for membro do grupo do aviso (`user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.group_announcements ga JOIN public.group_members gm ON ga.group_id = gm.group_id WHERE ga.id = announcement_read_receipts.announcement_id AND gm.user_id = auth.uid())`).

### 1.3. Lógica de Notificação de Novos Avisos

- **Objetivo:** Quando um novo aviso é criado, todos os membros do grupo (exceto o autor) devem receber uma notificação push e um registro na tabela `notifications`.
- **Mecanismo:**
    1.  **Criação de Entradas na Tabela `notifications` (Nova Lógica):**
        *   **Trigger:** Um Database Webhook será configurado na tabela `group_announcements` para disparar no evento `INSERT`.
        *   **Ação do Webhook:** Este webhook chamará uma nova e simples **Supabase Edge Function**, nomeada, por exemplo, `create-announcement-notification-entries`.
        *   **Lógica da Edge Function `create-announcement-notification-entries`:**
            a.  Recebe o payload do webhook (que inclui os dados do novo aviso: `id`, `group_id`, `created_by`, `content`).
            b.  Busca o nome do grupo (`groups.name`) usando o `group_id`.
            c.  Busca todos os `user_id` dos membros do `group_id` (da tabela `group_members`), exceto o `created_by` (autor do aviso).
            d.  Para cada `user_id` de membro elegível, a função insere um novo registro na tabela `public.notifications` com os seguintes campos:
                *   `user_id`: O ID do membro a ser notificado.
                *   `title`: "Novo Aviso em [Nome do Grupo]".
                *   `message`: Um trecho do `group_announcements.content` (ex: primeiras 100-150 caracteres).
                *   `type`: Sugestão: Adicionar um novo valor `'announcement'` ao ENUM `notification_type`. Se não, usar `'info'`.
                *   `related_group_id`: O `group_id` do aviso.
                *   `related_event_id`: `null`.
                *   `actor_user_id`: O `created_by` (autor do aviso).
                *   `data`: `JSONB` contendo `{ "announcement_id": "ID_DO_NOVO_AVISO", "click_action": "/groups/ID_DO_GRUPO?tab=announcements&announcementId=ID_DO_NOVO_AVISO" }`. Este `click_action` será usado pela Edge Function existente para o deep linking.
    2.  **Envio de Notificações Push (Edge Function Existente):**
        *   A sua Edge Function existente (`supabase/functions/send-push-notification/index.ts`) já é acionada por inserts na tabela `notifications`.
        *   Ela pegará cada novo registro criado pela `create-announcement-notification-entries`, buscará os `fcm_tokens` do `user_id` correspondente e enviará a notificação push.
        *   É importante que a `send-push-notification/index.ts` utilize o campo `data.click_action` (ou `data.url` se ela já estiver preparada para isso) do registro da notificação para definir o comportamento de clique da notificação push, levando o usuário para o aviso específico.

### 1.4. Migrations
- Criar um novo arquivo de migração SQL em `supabase/migrations/` para aplicar as criações de tabelas, RLS e a configuração do trigger/webhook para a Edge Function.

## 2. Frontend (Next.js/React)

### 2.1. Tipos (ex: `src/lib/types.ts` ou `src/types/index.ts`)
- `GroupAnnouncement`: Incluir `id`, `groupId`, `createdBy` (com nome e avatar do perfil), `content`, `isPinned`, `createdAt`, `updatedAt`.
- `AnnouncementViewer`: Incluir `userId`, `name`, `avatar`, `readAt`.

### 2.2. Serviços de API (ex: `src/services/announcementService.ts` ou adicionar em `src/services/api.ts`)
- `getGroupAnnouncements(groupId: string): Promise<GroupAnnouncement[]>`
- `createGroupAnnouncement(data: { groupId: string; content: string; isPinned?: boolean }): Promise<GroupAnnouncement>`
- `updateGroupAnnouncement(announcementId: string, data: { content?: string; isPinned?: boolean }): Promise<GroupAnnouncement>`
- `deleteGroupAnnouncement(announcementId: string): Promise<void>`
- `getAnnouncementViewers(announcementId: string): Promise<AnnouncementViewer[]>`
- `markAnnouncementAsRead(announcementId: string): Promise<void>`

### 2.3. Componentes de UI

- **Modificações em `src/app/groups/[id]/page.tsx`:**
    - Atualizar `Tabs` para: `Eventos`, `Avisos`, `Membros`.
    - Adicionar ícone ℹ️ ao lado do título do grupo.
    - Implementar `GroupInfoModal.tsx` (ou `Sheet`) para exibir detalhes do grupo (descrição, esporte, etc.) ao clicar no ℹ️.
- **Novo Componente `AnnouncementsTabContent.tsx` (ou similar):**
    - Usado dentro da aba "Avisos".
    - Props: `groupId`, `isAdmin`.
    - Fetch de dados: `useQuery(['groupAnnouncements', groupId], () => getGroupAnnouncements(groupId))`.
    - Renderiza `AnnouncementsList.tsx`.
    - Se `isAdmin`, mostra botão (FAB ou no header da lista) para abrir `CreateAnnouncementModal.tsx`.
- **Novo Componente `AnnouncementsList.tsx`:**
    - Props: `announcements: GroupAnnouncement[]`, `isAdmin: boolean`, `groupId: string`.
    - Ordena avisos: Fixados primeiro, depois por `createdAt` DESC.
    - Renderiza uma lista de `AnnouncementCard.tsx`.
- **Novo Componente `AnnouncementCard.tsx`:**
    - Props: `announcement: GroupAnnouncement`, `isAdmin: boolean`, `currentUserId: string`.
    - Exibe:
        - Avatar e nome do `createdBy`.
        - Data e hora da postagem (Formato: DD/MM/YYYY HH:mm).
        - Ícone de aviso (ex: 💬).
        - Ícone/destaque se `isPinned` (ex: 📌).
        - Conteúdo do aviso (com "ver mais" se necessário).
    - Se `isAdmin`:
        - Botão/link "X Visualizações" (abre `ViewersModal.tsx`).
        - Dropdown/menu com opções: "Fixar/Desafixar", "Editar" (abre `EditAnnouncementModal.tsx`), "Excluir" (com confirmação).
    - Lógica `useEffect` com `IntersectionObserver` para chamar `markAnnouncementAsRead(announcement.id)` quando o card se torna visível para o `currentUserId` (apenas se ele não for o autor e ainda não marcou como lido).
- **Novo Componente `CreateAnnouncementModal.tsx`:**
    - Props: `groupId`, `isOpen`, `onClose`.
    - Formulário com `Textarea` para `content` e `Checkbox` para `isPinned`.
    - Chama `createGroupAnnouncement` ao submeter.
- **Novo Componente `EditAnnouncementModal.tsx`:**
    - Props: `announcement: GroupAnnouncement`, `isOpen`, `onClose`.
    - Similar ao de criação, pré-preenchido.
    - Chama `updateGroupAnnouncement` ao submeter.
- **Novo Componente `ViewersModal.tsx`:**
    - Props: `announcementId`, `isOpen`, `onClose`.
    - Fetch de dados: `useQuery(['announcementViewers', announcementId], () => getAnnouncementViewers(announcementId))`.
    - Lista `AnnouncementViewer` (avatar, nome, `readAt`).

### 2.4. Lógica de Notificação e Navegação
- No cliente de notificações (onde as push são recebidas): se a notificação tiver `data.announcement_id` e `data.navigate_to`, ao ser clicada, usar o router do Next.js para navegar para a aba de avisos do grupo correto.

## 3. Análise de Escalabilidade e Manutenibilidade

- **Escalabilidade:**
    - A separação das tabelas `group_announcements` e `announcement_read_receipts` é positiva. A tabela `announcement_read_receipts` pode crescer consideravelmente. Índices bem definidos são cruciais. Para grupos extremamente grandes, poderia ser necessário paginação nas visualizações ou arquivamento de recibos antigos.
    - Supabase Edge Functions para notificações são escaláveis.
    - Consultas frontend (`getGroupAnnouncements`) devem considerar paginação se o volume de avisos for alto.
- **Manutenibilidade:**
    - Serviços dedicados (`announcementService.ts`) e componentes de UI bem definidos promovem boa organização.
    - Reutilização da infraestrutura de autenticação e papéis existente.
    - Tipos TypeScript (`GroupAnnouncement`, `AnnouncementViewer`) ajudam na consistência.
    - Centralizar lógica de dados nos serviços de API torna o frontend mais limpo.

## 4. Próximos Passos Sugeridos (Pós-MVP)
1.  **Editor de Texto Rico:** Permitir formatação básica nos avisos.
2.  **Contador de Avisos Não Lidos:** Badge na aba "Avisos".
3.  **Notificações In-App Detalhadas.**
4.  **Reações a Avisos.**
5.  **Agendamento de Avisos.**

## 5. Cronograma Estimado (Fases)
- **Fase 1: Backend (Supabase)**
    - Criação das tabelas e RLS.
    - Desenvolvimento e deploy da Edge Function para notificações.
    - Criação e aplicação das migrations.
- **Fase 2: Frontend (API e Tipos)**
    - Definição dos tipos.
    - Implementação das funções de serviço da API.
- **Fase 3: Frontend (Componentes de UI - Leitura)**
    - Modificação da página de detalhes do grupo (abas, ícone "Sobre").
    - Implementação de `AnnouncementsTabContent`, `AnnouncementsList`, `AnnouncementCard` (sem ações de admin ainda, apenas exibição).
    - Implementação de `ViewersModal` (apenas visualização para admin).
    - Lógica de `markAnnouncementAsRead`.
- **Fase 4: Frontend (Componentes de UI - Ações de Admin)**
    - Implementação de `CreateAnnouncementModal`, `EditAnnouncementModal`.
    - Adição dos botões de ação (criar, editar, excluir, fixar) no `AnnouncementCard` para admins.
- **Fase 5: Testes e Refinamentos**
    - Testes end-to-end.
    - Ajustes de UI/UX.
    - Verificação da lógica de notificações. 