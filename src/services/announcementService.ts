import { createClient } from "@/lib/supabase/client"; // Ajuste o caminho se necessário
import type { 
  GroupAnnouncement, 
  GroupAnnouncementFormData, 
  AnnouncementViewer, 
  ProfileMin 
} from "@/lib/types"; // Ajuste o caminho se necessário
import type { Database } from "@/lib/database.types"; // Ajuste o caminho se necessário

const supabase = createClient();

/**
 * Fetches all announcements for a given group, ordered by pinned status and then by creation date.
 * Populates creator profile information.
 */
export const getGroupAnnouncements = async (groupId: string): Promise<GroupAnnouncement[]> => {
  if (!groupId) throw new Error("Group ID is required to fetch announcements.");

  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

  if (authError || !authUser) {
    console.warn("User not authenticated, cannot fetch read status. Returning announcements without it.", authError?.message);
    // Fallback: buscar sem status de leitura ou retornar vazio/erro específico?
    // Por ora, vamos tentar buscar e deixar currentUserHasRead como indefinido ou falso.
    // Ou, se a RPC *sempre* requer p_user_id, esta chamada falhará ou precisaremos de uma RPC alternativa.
    // A melhor abordagem aqui é lançar um erro se o user_id é mandatório para a RPC.
    // Como a RPC agora *requer* p_user_id, não podemos chamá-la sem ele.
    // Se um usuário não autenticado puder ver avisos, eles verão todos como não lidos.
    // Vamos assumir que para esta função, o usuário DEVE estar logado para obter o status.
    throw new Error("User not authenticated. Cannot determine read status for announcements.");
  }

  console.log(`[AnnouncementService DEBUG] Calling RPC with p_group_id: ${groupId}, p_user_id: ${authUser.id}`);

  const { data, error } = await supabase.rpc('get_group_announcements_with_read_status', { 
    p_group_id: groupId, 
    p_user_id: authUser.id // Passando o ID do usuário autenticado
  });

  if (error) {
    console.error("Error fetching group announcements via RPC:", error.message);
    throw error;
  }

  if (!data) return [];

  // Mapeia para o tipo GroupAnnouncement
  return data.map(item => ({
    id: item.id,
    group_id: item.group_id,
    created_by_user_id: item.created_by_user_id,
    created_by_profile: {
      id: item.creator_profile_id,
      name: item.creator_profile_name,
      avatar_url: item.creator_profile_avatar_url,
    } as ProfileMin,
    content: item.content,
    is_pinned: item.is_pinned,
    created_at: item.created_at,
    updated_at: item.updated_at,
    currentUserHasRead: item.current_user_has_read,
  })) as GroupAnnouncement[];
};

/**
 * Creates a new group announcement.
 */
export const createGroupAnnouncement = async (groupId: string, formData: GroupAnnouncementFormData): Promise<GroupAnnouncement> => {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    console.error("User not authenticated for createGroupAnnouncement", authError);
    throw new Error("User not authenticated");
  }

  const { content, is_pinned } = formData;

  const { data: newAnnouncement, error: insertError } = await supabase
    .from("group_announcements")
    .insert({
      group_id: groupId,
      created_by: user.id,
      content,
      is_pinned: is_pinned ?? false,
    })
    .select(`
      id,
      group_id,
      created_by_user_id: created_by,
      created_by_profile: profiles!created_by ( id, name, avatar_url ),
      content,
      is_pinned,
      created_at,
      updated_at
    `)
    .single();

  if (insertError) {
    console.error("Error creating group announcement:", insertError.message);
    throw insertError;
  }
  
  return {
    ...newAnnouncement,
    created_by_profile: newAnnouncement.created_by_profile as ProfileMin ?? null
  } as GroupAnnouncement;
};

/**
 * Updates an existing group announcement.
 */
export const updateGroupAnnouncement = async (announcementId: string, formData: Partial<GroupAnnouncementFormData>): Promise<GroupAnnouncement> => {
  const { content, is_pinned } = formData;
  const updatePayload: Partial<Database["public"]["Tables"]["group_announcements"]["Row"]> = {};

  if (content !== undefined) updatePayload.content = content;
  if (is_pinned !== undefined) updatePayload.is_pinned = is_pinned;
  
  if (Object.keys(updatePayload).length === 0) {
    // Se não há nada para atualizar, busca e retorna o anúncio existente
    const { data: existingAnnouncement, error: fetchError } = await supabase
      .from("group_announcements")
      .select(`
        id,
        group_id,
        created_by_user_id: created_by,
        created_by_profile: profiles!created_by ( id, name, avatar_url ),
        content,
        is_pinned,
        created_at,
        updated_at
      `)
      .eq("id", announcementId)
      .single();
    if (fetchError) {
      console.error("Error fetching announcement during no-op update:", fetchError.message);
      throw fetchError;
    }
     return {
      ...existingAnnouncement,
      created_by_profile: existingAnnouncement.created_by_profile as ProfileMin ?? null
    } as GroupAnnouncement;
  }

  updatePayload.updated_at = new Date().toISOString(); // Atualiza manualmente updated_at

  const { data: updatedAnnouncement, error: updateError } = await supabase
    .from("group_announcements")
    .update(updatePayload)
    .eq("id", announcementId)
    .select(`
      id,
      group_id,
      created_by_user_id: created_by,
      created_by_profile: profiles!created_by ( id, name, avatar_url ),
      content,
      is_pinned,
      created_at,
      updated_at
    `)
    .single();

  if (updateError) {
    console.error("Error updating group announcement:", updateError.message);
    throw updateError;
  }

  return {
    ...updatedAnnouncement,
    created_by_profile: updatedAnnouncement.created_by_profile as ProfileMin ?? null
  } as GroupAnnouncement;
};

/**
 * Deletes a group announcement.
 */
export const deleteGroupAnnouncement = async (announcementId: string): Promise<void> => {
  const { error } = await supabase
    .from("group_announcements")
    .delete()
    .eq("id", announcementId);

  if (error) {
    console.error("Error deleting group announcement:", error.message);
    throw error;
  }
};

/**
 * Fetches users who have read a specific announcement.
 */
export const getAnnouncementViewers = async (announcementId: string): Promise<AnnouncementViewer[]> => {
  const { data, error } = await supabase
    .from("announcement_read_receipts")
    .select(`
      user_id,
      read_at,
      profile: profiles!user_id ( id, name, avatar_url )
    `)
    .eq("announcement_id", announcementId)
    .order("read_at", { ascending: true });

  if (error) {
    console.error("Error fetching announcement viewers:", error.message);
    throw error;
  }
  // Mapeia para o tipo AnnouncementViewer, garantindo que profile seja null se não encontrado
  return data.map(item => ({
    user_id: item.user_id,
    read_at: item.read_at,
    profile: item.profile as ProfileMin ?? null
  })) as AnnouncementViewer[];
};

/**
 * Marks an announcement as read by the current user.
 * Inserts a record into announcement_read_receipts.
 * If the record already exists (user already read), RLS or DB constraints should prevent duplicates.
 */
export const markAnnouncementAsRead = async (announcementId: string): Promise<void> => {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    // Não lança erro, mas loga. A leitura pode ser opcional ou não crítica.
    console.warn("User not authenticated for markAnnouncementAsRead. Skipping.", authError?.message);
    return;
  }

  const { error: insertError } = await supabase
    .from("announcement_read_receipts")
    .insert({
      announcement_id: announcementId,
      user_id: user.id,
      // read_at is defaulted by the database
    });
    // .upsert({ announcement_id: announcementId, user_id: user.id }, { onConflict: 'announcement_id,user_id' }); // Alternativa se quiser garantir

  if (insertError) {
    // Não relançar o erro como crítico, pois pode ser uma tentativa de inserir duplicata (RLS/PK violation), o que é ok.
    // Apenas logar se for um erro diferente de violação de PK/FK ou RLS.
    // Códigos de erro comuns: '23505' (unique_violation), '23503' (foreign_key_violation)
    if (insertError.code !== '23505' && insertError.code !== '23503') {
        console.warn("Error marking announcement as read (but not a PK/FK violation):", insertError.message);
    } else {
        // console.log("Announcement likely already marked as read or RLS prevented insert, which is fine.");
    }
  }
};

/**
 * Toggles the pinned status of a group announcement.
 */
export const togglePinAnnouncement = async (announcementId: string, currentIsPinned: boolean): Promise<GroupAnnouncement> => {
  const { data: updatedAnnouncement, error } = await supabase
    .from("group_announcements")
    .update({ 
      is_pinned: !currentIsPinned, 
      updated_at: new Date().toISOString()
    })
    .eq("id", announcementId)
    .select(`
      id,
      group_id,
      created_by_user_id: created_by,
      created_by_profile: profiles!created_by ( id, name, avatar_url ),
      content,
      is_pinned,
      created_at,
      updated_at
    `)
    .single();

  if (error) {
    console.error("Error toggling pin status for announcement:", error.message);
    throw error;
  }

  return {
    ...updatedAnnouncement,
    created_by_profile: updatedAnnouncement.created_by_profile as ProfileMin ?? null
  } as GroupAnnouncement;
}; 