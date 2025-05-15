-- Supabase Seed SQL (Versão Simplificada e Corrigida)

-- REMOVER TEMPORARIAMENTE A FOREIGN KEY CONSTRAINT
-- (Isso é necessário porque estamos inserindo IDs em public.profiles que podem ainda não existir em auth.users durante o seed local)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Limpando tabelas na ordem correta para evitar problemas de FK
DELETE FROM public.notifications;
DELETE FROM public.event_attendees;
DELETE FROM public.events;
DELETE FROM public.group_invites;
DELETE FROM public.group_members;
DELETE FROM public.groups;
DELETE FROM public.profiles;

-- === Perfis (Profiles) ===
-- (id, name, last_name, nickname, avatar_url, updated_at, fcm_tokens)
-- updated_at tem default, fcm_tokens pode ser null.
-- Assumindo que a coluna fcm_tokens já existe (foi criada via MCP anteriormente).
INSERT INTO public.profiles (id, name, last_name, nickname, phone_number, avatar_url) VALUES
('00000000-0000-0000-0000-000000000001', 'UserA', 'Test', 'TesterA', '111111111', 'https://example.com/avatarA.png'),
('00000000-0000-0000-0000-000000000002', 'UserB', 'Beta', 'TesterB', '222222222', null);

-- === Grupos (Groups) ===
-- (id, name, description, sport, image_url, created_by)
-- created_at, updated_at, is_active têm defaults.
INSERT INTO public.groups (id, name, description, sport, created_by) VALUES
('11111111-1111-1111-1111-111111111111', 'Grupo de Teste 1', 'Descrição do grupo 1', 'futebol', '00000000-0000-0000-0000-000000000001');

-- === Membros de Grupo (Group Members) ===
-- (group_id, user_id, is_admin)
-- joined_at tem default.
INSERT INTO public.group_members (group_id, user_id, is_admin) VALUES
('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', true),
('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000002', false);

-- === Eventos (Events) ===
-- (id, group_id, title, description, location, event_date, event_time)
-- is_periodic, frequency, notify_before, created_at, updated_at têm defaults ou são nullable.
INSERT INTO public.events (id, group_id, title, description, location, event_date, event_time) VALUES
('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Evento Teste 1', 'Descrição do evento 1', 'Local Teste', current_date + interval '7 days', '10:00:00');

-- === Participantes de Evento (Event Attendees) ===
-- (event_id, user_id, status)
-- updated_at tem default.
INSERT INTO public.event_attendees (event_id, user_id, status) VALUES
('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001', 'confirmed');

-- === Convites de Grupo (Group Invites) ===
-- (id, group_id, token, created_by, expires_at)
-- used_by, used_at são nullable, created_at tem default.
-- O token precisa ser único.
INSERT INTO public.group_invites (id, group_id, token, created_by, expires_at) VALUES
('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'unique_invite_token_123', '00000000-0000-0000-0000-000000000001', now() + interval '7 days');

-- === Notificações (Notifications) ===
-- (id, user_id, title, message, type, related_event_id, related_group_id)
-- is_read, created_at têm defaults.
INSERT INTO public.notifications (id, user_id, title, message, type, related_event_id) VALUES
('44444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000001', 'Notificação de Teste', 'Esta é uma notificação para UserA sobre o Evento Teste 1.', 'info', '22222222-2222-2222-2222-222222222222');

-- RECRIA A FOREIGN KEY CONSTRAINT (TEMPORARIAMENTE COMENTADO PARA TESTE)
-- ALTER TABLE public.profiles
--  ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users (id) ON DELETE CASCADE;

-- Fim do Seed -- 