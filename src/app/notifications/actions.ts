'use server'

import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/database.types'
import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies'

// Função para buscar o nome de um perfil
async function getProfileName(supabase: ReturnType<typeof createClient>, userId: string): Promise<string> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('name, nickname')
    .eq('id', userId)
    .single()

  if (error || !profile) {
    console.error(`Error fetching profile for ${userId}:`, error)
    return 'Membro Anônimo' // Fallback name
  }
  return profile.nickname || profile.name || 'Membro Anônimo'
}

export async function triggerNewGroupMemberNotification(
  groupId: string,
  newMemberId: string,
  actorUserId: string // Quem realizou a ação de adicionar (pode ser o próprio novo membro ou um admin)
) {
  const cookieStore = cookies() as unknown as ReadonlyRequestCookies
  const supabase = createClient(cookieStore)

  try {
    // 1. Buscar nome do grupo
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('name')
      .eq('id', groupId)
      .single()

    if (groupError || !group) {
      console.error(`Error fetching group ${groupId} for notification:`, groupError)
      return { error: 'Grupo não encontrado' }
    }
    const groupName = group.name

    // 2. Buscar nome do novo membro
    const newMemberName = await getProfileName(supabase, newMemberId)

    // 3. Buscar todos os OUTROS membros do grupo para notificar
    const { data: membersToNotify, error: membersError } = await supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupId)
      .neq('user_id', newMemberId) // Não notificar o próprio novo membro sobre sua entrada

    if (membersError) {
      console.error(`Error fetching members of group ${groupId}:`, membersError)
      return { error: 'Erro ao buscar membros do grupo' }
    }

    if (!membersToNotify || membersToNotify.length === 0) {
      console.log(`No other members in group ${groupId} to notify about new member ${newMemberId}`)
      return { message: 'Nenhum outro membro para notificar' }
    }

    // 4. Preparar e inserir notificações
    const notificationPayloads = membersToNotify.map(member => ({
      user_id: member.user_id,
      title: 'Novo Membro no Grupo!',
      message: `${newMemberName} entrou no grupo ${groupName}.`,
      type: 'info' as Database['public']['Enums']['notification_type'],
      related_group_id: groupId,
      related_event_id: null,
      actor_user_id: actorUserId, // Quem efetivamente causou a entrada do novo membro
    }))

    const { error: insertError } = await supabase
      .from('notifications')
      .insert(notificationPayloads)

    if (insertError) {
      console.error(`Error inserting new member notifications for group ${groupId}:`, insertError)
      return { error: 'Erro ao inserir notificações' }
    }

    console.log(`Successfully triggered ${notificationPayloads.length} new member notifications for group ${groupId}`)
    return { success: true, count: notificationPayloads.length }

  } catch (e: unknown) {
    let errorMessage = 'Erro inesperado no servidor';
    if (e instanceof Error) {
      errorMessage = e.message;
    } else if (typeof e === 'string') {
      errorMessage = e;
    }
    console.error('Unexpected error in triggerNewGroupMemberNotification:', e);
    return { error: errorMessage };
  }
}

export async function triggerGroupUpdateNotification(
  groupId: string,
  actorUserId: string,
  // changedFields: { field: string; oldValue: any; newValue: any }[] // Simplificado por enquanto
  changedFieldsSummary: string[] // Ex: ["nome", "descrição"]
) {
  const cookieStore = cookies() as unknown as ReadonlyRequestCookies
  const supabase = createClient(cookieStore)

  try {
    // 1. Buscar nome do grupo (poderia ser passado como argumento se já disponível)
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('name')
      .eq('id', groupId)
      .single()

    if (groupError || !group) {
      console.error(`Error fetching group ${groupId} for update notification:`, groupError)
      return { error: 'Grupo não encontrado' }
    }
    const groupName = group.name

    // 2. Buscar todos os OUTROS membros do grupo para notificar
    const { data: membersToNotify, error: membersError } = await supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupId)
      .neq('user_id', actorUserId) // Não notificar o próprio admin que fez a alteração

    if (membersError) {
      console.error(`Error fetching members for group update notification ${groupId}:`, membersError)
      return { error: 'Erro ao buscar membros do grupo' }
    }

    if (!membersToNotify || membersToNotify.length === 0) {
      console.log(`No other members in group ${groupId} to notify about group update.`)
      return { message: 'Nenhum outro membro para notificar' }
    }

    if (changedFieldsSummary.length === 0) {
        console.log("Nenhuma alteração relevante para notificar em triggerGroupUpdateNotification.");
        return { message: 'Nenhuma alteração para notificar.' };
    }

    const changesText = changedFieldsSummary.join(', ');
    const message = `O grupo ${groupName} teve ${changesText} alterado(s).`;
    const title = `Grupo Atualizado: ${groupName}`;

    // 4. Preparar e inserir notificações
    const notificationPayloads = membersToNotify.map(member => ({
      user_id: member.user_id,
      title: title,
      message: message,
      type: 'info' as Database['public']['Enums']['notification_type'],
      related_group_id: groupId,
      related_event_id: null,
      actor_user_id: actorUserId,
    }))

    const { error: insertError } = await supabase
      .from('notifications')
      .insert(notificationPayloads)

    if (insertError) {
      console.error(`Error inserting group update notifications for group ${groupId}:`, insertError)
      return { error: 'Erro ao inserir notificações' }
    }

    console.log(`Successfully triggered ${notificationPayloads.length} group update notifications for group ${groupId}`)
    return { success: true, count: notificationPayloads.length }

  } catch (e: unknown) {
    let errorMessage = 'Erro inesperado no servidor';
    if (e instanceof Error) {
      errorMessage = e.message;
    } else if (typeof e === 'string') {
      errorMessage = e;
    }
    console.error('Unexpected error in triggerGroupUpdateNotification:', e);
    return { error: errorMessage };
  }
}

export async function triggerNewEventNotification(
  groupId: string,
  eventId: string,
  eventTitle: string, // Passar o título do evento para evitar busca extra
  actorUserId: string
) {
  const cookieStore = cookies() as unknown as ReadonlyRequestCookies
  const supabase = createClient(cookieStore)

  try {
    // 1. Buscar nome do grupo (ainda necessário para a mensagem)
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('name')
      .eq('id', groupId)
      .single()

    if (groupError || !group) {
      console.error(`Error fetching group ${groupId} for new event notification:`, groupError)
      return { error: 'Grupo não encontrado' }
    }
    const groupName = group.name

    // 2. Buscar todos os membros do grupo para notificar
    const { data: membersToNotify, error: membersError } = await supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupId)
      .neq('user_id', actorUserId) // Excluir o próprio ator da notificação

    if (membersError) {
      console.error(`Error fetching members for new event notification (group ${groupId}):`, membersError)
      return { error: 'Erro ao buscar membros do grupo' }
    }

    if (!membersToNotify || membersToNotify.length === 0) {
      console.log(`No members in group ${groupId} to notify about new event ${eventId}`)
      return { message: 'Nenhum membro para notificar' }
    }

    const title = `Novo Evento: ${eventTitle}`;
    const message = `Um novo evento "${eventTitle}" foi criado no grupo ${groupName}.`;

    const notificationPayloads = membersToNotify.map(member => ({
      user_id: member.user_id,
      title: title,
      message: message,
      type: 'success' as Database['public']['Enums']['notification_type'],
      related_group_id: null,
      related_event_id: eventId,
      actor_user_id: actorUserId,
    }))

    const { error: insertError } = await supabase
      .from('notifications')
      .insert(notificationPayloads)

    if (insertError) {
      console.error(`Error inserting new event notifications for group ${groupId}, event ${eventId}:`, insertError)
      return { error: 'Erro ao inserir notificações' }
    }

    console.log(`Successfully triggered ${notificationPayloads.length} new event notifications for event ${eventId} in group ${groupId}`)
    return { success: true, count: notificationPayloads.length }

  } catch (e: unknown) {
    let errorMessage = 'Erro inesperado no servidor';
    if (e instanceof Error) {
      errorMessage = e.message;
    } else if (typeof e === 'string') {
      errorMessage = e;
    }
    console.error('Unexpected error in triggerNewEventNotification:', e);
    return { error: errorMessage };
  }
}

export async function triggerGroupDeletedNotification(
  groupId: string,
  groupName: string, // Passar o nome para evitar busca desnecessária antes da exclusão
  actorUserId: string
) {
  const cookieStore = cookies() as unknown as ReadonlyRequestCookies
  const supabase = createClient(cookieStore)

  try {
    // 1. Buscar todos os membros do grupo para notificar
    // É crucial fazer isso ANTES que o grupo e seus membros sejam excluídos.
    const { data: membersToNotify, error: membersError } = await supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupId)
      // .neq('user_id', actorUserId); // Opcional: notificar o admin que excluiu? Sim, notificar todos.

    if (membersError) {
      console.error(`Error fetching members for group deletion notification (group ${groupId}):`, membersError)
      // Não impedir a exclusão, mas logar o erro e retornar.
      return { error: 'Erro ao buscar membros do grupo para notificação.' }
    }

    if (!membersToNotify || membersToNotify.length === 0) {
      console.log(`No members found for group ${groupId} to notify about deletion.`)
      // Pode não haver membros ou o grupo já foi esvaziado, o que é ok.
      return { message: 'Nenhum membro para notificar sobre exclusão.' }
    }

    const title = `Grupo Excluído: ${groupName}`;
    const message = `O grupo "${groupName}" foi excluído.`;

    const notificationPayloads = membersToNotify.map(member => ({
      user_id: member.user_id,
      title: title,
      message: message,
      type: 'info' as Database['public']['Enums']['notification_type'],
      related_group_id: groupId,
      related_event_id: null,
      actor_user_id: actorUserId,
    }))

    const { error: insertError } = await supabase
      .from('notifications')
      .insert(notificationPayloads)

    if (insertError) {
      console.error(`Error inserting group deletion notifications for group ${groupId}:`, insertError)
      return { error: 'Erro ao inserir notificações de exclusão de grupo' }
    }

    console.log(`Successfully triggered ${notificationPayloads.length} group deletion notifications for group ${groupName} (ID: ${groupId})`)
    return { success: true, count: notificationPayloads.length }

  } catch (e: unknown) {
    let errorMessage = 'Erro inesperado no servidor ao notificar exclusão de grupo';
    if (e instanceof Error) {
      errorMessage = e.message;
    } else if (typeof e === 'string') {
      errorMessage = e;
    }
    console.error('Unexpected error in triggerGroupDeletedNotification:', e);
    return { error: errorMessage };
  }
}

export async function triggerEventUpdateNotification(
  eventId: string,
  actorUserId: string,
  changedFieldsSummary: string[] // Ex: ["data", "local"]
) {
  const cookieStore = cookies() as unknown as ReadonlyRequestCookies
  const supabase = createClient(cookieStore)

  try {
    // 1. Buscar detalhes do evento (título e group_id são necessários)
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('title, group_id') 
      .eq('id', eventId)
      .single()

    if (eventError || !event) {
      console.error(`Error fetching event ${eventId} for update notification:`, eventError)
      return { error: 'Evento não encontrado' }
    }
    const eventTitle = event.title;
    const groupId = event.group_id; // Essencial para o related_group_id na notificação

    if (!groupId) {
        console.error(`Event ${eventId} does not have a group_id. Cannot send notification.`);
        return { error: 'Evento sem group_id associado.' };
    }

    // 2. Buscar todos os participantes confirmados do evento
    const { data: attendees, error: attendeesError } = await supabase
      .from('event_attendees')
      .select('user_id')
      .eq('event_id', eventId)
      .eq('status', 'confirmed');

    if (attendeesError) {
      console.error(`Error fetching confirmed attendees for event ${eventId}:`, attendeesError)
      return { error: 'Erro ao buscar participantes confirmados' }
    }

    if (!attendees || attendees.length === 0) {
      console.log(`No confirmed attendees for event ${eventId} to notify.`)
      return { message: 'Nenhum participante confirmado para notificar' }
    }

    // Filtrar para não notificar o próprio ator da mudança, se ele for um participante confirmado
    const finalAttendeesToNotify = attendees.filter(att => att.user_id !== actorUserId);
    
    if (finalAttendeesToNotify.length === 0) {
        console.log(`Actor ${actorUserId} was the only confirmed attendee or no other confirmed attendees for event ${eventId}. No notification sent.`);
        return { message: 'Nenhum outro participante confirmado para notificar.' };
    }

    // 3. Verificar se houve campos relevantes alterados (já feito no lado cliente, mas bom ter um fallback)
    if (changedFieldsSummary.length === 0) {
        console.log("No relevant fields changed for event update notification.");
        return { message: 'Nenhuma alteração relevante para notificar.' };
    }

    const changesText = changedFieldsSummary.join(', ');
    const message = `O evento "${eventTitle}" teve ${changesText} alterado(s).`;
    const title = `Evento Atualizado: ${eventTitle}`;

    // 4. Preparar e inserir notificações
    const notificationPayloads = finalAttendeesToNotify.map(att => ({
      user_id: att.user_id,
      title: title,
      message: message,
      type: 'info' as Database['public']['Enums']['notification_type'],
      related_group_id: null,
      related_event_id: eventId,
      actor_user_id: actorUserId,
    }))

    const { error: insertError } = await supabase
      .from('notifications')
      .insert(notificationPayloads)

    if (insertError) {
      console.error(`Error inserting event update notifications for event ${eventId}:`, insertError)
      return { error: 'Erro ao inserir notificações' }
    }

    console.log(`Successfully triggered ${notificationPayloads.length} event update notifications for event ${eventId}`)
    return { success: true, count: notificationPayloads.length }

  } catch (e: unknown) {
    let errorMessage = 'Erro inesperado no servidor';
    if (e instanceof Error) {
      errorMessage = e.message;
    } else if (typeof e === 'string') {
      errorMessage = e;
    }
    console.error('Unexpected error in triggerEventUpdateNotification:', e);
    return { error: errorMessage };
  }
}

export async function triggerEventAttendanceConfirmedNotification(
  eventId: string,
  attendeeUserId: string, // Usuário que confirmou presença
  actorUserId: string // Usuário que disparou a ação (pode ser o mesmo que attendeeUserId)
) {
  const cookieStore = cookies() as unknown as ReadonlyRequestCookies
  const supabase = createClient(cookieStore)

  try {
    // 1. Buscar nome do perfil do participante
    const attendeeName = await getProfileName(supabase, attendeeUserId)

    // 2. Buscar detalhes do evento (título e group_id)
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('title, group_id')
      .eq('id', eventId)
      .single()

    if (eventError || !event) {
      console.error(`Error fetching event ${eventId} for attendance confirmation notification:`, eventError)
      return { error: 'Evento não encontrado' }
    }
    const eventTitle = event.title;
    const groupId = event.group_id;

    if (!groupId) {
      console.error(`Event ${eventId} does not have a group_id. Cannot send attendance notification.`);
      return { error: 'Evento sem group_id associado.' };
    }

    // 3. Buscar nome do grupo
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('name')
      .eq('id', groupId)
      .single()

    if (groupError || !group) {
      console.error(`Error fetching group ${groupId} for attendance notification:`, groupError)
      // Não é um erro crítico para a ação principal, mas impede a notificação completa
      return { error: 'Grupo não encontrado para o evento.' }
    }
    const groupName = group.name;

    // 4. Buscar administradores do grupo para notificar
    //    (excluindo o próprio participante se ele for admin e estiver confirmando a própria presença)
    const { data: admins, error: adminError } = await supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupId)
      .eq('is_admin', true)
      .neq('user_id', attendeeUserId) // Não notificar o participante se ele for admin

    if (adminError) {
      console.error(`Error fetching admins for group ${groupId}:`, adminError)
      return { error: 'Erro ao buscar administradores do grupo' }
    }

    if (!admins || admins.length === 0) {
      console.log(`No admins (excluding self) to notify for event attendance in group ${groupId} for event ${eventId}.`)
      return { message: 'Nenhum administrador para notificar (excluindo o próprio participante, se admin)' }
    }

    const title = `Presença Confirmada: ${eventTitle}`;
    const message = `${attendeeName} confirmou presença no evento "${eventTitle}" do grupo ${groupName}.`;

    // 5. Preparar e inserir notificações para os admins
    const notificationPayloads = admins.map(admin => ({
      user_id: admin.user_id,
      title: title,
      message: message,
      type: 'success' as Database['public']['Enums']['notification_type'],
      related_group_id: null,
      related_event_id: eventId,
      actor_user_id: actorUserId,
    }))

    const { error: insertError } = await supabase
      .from('notifications')
      .insert(notificationPayloads)

    if (insertError) {
      console.error(`Error inserting event attendance confirmed notifications for event ${eventId}:`, insertError)
      return { error: 'Erro ao inserir notificações de confirmação de presença' }
    }

    console.log(`Successfully triggered ${notificationPayloads.length} event attendance confirmed notifications for event ${eventId}`)
    return { success: true, count: notificationPayloads.length }

  } catch (e: unknown) {
    let errorMessage = 'Erro inesperado no servidor';
    if (e instanceof Error) {
      errorMessage = e.message;
    } else if (typeof e === 'string') {
      errorMessage = e;
    }
    console.error('Unexpected error in triggerEventAttendanceConfirmedNotification:', e);
    return { error: errorMessage };
  }
}

export async function triggerEventAttendanceCancelledNotification(
  eventId: string,
  attendeeUserId: string, // Usuário que cancelou presença
  actorUserId: string // Usuário que disparou a ação (pode ser o mesmo que attendeeUserId)
) {
  const cookieStore = cookies() as unknown as ReadonlyRequestCookies
  const supabase = createClient(cookieStore)

  try {
    // 1. Buscar nome do perfil do participante que cancelou
    const attendeeName = await getProfileName(supabase, attendeeUserId)

    // 2. Buscar detalhes do evento (título e group_id)
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('title, group_id')
      .eq('id', eventId)
      .single()

    if (eventError || !event) {
      console.error(`Error fetching event ${eventId} for attendance cancellation notification:`, eventError)
      return { error: 'Evento não encontrado' }
    }
    const eventTitle = event.title;
    const groupId = event.group_id;

    if (!groupId) {
      console.error(`Event ${eventId} does not have a group_id. Cannot send attendance cancellation notification.`);
      return { error: 'Evento sem group_id associado.' };
    }

    // 3. Buscar nome do grupo
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('name')
      .eq('id', groupId)
      .single()

    if (groupError || !group) {
      console.error(`Error fetching group ${groupId} for attendance cancellation notification:`, groupError)
      return { error: 'Grupo não encontrado para o evento.' }
    }
    const groupName = group.name;

    // 4. Buscar administradores do grupo para notificar
    //    (excluindo o próprio participante se ele for admin e estiver cancelando a própria presença)
    const { data: admins, error: adminError } = await supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupId)
      .eq('is_admin', true)
      .neq('user_id', attendeeUserId) // Não notificar o participante que cancelou se ele for admin

    if (adminError) {
      console.error(`Error fetching admins for group ${groupId} (cancellation):`, adminError)
      return { error: 'Erro ao buscar administradores do grupo' }
    }

    if (!admins || admins.length === 0) {
      console.log(`No admins (excluding self) to notify for event attendance cancellation in group ${groupId} for event ${eventId}.`)
      return { message: 'Nenhum administrador para notificar (excluindo o próprio participante, se admin)' }
    }

    const title = `Presença Cancelada: ${eventTitle}`;
    const message = `${attendeeName} cancelou a presença no evento "${eventTitle}" do grupo ${groupName}.`;

    // 5. Preparar e inserir notificações para os admins
    const notificationPayloads = admins.map(admin => ({
      user_id: admin.user_id,
      title: title,
      message: message,
      type: 'error' as Database['public']['Enums']['notification_type'],
      related_group_id: null,
      related_event_id: eventId,
      actor_user_id: actorUserId,
    }))

    const { error: insertError } = await supabase
      .from('notifications')
      .insert(notificationPayloads)

    if (insertError) {
      console.error(`Error inserting event attendance cancelled notifications for event ${eventId}:`, insertError)
      return { error: 'Erro ao inserir notificações de cancelamento de presença' }
    }

    console.log(`Successfully triggered ${notificationPayloads.length} event attendance cancelled notifications for event ${eventId}`)
    return { success: true, count: notificationPayloads.length }

  } catch (e: unknown) {
    let errorMessage = 'Erro inesperado no servidor ao notificar cancelamento de presença';
    if (e instanceof Error) {
      errorMessage = e.message;
    } else if (typeof e === 'string') {
      errorMessage = e;
    }
    console.error('Unexpected error in triggerEventAttendanceCancelledNotification:', e);
    return { error: errorMessage };
  }
}

export async function triggerEventDeletedNotification(
  eventId: string,
  eventTitle: string, // Passar para evitar busca desnecessária antes da exclusão
  groupId: string,   // Passar para evitar busca desnecessária
  groupName: string, // Passar para evitar busca desnecessária
  actorUserId: string
) {
  const cookieStore = cookies() as unknown as ReadonlyRequestCookies
  const supabase = createClient(cookieStore)

  try {
    // 1. Buscar todos os participantes confirmados do evento para notificar
    // É crucial fazer isso ANTES que o evento e seus participantes sejam excluídos.
    const { data: confirmedAttendees, error: attendeesError } = await supabase
      .from('event_attendees')
      .select('user_id')
      .eq('event_id', eventId)
      .eq('status', 'confirmed');

    if (attendeesError) {
      console.error(`Error fetching confirmed attendees for event deletion notification (event ${eventId}):`, attendeesError);
      // Não impedir a exclusão, mas logar o erro e retornar.
      return { error: 'Erro ao buscar participantes para notificação de exclusão.' };
    }

    const usersToNotify = new Set<string>();
    if (confirmedAttendees) {
      confirmedAttendees.forEach(att => usersToNotify.add(att.user_id));
    }

    // Opcional: Adicionar admins do grupo à lista de notificação, 
    // mesmo que não tenham confirmado presença (se desejado).
    // Por enquanto, vamos focar nos confirmados.

    // Remover o próprio ator da ação da lista, se ele estiver nela.
    usersToNotify.delete(actorUserId);

    if (usersToNotify.size === 0) {
      console.log(`No confirmed attendees (excluding actor) for event ${eventId} to notify about deletion.`);
      return { message: 'Nenhum participante confirmado (excluindo o ator) para notificar sobre exclusão.' };
    }

    const title = `Evento Cancelado: ${eventTitle}`;
    const message = `O evento "${eventTitle}" do grupo ${groupName} foi cancelado.`;

    const notificationPayloads = Array.from(usersToNotify).map(userId => ({
      user_id: userId,
      title: title,
      message: message,
      type: 'info' as Database['public']['Enums']['notification_type'],
      related_group_id: null,
      related_event_id: eventId,
      actor_user_id: actorUserId,
    }));

    if (notificationPayloads.length === 0) {
      console.log(`Zero notifications to send for event ${eventId} deletion after filtering.`);
      return { message: 'Nenhuma notificação a ser enviada após filtros.' };
    }

    const { error: insertError } = await supabase
      .from('notifications')
      .insert(notificationPayloads);

    if (insertError) {
      console.error(`Error inserting event deletion notifications for event ${eventId}:`, insertError);
      return { error: 'Erro ao inserir notificações de exclusão de evento' };
    }

    console.log(`Successfully triggered ${notificationPayloads.length} event deletion notifications for event ${eventTitle} (ID: ${eventId})`);
    return { success: true, count: notificationPayloads.length };

  } catch (e: unknown) {
    let errorMessage = 'Erro inesperado no servidor ao notificar exclusão de evento';
    if (e instanceof Error) {
      errorMessage = e.message;
    } else if (typeof e === 'string') {
      errorMessage = e;
    }
    console.error('Unexpected error in triggerEventDeletedNotification:', e);
    return { error: errorMessage };
  }
} 