-- ATENÇÃO: Execute este script APENAS no seu banco de dados de STAGING.
-- Ele apagará TODOS os dados das tabelas listadas.
-- Use com cuidado antes de executar o seed.sql para garantir um estado limpo.

-- A ordem é importante para respeitar as chaves estrangeiras.

-- 1. Tabelas sem dependências de outras tabelas (ou com dependências que serão removidas primeiro)
DELETE FROM public.notifications;
DELETE FROM public.group_invites;
DELETE FROM public.event_attendees;

-- 2. Tabelas que são referenciadas pelas anteriores
DELETE FROM public.events;
DELETE FROM public.group_members;

-- 3. Tabelas que são referenciadas pelas anteriores
DELETE FROM public.groups;

-- 4. Tabela base de perfis (geralmente referenciada por muitas outras)
DELETE FROM public.profiles;

-- Fim do Script de Limpeza -- 