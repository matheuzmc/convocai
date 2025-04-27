-- Supabase Seed SQL
-- Use este script para popular seu banco de dados de staging com dados de teste.
-- Lembre-se de limpar as tabelas (DELETE FROM ...) antes de rodar o seed, se necessário.

-- === Perfis (Profiles) ===
-- Use UUIDs fixos para facilitar a referência. Substitua por UUIDs reais se necessário.
INSERT INTO public.profiles (id, name, last_name, nickname, avatar_url, updated_at) VALUES
('8f5a4f8e-eb1f-4c88-8b6b-17e6d1e3e091', 'Alice', 'Admin', 'AliceA', 'https://exemplo.com/avatar_alice.png', now()),
('b7d1c3a7-4e8a-4f2e-8a6d-3b9c1a5f7d2b', 'Bob', 'Membro', 'BobM', 'https://exemplo.com/avatar_bob.png', now()),
('c5e2b4a8-5f9b-4e3f-9b7e-4c0d2b6g8e3c', 'Charlie', 'Pendente', 'CharlieP', null, now()); -- Perfil sem avatar

-- === Grupos (Groups) ===
INSERT INTO public.groups (id, name, description, sport, image_url, created_by, updated_at) VALUES
('1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d', 'Futebol de Quinta', 'Grupo para organizar o futebol semanal às quintas-feiras.', 'futebol', 'https://exemplo.com/futebol_quinta.png', '8f5a4f8e-eb1f-4c88-8b6b-17e6d1e3e091', now()), -- Alice é a criadora
('e1f2a3b4-c5d6-e7f8-a9b0-c1d2e3f4a5b6', 'Basquete Fim de Semana', 'Jogos de basquete aos sábados ou domingos.', 'basquete', null, 'b7d1c3a7-4e8a-4f2e-8a6d-3b9c1a5f7d2b', now()); -- Bob é o criador, sem imagem

-- === Membros de Grupo (Group Members) ===
-- Alice é admin do grupo 'Futebol de Quinta'
INSERT INTO public.group_members (group_id, user_id, is_admin, joined_at, updated_at) VALUES
('1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d', '8f5a4f8e-eb1f-4c88-8b6b-17e6d1e3e091', true, now() - interval '10 days', now());
-- Bob é membro do grupo 'Futebol de Quinta'
INSERT INTO public.group_members (group_id, user_id, is_admin, joined_at, updated_at) VALUES
('1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d', 'b7d1c3a7-4e8a-4f2e-8a6d-3b9c1a5f7d2b', false, now() - interval '5 days', now());
-- Bob é admin do grupo 'Basquete Fim de Semana'
INSERT INTO public.group_members (group_id, user_id, is_admin, joined_at, updated_at) VALUES
('e1f2a3b4-c5d6-e7f8-a9b0-c1d2e3f4a5b6', 'b7d1c3a7-4e8a-4f2e-8a6d-3b9c1a5f7d2b', true, now() - interval '2 days', now());
-- Alice é membro do grupo 'Basquete Fim de Semana'
INSERT INTO public.group_members (group_id, user_id, is_admin, joined_at, updated_at) VALUES
('e1f2a3b4-c5d6-e7f8-a9b0-c1d2e3f4a5b6', '8f5a4f8e-eb1f-4c88-8b6b-17e6d1e3e091', false, now() - interval '1 day', now());

-- === Eventos (Events) ===
-- Evento passado (Futebol)
INSERT INTO public.events (id, group_id, title, description, location, event_date, event_time, is_periodic, frequency, notify_before, created_at, updated_at) VALUES
('f0e9d8c7-b6a5-f4e3-d2c1-b0a9f8e7d6c5', '1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d', 'Futebol da Semana Passada', 'Jogo na quadra coberta.', 'Quadra Coberta X', current_date - interval '7 days', '19:00:00', false, null, 1, now(), now());
-- Evento futuro (Futebol)
INSERT INTO public.events (id, group_id, title, description, location, event_date, event_time, is_periodic, frequency, notify_before, created_at, updated_at) VALUES
('a9b8c7d6-e5f4-a3b2-c1d0-e9f8a7b6c5d4', 'Futebol desta Quinta', 'Jogo na quadra descoberta.', 'Quadra Descoberta Y', current_date + interval '3 days', '20:00:00', true, 'weekly', 2, now(), now());
-- Evento futuro (Basquete)
INSERT INTO public.events (id, group_id, title, description, location, event_date, event_time, is_periodic, frequency, notify_before, created_at, updated_at) VALUES
('b8c7d6e5-f4a3-b2c1-d0e9-f8a7b6c5d4e3', 'Basquete no Sábado', 'Racha no parque.', 'Parque Central', current_date + interval '5 days', '10:00:00', false, null, 1, now(), now());

-- === Participantes de Evento (Event Attendees) ===
-- Evento passado (Futebol): Alice confirmou, Bob recusou
INSERT INTO public.event_attendees (event_id, user_id, status, updated_at) VALUES
('f0e9d8c7-b6a5-f4e3-d2c1-b0a9f8e7d6c5', '8f5a4f8e-eb1f-4c88-8b6b-17e6d1e3e091', 'confirmed', now());
INSERT INTO public.event_attendees (event_id, user_id, status, updated_at) VALUES
('f0e9d8c7-b6a5-f4e3-d2c1-b0a9f8e7d6c5', 'b7d1c3a7-4e8a-4f2e-8a6d-3b9c1a5f7d2b', 'declined', now());
-- Evento futuro (Futebol): Alice confirmou, Bob pendente
INSERT INTO public.event_attendees (event_id, user_id, status, updated_at) VALUES
('a9b8c7d6-e5f4-a3b2-c1d0-e9f8a7b6c5d4', '8f5a4f8e-eb1f-4c88-8b6b-17e6d1e3e091', 'confirmed', now());
INSERT INTO public.event_attendees (event_id, user_id, status, updated_at) VALUES
('a9b8c7d6-e5f4-a3b2-c1d0-e9f8a7b6c5d4', 'b7d1c3a7-4e8a-4f2e-8a6d-3b9c1a5f7d2b', 'pending', now());
-- Evento futuro (Basquete): Bob confirmou, Alice pendente
INSERT INTO public.event_attendees (event_id, user_id, status, updated_at) VALUES
('b8c7d6e5-f4a3-b2c1-d0e9-f8a7b6c5d4e3', 'b7d1c3a7-4e8a-4f2e-8a6d-3b9c1a5f7d2b', 'confirmed', now());
INSERT INTO public.event_attendees (event_id, user_id, status, updated_at) VALUES
('b8c7d6e5-f4a3-b2c1-d0e9-f8a7b6c5d4e3', '8f5a4f8e-eb1f-4c88-8b6b-17e6d1e3e091', 'pending', now());

-- === Convites de Grupo (Group Invites) ===
-- Convite pendente para Charlie entrar no grupo 'Futebol de Quinta'
INSERT INTO public.group_invites (group_id, inviter_id, invited_user_email, status, updated_at) VALUES
('1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d', '8f5a4f8e-eb1f-4c88-8b6b-17e6d1e3e091', 'charlie.teste@exemplo.com', 'pending', now());
-- Convite aceito (mas usuário ainda não é membro via seed - apenas para exemplo de invite)
INSERT INTO public.group_invites (group_id, inviter_id, invited_user_email, invited_user_id, status, updated_at) VALUES
('e1f2a3b4-c5d6-e7f8-a9b0-c1d2e3f4a5b6', 'b7d1c3a7-4e8a-4f2e-8a6d-3b9c1a5f7d2b', 'alice.teste@exemplo.com', '8f5a4f8e-eb1f-4c88-8b6b-17e6d1e3e091', 'accepted', now());

-- === Notificações (Notifications) ===
INSERT INTO public.notifications (user_id, type, title, message, read, created_at, updated_at) VALUES
('8f5a4f8e-eb1f-4c88-8b6b-17e6d1e3e091', 'info', 'Bem-vinda!', 'Seu perfil foi criado.', false, now(), now()),
('b7d1c3a7-4e8a-4f2e-8a6d-3b9c1a5f7d2b', 'success', 'Convite Enviado', 'Você convidou Alice para o grupo Basquete Fim de Semana.', true, now(), now());

-- Fim do Seed -- 