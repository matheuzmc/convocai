'use server'

import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
// import type { Database } from '@/lib/database.types' // Removido, pois não está sendo usado diretamente aqui
import { 
  triggerEventAttendanceConfirmedNotification,
  triggerEventAttendanceCancelledNotification,
  triggerEventDeletedNotification
} from '@/app/notifications/actions'
import { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies'

interface RespondToEventParams {
  eventId: string;
  status: 'confirmed' | 'declined';
}

export async function handleRespondToEventAction(
  params: RespondToEventParams
) {
  const { eventId, status } = params;
  const cookieStore = cookies() as unknown as ReadonlyRequestCookies
  const supabase = createClient(cookieStore)

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('User not authenticated for respondToEventAction', authError);
      return { error: 'Usuário não autenticado' };
    }
    const userId = user.id;

    // Lógica de upsert de event_attendees (similar à original respondToEvent)
    const { data: attendeeData, error: upsertError } = await supabase
      .from('event_attendees')
      .upsert(
        {
          event_id: eventId,
          user_id: userId,
          status: status,
          // A coluna 'joined_at' ou 'responded_at' pode ser atualizada aqui também se necessário
          // A trigger na DB já deve cuidar do updated_at
        },
        {
          onConflict: 'event_id, user_id', // Chave primária composta
        }
      )
      .select()
      .single(); // Esperamos um único resultado ou erro

    if (upsertError) {
      console.error(`Error in respondToEventAction for event ${eventId}, user ${userId}, status ${status}:`, upsertError);
      return { error: `Erro ao responder ao evento: ${upsertError.message}` };
    }

    if (!attendeeData) {
        console.error(`No data returned after upsert for event ${eventId}, user ${userId}`);
        return { error: 'Nenhum dado retornado após a operação no banco.' };
    }

    // Se a presença foi confirmada, disparar a notificação
    if (status === 'confirmed') {
      // O actorUserId é o próprio userId, pois ele está confirmando sua presença
      const notificationResult = await triggerEventAttendanceConfirmedNotification(
        eventId,
        userId, // attendeeUserId
        userId  // actorUserId
      );

      if (notificationResult?.error) {
        console.warn(`Notification for event attendance confirmation (event ${eventId}, user ${userId}) failed:`, notificationResult.error);
        // Não retornamos erro aqui, pois a ação principal (confirmar presença) foi bem-sucedida.
        // A falha na notificação é secundária e não deve impedir a UX principal.
      } else if (notificationResult?.success) {
        console.log(`Event attendance confirmation notification triggered for event ${eventId}, user ${userId}. Count: ${notificationResult.count}`);
      }
    }

    // Se a presença foi cancelada, disparar a notificação
    if (status === 'declined') {
      const notificationResult = await triggerEventAttendanceCancelledNotification(
        eventId,
        userId, // attendeeUserId
        userId  // actorUserId
      );

      if (notificationResult?.error) {
        console.warn(`Notification for event attendance cancellation (event ${eventId}, user ${userId}) failed:`, notificationResult.error);
        // Não retornamos erro aqui, pois a ação principal (cancelar presença) foi bem-sucedida.
      } else if (notificationResult?.success) {
        console.log(`Event attendance cancellation notification triggered for event ${eventId}, user ${userId}. Count: ${notificationResult.count}`);
      }
    }

    console.log(`User ${userId} successfully responded with ${status} to event ${eventId}`);
    return { success: true, data: attendeeData };

  } catch (e: unknown) {
    let errorMessage = 'Erro inesperado no servidor ao responder ao evento';
    if (e instanceof Error) {
      errorMessage = e.message;
    } else if (typeof e === 'string') {
      errorMessage = e;
    }
    console.error('Unexpected error in handleRespondToEventAction:', e);
    return { error: errorMessage };
  }
}

export async function handleDeleteEventAction(eventId: string) {
  const cookieStore = cookies() as unknown as ReadonlyRequestCookies
  const supabase = createClient(cookieStore)

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('User not authenticated for handleDeleteEventAction', authError);
      return { error: 'Usuário não autenticado' };
    }
    const actorUserId = user.id;

    // 1. Buscar detalhes do evento e verificar se o usuário é admin
    // Usaremos uma chamada RPC se disponível, ou múltiplas queries.
    // Por simplicidade aqui, faremos múltiplas queries, mas uma RPC seria melhor.

    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select('title, group_id')
      .eq('id', eventId)
      .single();

    if (eventError || !eventData) {
      console.error(`Error fetching event ${eventId} for deletion:`, eventError);
      return { error: 'Evento não encontrado ou erro ao buscar.' };
    }
    const { title: eventTitle, group_id: groupId } = eventData;

    if (!groupId) {
      console.error(`Event ${eventId} has no group_id, cannot verify admin status for deletion.`);
      return { error: 'Evento não associado a um grupo.' };
    }

    // Verificar se é admin do grupo
    const { data: groupMember, error: adminCheckError } = await supabase
      .from('group_members')
      .select('is_admin')
      .eq('group_id', groupId)
      .eq('user_id', actorUserId)
      .single();

    if (adminCheckError || !groupMember?.is_admin) {
      console.error(`User ${actorUserId} is not admin of group ${groupId} or error checking admin status:`, adminCheckError);
      return { error: 'Apenas administradores do grupo podem excluir eventos.' };
    }
    
    // Buscar nome do grupo para a notificação
    const { data: groupData, error: groupFetchError } = await supabase
        .from('groups')
        .select('name')
        .eq('id', groupId)
        .single();

    if (groupFetchError || !groupData) {
        console.warn(`Could not fetch group name for group ${groupId} during event deletion notification. Proceeding without it if necessary, or failing.`);
        // Dependendo da criticidade, pode-se falhar aqui ou prosseguir com um nome placeholder
        return { error: 'Nome do grupo não encontrado para notificação.' };
    }
    const groupName = groupData.name;

    // 2. Disparar notificação ANTES de deletar os dados
    const notificationResult = await triggerEventDeletedNotification(
      eventId,
      eventTitle || 'Evento Excluído', // Fallback para título do evento
      groupId,
      groupName || 'Grupo Desconhecido', // Fallback para nome do grupo
      actorUserId
    );

    if (notificationResult?.error) {
      console.warn(`Event deletion notification for event ${eventId} failed (but proceeding with deletion):`, notificationResult.error);
      // Não impedir a exclusão por falha na notificação, mas logar.
    } else if (notificationResult?.success) {
      console.log(`Event deletion notification triggered for event ${eventId}. Count: ${notificationResult.count}`);
    }

    // 3. Excluir participantes do evento (event_attendees)
    //    Isso deve ser feito antes de excluir o evento se houver FKs com ON DELETE RESTRICT
    //    ou para garantir limpeza. Se for ON DELETE CASCADE na DB, este passo é redundante mas seguro.
    const { error: deleteAttendeesError } = await supabase
      .from('event_attendees')
      .delete()
      .eq('event_id', eventId);

    if (deleteAttendeesError) {
      console.error(`Error deleting attendees for event ${eventId}:`, deleteAttendeesError);
      // Considerar se isso deve ser um erro fatal para a operação de exclusão do evento.
      // Por ora, vamos logar e continuar, pois a exclusão do evento principal é mais crítica.
    }

    // 4. Excluir o evento
    const { error: deleteEventError } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId);

    if (deleteEventError) {
      console.error(`Error deleting event ${eventId}:`, deleteEventError);
      return { error: `Erro ao excluir o evento: ${deleteEventError.message}` };
    }

    console.log(`Event ${eventId} and its attendees (if any) deleted successfully by user ${actorUserId}.`);
    return { success: true };

  } catch (e: unknown) {
    let errorMessage = 'Erro inesperado no servidor ao excluir o evento';
    if (e instanceof Error) {
      errorMessage = e.message;
    } else if (typeof e === 'string') {
      errorMessage = e;
    }
    console.error('Unexpected error in handleDeleteEventAction:', e);
    return { error: errorMessage };
  }
} 