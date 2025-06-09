import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

console.log("Edge Function 'create-announcement-notification-entries' is up and running!");

interface AnnouncementWebhookPayload {
  type: "INSERT";
  table: string;
  record: {
    id: string; // announcement_id
    group_id: string;
    created_by: string; // author_id
    content: string; // Full content of the announcement
  };
  schema: string;
  old_record: null;
}

async function getGroupName(supabaseClient: SupabaseClient, groupId: string): Promise<string> {
  const { data, error } = await supabaseClient
    .from("groups")
    .select("name")
    .eq("id", groupId)
    .single();

  if (error) {
    console.error(`Error fetching group name for group_id ${groupId}:`, error.message);
    return "Nome do Grupo Indisponível"; // Fallback name
  }
  return data?.name || "Grupo Sem Nome";
}

async function getGroupMemberIds(supabaseClient: SupabaseClient, groupId: string, authorId: string): Promise<string[]> {
  const { data, error } = await supabaseClient
    .from("group_members")
    .select("user_id")
    .eq("group_id", groupId)
    .neq("user_id", authorId); // Exclude the author

  if (error) {
    console.error(`Error fetching members for group_id ${groupId}:`, error.message);
    return [];
  }
  return data ? data.map((member: { user_id: string }) => member.user_id) : [];
}

serve(async (req: Request) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error("Supabase URL or Service Role Key is not set.");
    return new Response(JSON.stringify({ error: "Supabase environment variables are not set." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey);
  const payload: AnnouncementWebhookPayload = await req.json();

  // Ensure it's an INSERT on group_announcements table
  if (payload.type !== "INSERT" || payload.table !== "group_announcements") {
    console.log("Webhook received for non-insert or non-group_announcements event. Skipping.");
    return new Response(JSON.stringify({ message: "Skipping event." }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { id: announcementId, group_id: groupId, created_by: authorId, content: announcementContent } = payload.record;

  try {
    const groupName = await getGroupName(supabaseClient, groupId);
    const memberIdsToNotify = await getGroupMemberIds(supabaseClient, groupId, authorId);

    if (memberIdsToNotify.length === 0) {
      console.log(`No members to notify for announcement ${announcementId} in group ${groupId}.`);
      return new Response(JSON.stringify({ message: "No members to notify." }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Create a concise message for the notification
    const notificationMessage = announcementContent.length > 100 
      ? announcementContent.substring(0, 97) + "..." 
      : announcementContent;

    const notificationEntries = memberIdsToNotify.map(userId => ({
      user_id: userId,
      title: `Novo Aviso em ${groupName}`,
      body: notificationMessage,
      type: "announcement" as any, // Cast as any if 'announcement' type is not yet in local TS types for Supabase
      related_group_id: groupId,
      related_event_id: null,
      actor_user_id: authorId,
      data: {
        announcement_id: announcementId,
        click_action: `/groups/${groupId}?tab=announcements&announcementId=${announcementId}`,
      },
    }));

    const { error: insertError } = await supabaseClient
      .from("notifications")
      .insert(notificationEntries);

    if (insertError) {
      console.error("Error inserting notification entries:", insertError.message);
      return new Response(JSON.stringify({ error: "Failed to insert notification entries.", details: insertError.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(`Successfully created ${notificationEntries.length} notification entries for announcement ${announcementId}.`);
    return new Response(JSON.stringify({ success: true, count: notificationEntries.length }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (e: any) {
    console.error("Error processing announcement webhook:", e.message);
    return new Response(JSON.stringify({ error: "Failed to process webhook.", details: e.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}); 