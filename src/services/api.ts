"use client"

import { createClient } from '@/lib/supabase/client';
import { User, Group, Event, Notification, SportType, AttendeeWithProfile, GroupMemberWithProfile } from "@/lib/types";
// Descomentar Json
import type { Database, Json, TablesUpdate } from "@/lib/database.types.ts";
import crypto from 'crypto';

// Define Row types for easier use -- Removing unused types
// type ProfileRow = Database['public']['Tables']['profiles']['Row'];
// type GroupRow = Database['public']['Tables']['groups']['Row'];
// type EventRow = Database['public']['Tables']['events']['Row'];
// type NotificationRow = Database['public']['Tables']['notifications']['Row'];
// type EventAttendeeRow = Database['public']['Tables']['event_attendees']['Row'];

// Define Attendee Status type based on DB Enum
// type AttendeeStatus = Database['public']['Enums']['event_attendee_status'];

// Import the correct Row type
type EventAttendeeRow = Database['public']['Tables']['event_attendees']['Row'];

// Interface matching the UserProfile type in profile page
export interface UserProfileData {
  id: string;
  name: string | null;
  lastName: string | null;
  nickname: string | null;
  avatar_url: string | null;
  is_premium: boolean;
  sport_preferences: { sport: SportType; position: string }[] | null;
  phone_number: string | null;
}

// Explicitly type the results from Supabase queries where needed
// Example for getUserGroups
type GroupMemberCount = { count: number };
type GroupRowWithCount = Database['public']['Tables']['groups']['Row'] & {
    group_members: GroupMemberCount[] | null;
    is_active: boolean;
};
type GroupMemberEntry = {
    group_id: string;
};

// Example for getUpcomingEvents
type AttendeeRow = Database['public']['Tables']['event_attendees']['Row'];
type EventRowWithAttendees = Database['public']['Tables']['events']['Row'] & {
    event_attendees: Pick<AttendeeRow, 'user_id' | 'status'>[] | null;
};

// Example for getGroupDetails
type ProfileRowForMember = Pick<Database['public']['Tables']['profiles']['Row'], 'id' | 'name' | 'last_name' | 'nickname' | 'avatar_url'>;
type MemberWithProfile = Database['public']['Tables']['group_members']['Row'] & {
    profiles: ProfileRowForMember | null;
};

// Definir tipos auxiliares usando Database (mover para cima se necessário)
// Comment out unused helper types
// type EventRow = Database['public']['Tables']['events']['Row'];
// type GroupRowBasic = Pick<Database['public']['Tables']['groups']['Row'], 'id' | 'name' | 'image_url'>;
// type ProfileRowBasic = Pick<Database['public']['Tables']['profiles']['Row'], 'id' | 'name' | 'avatar_url'>;

// type AttendeeRowWithProfile = AttendeeRow & {
//   profiles: ProfileRowBasic | null;
// };

// Adicionar tipo explícito para a linha completa de 'profiles'
type ProfileRowComplete = Database['public']['Tables']['profiles']['Row']; 

// Type matching the JSON structure returned by the new SQL function
export interface EventDetailsRpcResponse {
  event: Omit<Event, 'attendees'>; // Event details without attendees array
  group: {
    id: string;
    name: string;
    image_url: string | null;
  };
  attendees: AttendeeWithProfile[];
  isAdmin: boolean; // Garantir que está aqui
}

// --- Helper: Get Authenticated Supabase Client --- 
async function getAuthenticatedSupabaseClient() {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        console.error("User not authenticated");
        throw new Error("User not authenticated"); 
    }
    return { supabase, user };
}

/**
 * Fetches the profile data for the currently authenticated user.
 * 
 * @returns {Promise<User | null>} The user profile data or null if not logged in or profile not found.
 */
export const getCurrentUserProfile = async (): Promise<User | null> => {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError) {
    console.error("Error fetching user session:", authError);
    return null;
  }

  if (!user) {
    // No user is logged in
    // console.log("No user session found.");
    return null;
  }

  // 2. Fetch the corresponding profile from the 'profiles' table
  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles') // Make sure 'profiles' is the correct table name
      .select(`
        id,
        name,
        last_name,
        avatar_url,
        is_premium,
        sport_preferences
      `)
      .eq('id', user.id)
      .single(); // Expecting a single profile row

    if (profileError) {
      if (profileError.code === 'PGRST116') {
        // PGRST116: The result contains 0 rows
        console.warn(`Profile not found for user ID: ${user.id}. A profile should be created automatically on signup.`);
      } else {
        console.error("Error fetching profile:", profileError);
      }
      return null;
    }

    if (!profile) {
       console.warn(`Profile data is unexpectedly null for user ID: ${user.id}`);
       return null;
    }

    // 3. Map the profile data to our User type
    // Note: We assume the DB schema aligns well with the User type.
    // Adjust mapping if necessary.
    // Now Supabase infers the type of 'profile'
    const userProfile: User = {
      id: profile.id,
      name: profile.name,
      lastName: profile.last_name,
      email: user.email || '', 
      avatar: profile.avatar_url || '', 
      isPremium: profile.is_premium,
      groups: [], 
      createdGroups: [], 
      sportPreferences: (profile.sport_preferences as User['sportPreferences']) || [],
    };

    return userProfile;

  } catch (error) {
    console.error("An unexpected error occurred fetching the profile:", error);
    return null;
  }
};

// --- Add other API functions below --- 

/**
 * Fetches the groups the currently authenticated user is a member of.
 * 
 * @returns {Promise<Group[]>} A list of groups the user belongs to.
 * @throws {Error} If the user is not authenticated or if there's a DB error.
 */
export const getUserGroups = async (): Promise<Group[]> => {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");

  // Specify type for memberEntries
  const { data: memberEntries, error: memberError } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', user.id);
    
  if (memberError) throw memberError;
  if (!memberEntries) return [];

  const groupIds = (memberEntries as GroupMemberEntry[]).map(entry => entry.group_id);
  if (groupIds.length === 0) return [];

  const { data: groupsData, error: groupsError } = await supabase
    .from('groups')
    .select('*, is_active, group_members!inner(count)') // Select all from groups + count
    .in('id', groupIds)
    .returns<GroupRowWithCount[]>(); // Specify return type

  if (groupsError) throw groupsError;

  const groups: Group[] = (groupsData ?? []).map((group) => ({
    id: group.id,
    name: group.name,
    description: group.description,
    sport: group.sport as SportType, // Cast needed if DB type is different
    image: group.image_url || '',
    createdBy: group.created_by,
    is_active: group.is_active,
    admins: [], 
    members: [], 
    events: [], 
    createdAt: group.created_at,
    // Ensure group_members is accessed correctly
    memberCount: group.group_members?.[0]?.count ?? 0,
  }));

  return groups;
};

/**
 * Fetches upcoming events for the groups the currently authenticated user is a member of.
 * 
 * @returns {Promise<Event[]>} A list of upcoming events.
 * @throws {Error} If the user is not authenticated or if there's a DB error.
 */
export const getUpcomingEvents = async (): Promise<Event[]> => {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");

  const { data: memberEntries, error: memberError } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', user.id);

  if (memberError) throw memberError;
  if (!memberEntries) return [];

  const groupIds = (memberEntries as GroupMemberEntry[]).map(entry => entry.group_id);
  if (groupIds.length === 0) return [];

  const today = new Date().toISOString().split('T')[0];

  const { data: eventsData, error: eventsError } = await supabase
    .from('events')
    .select('*, event_attendees(user_id, status)') // Select all from events + attendees
    .in('group_id', groupIds)
    .gte('event_date', today)
    .order('event_date', { ascending: true })
    .order('event_time', { ascending: true })
    .returns<EventRowWithAttendees[]>(); // Specify return type

  if (eventsError) throw eventsError;

  const events: Event[] = (eventsData ?? []).map((event) => ({
    id: event.id,
    groupId: event.group_id,
    title: event.title,
    description: event.description,
    location: event.location,
    date: event.event_date,
    time: event.event_time,
    isPeriodic: event.is_periodic,
    frequency: event.frequency as Event['frequency'], // Cast if needed
    notifyBefore: event.notify_before,
    attendees: (event.event_attendees ?? []).map(att => ({
      userId: att.user_id,
      status: att.status as Event['attendees'][number]['status'], // Cast if needed
    })),
    createdAt: event.created_at,
  }));

  return events;
};

/**
 * Fetches unread notifications for the currently authenticated user.
 * 
 * @returns {Promise<Notification[]>} A list of unread notifications.
 * @throws {Error} If the user is not authenticated or if there's a DB error.
 */
export const getUnreadNotifications = async (): Promise<Notification[]> => {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error("User not authenticated for getUnreadNotifications", authError);
    throw new Error("User not authenticated");
  }

  // 2. Fetch unread notifications for the user
  const { data: notificationsData, error: notificationsError } = await supabase
    .from('notifications')
    .select(`
      id,
      user_id,
      title,
      message,
      type,
      related_event_id,
      related_group_id,
      is_read,
      created_at
    `)
    .eq('user_id', user.id)
    .eq('is_read', false)
    .order('created_at', { ascending: false });

  if (notificationsError) {
    console.error("Error fetching unread notifications:", notificationsError);
    throw notificationsError;
  }

  // Map the data using the inferred type for notificationsData
  const notifications: Notification[] = notificationsData?.map((n) => ({
    id: n.id,
    userId: n.user_id,
    title: n.title,
    message: n.message,
    type: n.type as Notification['type'], // Explicit cast might still be needed if DB enum/type differs
    relatedId: n.related_event_id || n.related_group_id || undefined,
    isRead: n.is_read,
    createdAt: n.created_at,
  })) || [];

  return notifications;
};

/**
 * Fetches detailed information for a specific group, including members and events.
 * Also checks if the current user is an admin of the group.
 * 
 * @param {string} groupId The ID of the group to fetch.
 * @returns {Promise<{ group: Group | null; members: GroupMemberWithProfile[]; events: Event[]; isAdmin: boolean; }>} 
 *          An object containing group details, members, events, and admin status.
 * @throws {Error} If the user is not authenticated or if there's a DB error.
 */
export const getGroupDetails = async (groupId: string): Promise<{
  group: Group | null;
  members: GroupMemberWithProfile[];
  events: Event[];
  isAdmin: boolean;
}> => {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    console.error("User not authenticated for getGroupDetails", authError);
    throw new Error("User not authenticated");
  }

  // Fetch Group Details
  const { data: groupData, error: groupError } = await supabase
    .from('groups')
    .select('*, is_active, group_members!inner(count)') // Select all + count
    .eq('id', groupId)
    .returns<GroupRowWithCount[]>() // Use defined type
    .maybeSingle(); 

  if (groupError) throw groupError;
  if (!groupData) return { group: null, members: [], events: [], isAdmin: false };

  // Fetch Group Members WITH Profile info
  const { data: membersData, error: membersError } = await supabase
    .from('group_members')
    .select(`
      user_id,
      is_admin,
      joined_at,
      profiles (
        id, 
        name, 
        last_name, 
        nickname, 
        avatar_url
      )
    `)
    .eq('group_id', groupId)
    .returns<MemberWithProfile[]>(); // Usa o tipo auxiliar

  if (membersError) throw membersError;

  // Check admin status from the fetched members data
  const currentUserMembership = membersData?.find(m => m.user_id === user.id);
  const isAdmin = currentUserMembership?.is_admin ?? false;

  // Map members data para o novo tipo
  const members: GroupMemberWithProfile[] = (membersData ?? []).map((member) => ({
    id: member.profiles?.id ?? member.user_id,
    user_id: member.user_id,
    name: member.profiles?.name ?? 'Nome não encontrado',
    lastName: member.profiles?.last_name, // Mapeia last_name do DB para lastName
    nickname: member.profiles?.nickname,
    avatar: member.profiles?.avatar_url || null,
    isAdmin: member.is_admin ?? false,
  }));

  // Fetch Group Events (Using type defined earlier)
  const { data: eventsData, error: eventsError } = await supabase
    .from('events')
    .select('*, event_attendees(user_id, status)')
    .eq('group_id', groupId)
    .order('event_date', { ascending: true })
    .order('event_time', { ascending: true })
    .returns<EventRowWithAttendees[]>();
  
  if (eventsError) throw eventsError;

  // Map group data
  const group: Group = {
    id: groupData.id,
    name: groupData.name,
    description: groupData.description,
    sport: groupData.sport as SportType, 
    image: groupData.image_url || '',
    createdBy: groupData.created_by,
    is_active: groupData.is_active,
    // Extract admin IDs from membersData
    admins: membersData?.filter(m => m.is_admin).map(m => m.user_id) ?? [], 
    // Map member IDs
    members: membersData?.map(m => m.user_id) ?? [], 
    // Map event IDs
    events: eventsData?.map(e => e.id) ?? [], 
    createdAt: groupData.created_at,
    // Use the count from groupData for efficiency
    memberCount: groupData.group_members?.[0]?.count ?? membersData?.length ?? 0, 
  };

  // Map events data (using logic from getUpcomingEvents)
  const events: Event[] = (eventsData ?? []).map(event => ({
      id: event.id,
      groupId: event.group_id,
      title: event.title,
      description: event.description,
      location: event.location,
      date: event.event_date,
      time: event.event_time,
      isPeriodic: event.is_periodic,
      frequency: event.frequency as Event['frequency'],
      notifyBefore: event.notify_before,
      attendees: (event.event_attendees ?? []).map(att => ({
        userId: att.user_id,
        status: att.status as Event['attendees'][number]['status'],
      })),
      createdAt: event.created_at,
    }));

  return { group, members, events, isAdmin };
};

/**
 * Fetches past events for the groups the currently authenticated user is a member of.
 * 
 * @returns {Promise<Event[]>} A list of past events.
 * @throws {Error} If the user is not authenticated or if there's a DB error.
 */
export const getPastEvents = async (): Promise<Event[]> => {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error("User not authenticated for getPastEvents", authError);
    throw new Error("User not authenticated");
  }

  // 2. Fetch group IDs the user is a member of
  const { data: memberEntries, error: memberError } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', user.id);

  if (memberError) {
    console.error("Error fetching user group memberships for past events:", memberError);
    throw memberError;
  }

  if (!memberEntries || memberEntries.length === 0) {
    return []; // User is not in any groups
  }

  const groupIds = memberEntries.map(entry => entry.group_id);
  const today = new Date().toISOString().split('T')[0]; // Get YYYY-MM-DD format

  // 3. Fetch past events for those groups
  const { data: eventsData, error: eventsError } = await supabase
    .from('events')
    .select(`
      id,
      group_id,
      title,
      description,
      location,
      event_date,
      event_time,
      is_periodic,
      frequency,
      notify_before,
      created_at,
      event_attendees ( user_id, status )
    `)
    .in('group_id', groupIds)
    .lt('event_date', today) // Less than today
    .order('event_date', { ascending: false }) // Show most recent past first
    .order('event_time', { ascending: false });

  if (eventsError) {
    console.error("Error fetching past events:", eventsError);
    throw eventsError;
  }

  // 4. Map the data to our Event type
  const events: Event[] = eventsData?.map(event => ({
    id: event.id,
    groupId: event.group_id,
    title: event.title,
    description: event.description,
    location: event.location,
    date: event.event_date,
    time: event.event_time,
    isPeriodic: event.is_periodic,
    frequency: event.frequency as Event['frequency'], 
    notifyBefore: event.notify_before,
    attendees: event.event_attendees?.map(att => ({
      userId: att.user_id,
      status: att.status as 'confirmed' | 'declined' | 'pending',
    })) || [],
    createdAt: event.created_at,
  })) || [];

  return events;
};

/**
 * Creates a new group and adds the creator as an admin member.
 * 
 * @param {object} groupData Data for the new group (name, description, sport).
 * @param {string} groupData.name The name of the group.
 * @param {string | null} groupData.description The description of the group.
 * @param {SportType} groupData.sport The sport type for the group.
 * @param {string | null} groupData.image_url Optional image URL for the group.
 * @returns {Promise<string>} The ID of the newly created group.
 * @throws {Error} If the user is not authenticated, data is invalid, or DB error occurs.
 */
export const createGroup = async (groupData: {
  name: string;
  description: string | null;
  sport: SportType;
  image_url?: string | null; // Make image optional
}): Promise<string> => {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    console.error("User not authenticated for createGroup", authError);
    throw new Error("User not authenticated");
  }

  // 2. Insert the new group into the 'groups' table
  const { data: newGroup, error: insertGroupError } = await supabase
    .from('groups')
    .insert({
      name: groupData.name,
      description: groupData.description,
      sport: groupData.sport,
      image_url: groupData.image_url,
      created_by: user.id, // Set creator ID
    })
    .select('id') // Select only the ID of the newly created group
    .single();

  if (insertGroupError) {
    console.error("Error inserting new group:", insertGroupError);
    throw insertGroupError;
  }

  if (!newGroup || !newGroup.id) {
    console.error("Failed to create group or retrieve its ID.");
    throw new Error("Failed to create group.");
  }

  const newGroupId = newGroup.id;

  // 3. Add the creator as an admin member in 'group_members'
  const { error: insertMemberError } = await supabase
    .from('group_members')
    .insert({
      group_id: newGroupId,
      user_id: user.id,
      is_admin: true, // Make the creator an admin
    });

  if (insertMemberError) {
    console.error(`Error adding creator ${user.id} as admin member to group ${newGroupId}:`, insertMemberError);
    // Important: Decide how to handle partial failure.
    // Should we try to delete the group? Or just log the error?
    // For now, we log and throw, but the group exists without the creator as admin.
    // Consider using a DB function/trigger for atomicity.
    throw insertMemberError; 
  }

  console.log(`Group ${newGroupId} created and user ${user.id} added as admin.`);
  
  // 4. Return the new group's ID
  return newGroupId;
};

/**
 * Updates the profile of the currently authenticated user.
 * Allows updating name, sport preferences, avatar URL, and phone number.
 *
 * @param profileData An object containing the fields to update.
 * @throws {Error} If the user is not authenticated or if there's a DB error.
 */
export const updateUserProfile = async (profileData: Partial<{ 
  name: string | null;
  lastName: string | null;
  nickname: string | null;
  sportPreferences: User['sportPreferences'] | null;
  avatar_url: string | null;
  phone_number: string | null;
}>): Promise<void> => {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");

  // Usar o tipo TablesUpdate gerado pelo Supabase diretamente
  // para garantir compatibilidade
  const updateData: TablesUpdate<"profiles"> = {};

  // Atribui valores apenas se a chave existir no objeto profileData
  // O tipo TablesUpdate já lida com os tipos corretos (string | undefined, etc.)
  if (Object.hasOwn(profileData, 'name')) {
    updateData.name = profileData.name ?? undefined; // Garante undefined se for null
  }
  if (Object.hasOwn(profileData, 'lastName')) {
    updateData.last_name = profileData.lastName ?? undefined; // Garante undefined se for null
  }
  if (Object.hasOwn(profileData, 'nickname')) {
    updateData.nickname = profileData.nickname; // Permite null
  }
  if (Object.hasOwn(profileData, 'sportPreferences')) {
    // O tipo esperado para sport_preferences é Json | null
    // Garantir que o valor passado seja Json ou null.
    if (profileData.sportPreferences === null || (typeof profileData.sportPreferences === 'object')) {
      updateData.sport_preferences = profileData.sportPreferences as Json | null;
    } else {
      // Se for undefined ou outro tipo inválido, não atualiza ou define como null?
      // Optando por não atualizar se o tipo não for objeto ou null.
      // Alternativamente: updateData.sport_preferences = null;
    }
  }
  if (Object.hasOwn(profileData, 'avatar_url')) {
    updateData.avatar_url = profileData.avatar_url; // Permite null
  }
  if (Object.hasOwn(profileData, 'phone_number')) {
    updateData.phone_number = profileData.phone_number; // Permite null
  }

  // Remover chaves explicitamente undefined (se necessário, mas o Supabase client deve lidar com isso)
  // Object.keys(updateData).forEach((key) => {
  //   if (updateData[key as keyof typeof updateData] === undefined) {
  //     delete updateData[key as keyof typeof updateData];
  //   }
  // });

  if (Object.keys(updateData).length === 0) {
    console.log("No profile data provided to update.");
    return;
  }

  // A chamada update agora deve estar alinhada com o tipo esperado
  const { error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', user.id);

  if (error) {
    console.error("Error updating profile:", error);
    throw error;
  }

  console.log("Profile updated successfully.");
};

/**
 * Creates a new event within a specific group.
 *
 * @param {string} groupId The ID of the group where the event will be created.
 * @param {Omit<Event, 'id' | 'groupId' | 'attendees' | 'createdAt'>} eventData Data for the new event.
 * @returns {Promise<string>} The ID of the newly created event.
 * @throws {Error} If user is not authenticated, data is invalid, or DB error occurs.
 */
export const createEvent = async (
  groupId: string,
  eventData: Omit<Event, 'id' | 'groupId' | 'attendees' | 'createdAt'>
): Promise<string> => {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    console.error("User not authenticated for createEvent", authError);
    throw new Error("User not authenticated");
  }

  // TODO: Add permission check - only group admins/members should create events?

  // 2. Prepare data for insert
  const insertPayload = {
    group_id: groupId,
    title: eventData.title,
    description: eventData.description,
    location: eventData.location,
    event_date: eventData.date,
    event_time: eventData.time,
    is_periodic: eventData.isPeriodic,
    frequency: eventData.frequency,
    notify_before: eventData.notifyBefore,
    // created_at and updated_at are handled by the database
  };

  // 3. Insert the new event
  const { data: newEvent, error: insertError } = await supabase
    .from('events')
    .insert(insertPayload)
    .select('id')
    .single();

  if (insertError) {
    console.error(`Error inserting event for group ${groupId}:`, insertError);
    throw insertError;
  }

  if (!newEvent || !newEvent.id) {
    console.error("Failed to create event or retrieve its ID.");
    throw new Error("Failed to create event.");
  }

  console.log(`Event ${newEvent.id} created successfully for group ${groupId}.`);

  // 4. Return the new event ID
  return newEvent.id;
};

/**
 * Responds to an event invitation by upserting the attendee status.
 * @param eventId - The ID of the event.
 * @param userId - The ID of the user responding.
 * @param status - The attendance status ('confirmed' or 'declined').
 * @returns A promise that resolves with the upserted event attendee data or null in case of error.
 */
export const respondToEvent = async (
    eventId: string,
    userId: string,
    status: 'confirmed' | 'declined'
): Promise<EventAttendeeRow | null> => {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('event_attendees')
        .upsert(
            {
                event_id: eventId,
                user_id: userId,
                status: status,
                updated_at: new Date().toISOString(), // Ensure updated_at is set
            },
            {
                onConflict: 'event_id, user_id', // Specify conflict columns
            }
        )
        .select()
        .single(); // Select the upserted row

    if (error) {
        console.error('Error responding to event:', error);
        // TODO: Add more robust error handling, maybe throw error
        return null;
    }
    console.log('Event response successful:', data);
    return data;
};

/**
 * Creates a single-use, time-limited invite token for a group.
 * Only callable by group administrators.
 *
 * @param groupId The ID of the group to create an invite for.
 * @returns The generated unique invite token.
 * @throws {Error} If user is not authenticated, not an admin, or DB error occurs.
 */
export const createGroupInvite = async (groupId: string): Promise<string> => {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error("User not authenticated");
  }

  // 2. Verify user is an admin of the group
  const { data: membership, error: memberError } = await supabase
    .from('group_members')
    .select('is_admin')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (memberError) {
    console.error(`Error checking admin status for user ${user.id} in group ${groupId}:`, memberError);
    throw new Error("Failed to verify admin status.");
  }

  if (!membership || !membership.is_admin) {
    throw new Error("Only group administrators can create invites.");
  }

  // 3. Generate unique token
  const token = crypto.randomBytes(16).toString('hex'); // Generate a secure random token

  // 4. Set expiration time (e.g., 1 hour from now)
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1);

  // 5. Insert the invite into the database
  const { error: insertError } = await supabase
    .from('group_invites')
    .insert({
      group_id: groupId,
      token: token,
      created_by: user.id,
      expires_at: expiresAt.toISOString(),
    });

  if (insertError) {
    // Handle potential duplicate token error (though unlikely with randomBytes)
    if (insertError.code === '23505') { // Unique constraint violation
       console.warn("Token collision detected, should retry generation (very rare).")
       // Potentially retry generation here in a real-world scenario
       throw new Error("Failed to generate unique invite token, please try again.");
    } else {
        console.error(`Error inserting group invite for group ${groupId}:`, insertError);
        throw new Error("Failed to create group invite.");
    }
  }

  console.log(`Invite token created for group ${groupId} by user ${user.id}: ${token}`);

  // 6. Return the token
  return token;
};

/**
 * Attempts to accept a group invitation using a token.
 * Verifies the token, checks expiration, usage status, and if the user is already a member.
 * If valid, adds the user to the group and marks the token as used.
 * 
 * @param token The invitation token string from the URL.
 * @returns {Promise<{ groupId: string }>} An object containing the groupId on success.
 * @throws {Error} With specific messages for different failure reasons (e.g., invalid token, expired, used, already member).
 */
export const acceptGroupInvite = async (token: string): Promise<{ groupId: string }> => {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error("User not authenticated");
  }

  // 2. Fetch the invite by token
  const { data: invite, error: inviteError } = await supabase
    .from('group_invites')
    .select('id, group_id, expires_at, used_by')
    .eq('token', token)
    .maybeSingle();

  if (inviteError) {
    console.error(`Error fetching invite for token ${token}:`, inviteError);
    throw new Error("Failed to process invite token.");
  }

  // 3. Validate the invite
  if (!invite) {
    throw new Error("Invalid or non-existent invitation token.");
  }
  if (new Date(invite.expires_at) < new Date()) {
    throw new Error("Invitation token has expired.");
  }
  if (invite.used_by) {
    throw new Error("Invitation token has already been used.");
  }

  const groupId = invite.group_id;

  // 4. Check if user is already a member of the group
  const { data: existingMembershipData, error: memberCheckError } = await supabase
    .from('group_members')
    .select('user_id')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .maybeSingle();
    
  if (memberCheckError) {
      console.error(`Error checking membership for user ${user.id} in group ${groupId}:`, memberCheckError);
      throw new Error("Failed to verify group membership.");
  }

  // If data is not null, a membership record exists
  if (existingMembershipData !== null) { 
      throw new Error("You are already a member of this group.");
  }

  // 5. Add user to group members
  const { error: insertMemberError } = await supabase
    .from('group_members')
    .insert({
      group_id: groupId,
      user_id: user.id,
      is_admin: false, // Invited users are not admins by default
    });

  if (insertMemberError) {
    console.error(`Error adding user ${user.id} to group ${groupId} via invite:`, insertMemberError);
    throw new Error("Failed to add user to the group.");
  }

  // 6. Mark invite as used
  const { error: updateInviteError } = await supabase
    .from('group_invites')
    .update({
      used_by: user.id,
      used_at: new Date().toISOString(),
    })
    .eq('id', invite.id);

  if (updateInviteError) {
    console.error(`Error marking invite ${invite.id} as used by user ${user.id}:`, updateInviteError);
    // CRITICAL: The user was added, but the invite wasn't marked as used.
    // This could allow the invite to be reused. Consider rolling back the member add?
    // Or implement this entire logic within a database function/transaction.
    // For now, log the error but proceed.
    console.warn("Failed to mark invite as used. Potential for reuse.");
  }

  console.log(`User ${user.id} successfully joined group ${groupId} using invite ${invite.id}.`);
  
  // 7. Return success (e.g., with group ID for redirect)
  return { groupId };
};

/**
 * Marks a specific notification as read for the current user.
 *
 * @param notificationId The ID of the notification to mark as read.
 * @returns {Promise<void>}
 * @throws {Error} If user not authenticated or DB error occurs.
 */
export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error("User not authenticated");
  }

  // 2. Update the notification
  const { error: updateError } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('user_id', user.id); // Ensure user can only update their own notifications

  if (updateError) {
    console.error(`Error marking notification ${notificationId} as read:`, updateError);
    throw new Error("Failed to mark notification as read.");
  }

  console.log(`Notification ${notificationId} marked as read for user ${user.id}.`);
};

/**
 * Marks all notifications as read for the current user.
 *
 * @returns {Promise<void>}
 * @throws {Error} If user not authenticated or DB error occurs.
 */
export const markAllNotificationsAsRead = async (): Promise<void> => {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error("User not authenticated");
  }

  // 2. Update all notifications for the user
  const { error: updateError } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false); // Only update those that are currently unread

  if (updateError) {
    console.error(`Error marking all notifications as read for user ${user.id}:`, updateError);
    throw new Error("Failed to mark all notifications as read.");
  }

  console.log(`All notifications marked as read for user ${user.id}.`);
};

/**
 * Fetches all notifications (read and unread) for the currently authenticated user.
 * 
 * @returns {Promise<Notification[]>} A list of all notifications, ordered by creation date descending.
 * @throws {Error} If the user is not authenticated or if there's a DB error.
 */
export const getAllNotifications = async (): Promise<Notification[]> => {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error("User not authenticated for getAllNotifications", authError);
    throw new Error("User not authenticated");
  }

  // 2. Fetch all notifications for the user
  const { data: notificationsData, error: notificationsError } = await supabase
    .from('notifications')
    .select(`
      id,
      user_id,
      title,
      message,
      type,
      related_event_id,
      related_group_id,
      is_read,
      created_at
    `)
    .eq('user_id', user.id)
    // No filter for is_read needed here
    .order('created_at', { ascending: false });

  if (notificationsError) {
    console.error("Error fetching all notifications:", notificationsError);
    throw notificationsError;
  }

  // Map the data using the inferred type for notificationsData
  const notifications: Notification[] = notificationsData?.map((n) => ({
    id: n.id,
    userId: n.user_id,
    title: n.title,
    message: n.message,
    type: n.type as Notification['type'], 
    relatedId: n.related_event_id || n.related_group_id || undefined,
    isRead: n.is_read,
    createdAt: n.created_at,
  })) || [];

  return notifications;
};

/**
 * Fetches the profile data for a specific user ID.
 * Used in MemberDetails to show other users' profiles.
 * Includes phone number if available.
 *
 * @param userId The ID of the user whose profile to fetch.
 * @returns {Promise<UserProfileData | null>} The user profile data or null if not found or error.
 */
export const getUserProfile = async (userId: string): Promise<UserProfileData | null> => {
  if (!userId) {
    console.error("getUserProfile called without a userId.");
    return null;
  }

  const supabase = createClient();

  try {
    // Adiciona last_name e nickname ao select
    const { data: profile, error } = await supabase
      .from('profiles')
      .select(`
        id,
        name,
        last_name,
        nickname,
        avatar_url,
        is_premium,
        sport_preferences,
        phone_number
      `)
      .eq('id', userId)
      .single<ProfileRowComplete>(); // Usa o tipo completo da linha

    if (error) {
      if (error.code === 'PGRST116') {
        console.warn(`Profile not found for user ID: ${userId}`);
      } else {
        console.error(`Error fetching profile for user ${userId}:`, error);
      }
      return null;
    }

    if (!profile) {
      console.warn(`Profile data is unexpectedly null for user ID: ${userId}`);
      return null;
    }
    
    // Mapeia para UserProfileData
    const userProfileData: UserProfileData = {
      id: profile.id,
      name: profile.name,
      lastName: profile.last_name, // Mapeia last_name do DB para lastName
      nickname: profile.nickname,
      avatar_url: profile.avatar_url,
      is_premium: profile.is_premium,
      sport_preferences: (profile.sport_preferences as UserProfileData['sport_preferences']) || null,
      phone_number: profile.phone_number,
    };

    return userProfileData;

  } catch (err) {
    console.error("Unexpected error in getUserProfile:", err);
    return null;
  }
};

// --- START: New functions for Group Settings ---

/**
 * Updates the details of a specific group.
 * Only allowed if the current user is an admin of the group (checked via RLS).
 * 
 * @param {string} groupId The ID of the group to update.
 * @param {Partial<Pick<Group, 'name' | 'description' | 'sport' | 'image'>>} updates An object containing the fields to update.
 * @returns {Promise<void>} Resolves when the update is complete.
 * @throws {Error} If the user is not authenticated, not an admin, or if there's a DB error.
 */
export const updateGroup = async (
  groupId: string,
  updates: Partial<Pick<Group, 'name' | 'description' | 'sport' | 'image'>>
): Promise<void> => {
  const { supabase } = await getAuthenticatedSupabaseClient();

  // 1. Buscar URL da imagem atual ANTES de atualizar
  let oldImageUrl: string | null = null;
  try {
    const { data: currentGroupData, error: fetchError } = await supabase
      .from('groups')
      .select('image_url')
      .eq('id', groupId)
      .maybeSingle();
    
    if (fetchError && fetchError.code !== 'PGRST116') { // Ignora erro 'not found'
      console.error(`Error fetching current image URL for group ${groupId} before update:`, fetchError);
      // Decide se quer lançar o erro ou apenas logar e continuar sem deletar a imagem antiga
      // Lançar é mais seguro para evitar inconsistências, mas pode impedir updates de texto se a busca falhar.
      // Optando por logar e continuar.
      // throw fetchError; 
    }
    oldImageUrl = currentGroupData?.image_url ?? null;

  } catch (fetchCatchError) {
      console.error(`Unexpected error fetching current image URL for group ${groupId}:`, fetchCatchError);
      // Continuar mesmo se a busca falhar
  }

  // **A verificação de admin foi removida daqui, pois deve ser feita pela RLS**
  /*
  const { data: membership, error: adminError } = await supabase
    // ... admin check ...
  */

  // 2. Preparar o payload de update
  const updatePayload: TablesUpdate<"groups"> = {};
  if (Object.hasOwn(updates, 'name')) updatePayload.name = updates.name;
  if (Object.hasOwn(updates, 'description')) updatePayload.description = updates.description;
  if (Object.hasOwn(updates, 'sport')) updatePayload.sport = updates.sport as SportType;
  if (Object.hasOwn(updates, 'image')) updatePayload.image_url = updates.image;

  if (Object.keys(updatePayload).length === 0) {
    return; // Nothing to update
  }

  // 3. Perform the database update (RLS fará a checagem de admin e is_active)
  const { error: updateError } = await supabase
    .from('groups')
    .update(updatePayload)
    .eq('id', groupId);

  if (updateError) {
    console.error(`Error updating group ${groupId} in database:`, updateError);
    // Checar erro de RLS?
    if (updateError.code === '42501') {
        throw new Error("Permission denied. Only admins can update active groups.");
    }
    throw updateError;
  }
  console.log(`Group ${groupId} updated successfully in database.`);

  // 4. Deletar imagem antiga do Storage se update foi sucesso, uma NOVA imagem foi fornecida, E a URL mudou
  const newImageUrl = updates.image; 
  if (oldImageUrl && newImageUrl && newImageUrl !== oldImageUrl) { 
      console.log(`Requesting deletion of old group image: ${oldImageUrl}`);
      await _removeImageFromUrl(oldImageUrl, 'group-images');
  }

};

// --- Helper Function: Delete Group Image --- 
async function _deleteGroupImageFromStorage(imageUrl: string | null | undefined, groupIdForLog: string) {
  if (!imageUrl) {
    console.log(`[Helper] No image URL provided for group ${groupIdForLog}, skipping storage delete.`);
    return; 
  }
  
  const supabase = createClient();
  console.log(`[Helper] Attempting to delete image: ${imageUrl}`);
  try {
    const url = new URL(imageUrl);
    const bucketName = 'group-images'; 
    const pathPrefix = `/storage/v1/object/public/${bucketName}/`;
    if (url.pathname.startsWith(pathPrefix)) {
       const filePath = decodeURIComponent(url.pathname.substring(pathPrefix.length));
       console.log(`[Helper] Deleting from storage: Bucket=${bucketName}, Path=${filePath}`);
       
       const { error: deleteStorageError } = await supabase
        .storage
        .from(bucketName)
        .remove([filePath]);

       if (deleteStorageError) {
          console.error(`[Helper] Failed to delete image '${filePath}' from storage for group ${groupIdForLog}:`, deleteStorageError);
       } else {
          console.log(`[Helper] Image '${filePath}' deleted successfully from storage for group ${groupIdForLog}.`); 
       }
    } else {
       console.warn(`[Helper] Could not extract file path from image URL: ${imageUrl}`);
    }
  } catch (urlError) {
     console.error(`[Helper] Error processing image URL for deletion: ${imageUrl}`, urlError);
  }
}

// --- Helper Function: Remove Image From URL --- 
async function _removeImageFromUrl(imageUrl: string | null | undefined, bucketName: string) {
  if (!imageUrl) {
    console.log(`[Helper _removeImageFromUrl] No URL provided for bucket ${bucketName}, skipping delete.`);
    return;
  }
  const supabase = createClient(); // Precisa do cliente aqui também
  console.log(`[Helper _removeImageFromUrl] Attempting to delete image: ${imageUrl}`);
  try {
    const url = new URL(imageUrl);
    const pathPrefix = `/storage/v1/object/public/${bucketName}/`;
    if (url.pathname.startsWith(pathPrefix)) {
      const filePath = decodeURIComponent(url.pathname.substring(pathPrefix.length));
      console.log(`[Helper _removeImageFromUrl] Deleting from storage: Bucket=${bucketName}, Path=${filePath}`);
      const { error: deleteStorageError } = await supabase.storage.from(bucketName).remove([filePath]);
      if (deleteStorageError) {
          console.warn(`[Helper _removeImageFromUrl] Failed to delete image '${filePath}' from bucket ${bucketName}:`, deleteStorageError);
      } else {
          console.log(`[Helper _removeImageFromUrl] Image '${filePath}' deleted successfully from bucket ${bucketName}.`);
      }
    } else {
        console.warn(`[Helper _removeImageFromUrl] Could not extract file path from image URL: ${imageUrl}`);
    }
  } catch (urlError) {
      console.error(`[Helper _removeImageFromUrl] Error processing image URL for deletion: ${imageUrl}`, urlError);
  }
}

// --- Helper Function: Delete Group from DB --- 
async function _deleteGroupFromDB(groupId: string) {
  const supabase = createClient();
  console.log(`[Helper] Attempting to delete group ${groupId} from database...`);
  const { error: deleteDbError } = await supabase
    .from('groups')
    .delete()
    .eq('id', groupId);

  if (deleteDbError) {
    console.error(`[Helper] Error deleting group ${groupId} from database:`, deleteDbError);
    if (deleteDbError.code === '42501') { // RLS Error
      throw new Error("Permission denied. Only admins can delete groups.");
    }
    throw deleteDbError;
  }
  console.log(`[Helper] Group ${groupId} deleted successfully from database.`);
}

/**
 * Allows the current authenticated user to leave a group.
 * Handles cases for the last member (deletes group) and the last admin (promotes oldest member).
 *
 * @param groupId The ID of the group to leave.
 * @returns Promise resolving when the operation is complete.
 * @throws Error if user is not authenticated, not a member, or DB error occurs (specific errors might be raised by the DB function).
 */
export const leaveGroup = async (groupId: string): Promise<void> => {
    const { supabase, user: currentUser } = await getAuthenticatedSupabaseClient(); 
  
  const userId = currentUser.id;

  // Chamar a função PostgreSQL que retorna JSON
  // Tipo esperado: { should_delete: boolean, image_url_to_delete: string | null }
  const { data: rpcResult, error: rpcError } = await supabase.rpc('leave_group_transaction', {
     p_group_id: groupId,
     p_user_id: userId
  }); 
  
  // --- Adicionar Interface e Asserção de Tipo ---
  interface LeaveGroupRpcResult {
    should_delete: boolean;
    image_url_to_delete: string | null;
  }
  // Converter para unknown primeiro, depois para o tipo desejado
  const result = rpcResult as unknown as LeaveGroupRpcResult; 
  // ---------------------------------------------

  if (rpcError) {
      console.error(`Error leaving group ${groupId} for user ${userId} via RPC:`, rpcError);
      throw new Error(rpcError.message || "Failed to leave the group. Please try again.");
  }

  // Processar resultado da RPC
  if (result && result.should_delete) {
    console.log(`RPC indicated group ${groupId} should be deleted. Image URL: ${result.image_url_to_delete}`);
    try {
      // Deletar imagem (helper cuidará se URL for null)
      await _deleteGroupImageFromStorage(result.image_url_to_delete, groupId);
      
      // Deletar grupo do DB
      await _deleteGroupFromDB(groupId);

      console.log(`Group ${groupId} deletion process completed after last member left.`);

    } catch (deleteError) {
       // Erros de deleção (DB ou Storage crítico) foram relançados pelos helpers
       console.error(`Error during delete process for group ${groupId} after last member left:`, deleteError);
       // Lançar um erro para a mutation na UI
       throw new Error(`Successfully left the group, but failed during the final group deletion: ${(deleteError as Error).message}`);
    }
  } else {
    // Se não for para deletar, apenas logar a ação da RPC (saída normal ou desativação)
     console.log(`User ${userId} successfully processed leave/deactivate action for group ${groupId}. No deletion needed.`);
  }
  
  // Se chegou aqui, a operação principal (sair/desativar ou sair/deletar) foi concluída ou o erro foi lançado.
  // A invalidação de queries e redirecionamento ficam na UI.
};

/**
 * Deletes a specific group.
 * Only allowed if the current user is an admin of the group (checked via RLS).
 * Also deletes the associated image from storage.
 * 
 * @param {string} groupId The ID of the group to delete.
 * @returns {Promise<void>} Resolves when the deletion is complete.
 * @throws {Error} If the user is not authenticated, not an admin, fails to delete storage object, or if there's a DB error.
 */
export const deleteGroup = async (groupId: string, knownImageUrl?: string | null): Promise<void> => {
  const { supabase } = await getAuthenticatedSupabaseClient();
   
  let imageUrlToDelete: string | null | undefined = knownImageUrl;

  try {
    // 1. Buscar image_url apenas se não foi fornecida (usa a instância 'supabase' do helper)
    if (imageUrlToDelete === undefined) {
      console.log(`[deleteGroup] Image URL not provided, fetching from DB for group ${groupId}...`);
      const { data: groupData, error: fetchError } = await supabase
        .from('groups')
        .select('image_url')
        .eq('id', groupId)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') { 
        console.error(`Error fetching group image_url before deletion for group ${groupId}:`, fetchError);
        throw fetchError; 
      }
      imageUrlToDelete = groupData?.image_url ?? null;
    } else {
       console.log(`[deleteGroup] Using provided image URL: ${imageUrlToDelete}`);
    }

    // PASSO 2: Deletar imagem do Storage PRIMEIRO (usando helper)
    await _deleteGroupImageFromStorage(imageUrlToDelete, groupId); 

    // PASSO 3: Deletar o grupo do banco de dados (usando helper)
    await _deleteGroupFromDB(groupId);

    console.log(`[deleteGroup] Overall deletion process completed for group ${groupId}.`);

  } catch (error) {
    console.error(`An unexpected error occurred during deleteGroup for ${groupId}:`, error);
    throw error; // Relança qualquer erro para a mutation tratar
  }
};

// --- END: Refactored Group Deletion ---

// --- START: Function for Group Image Upload ---
/**
 * Uploads a group image to Supabase Storage.
 * 
 * @param {File} file The image file to upload.
 * @param {string} groupId The ID of the group to associate the image with.
 * @returns {Promise<string>} The public URL of the uploaded image.
 * @throws {Error} If upload fails or public URL cannot be retrieved.
 */
export const uploadGroupImage = async (file: File, groupId: string): Promise<string> => {
  const { supabase } = await getAuthenticatedSupabaseClient();
  
  // Criar um nome de arquivo único para evitar colisões e facilitar a organização
  const fileExtension = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExtension}`;
  const filePath = `${groupId}/${fileName}`; // Organiza por ID do grupo
  
  const bucketName = 'group-images'; // Certifique-se que este bucket existe no Supabase Storage

  // Fazer upload do arquivo
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(bucketName)
    .upload(filePath, file, {
      cacheControl: '3600', // Cache por 1 hora
      upsert: false, // Não sobrescrever se o arquivo já existir (improvável com nome único)
    });

  if (uploadError) {
    console.error('Error uploading group image:', uploadError);
    throw new Error(`Failed to upload image: ${uploadError.message}`);
  }

  if (!uploadData) {
      throw new Error('Upload successful but no data returned.');
  }

  // Obter a URL pública da imagem carregada
  const { data: publicUrlData } = supabase.storage
    .from(bucketName)
    .getPublicUrl(filePath);

  if (!publicUrlData || !publicUrlData.publicUrl) {
      // Tentar remover o arquivo se não conseguir a URL pública?
      console.error('Failed to get public URL for uploaded image:', filePath);
      throw new Error('Image uploaded but failed to get public URL.');
  }

  console.log(`Group image uploaded successfully: ${publicUrlData.publicUrl}`);
  return publicUrlData.publicUrl;
};
// --- END: Function for Group Image Upload ---

/**
 * Fetches complete details for a specific event using an RPC call.
 * 
 * @param {string} eventId The ID of the event to fetch.
 * @returns {Promise<EventDetailsRpcResponse | null>} The event details including attendees and admin status, or null if not found.
 * @throws {Error} If there's a database error.
 */
export const getEventDetails = async (eventId: string): Promise<EventDetailsRpcResponse | null> => {
  if (!eventId) return null;
  
  const supabase = createClient();

  try {
    // Call the RPC function - Types should now be generated
    const { data, error } = await supabase
      .rpc('get_event_details_with_attendees', { _event_id: eventId })
      .single(); 

    if (error) {
      console.error(`Error fetching event details via RPC for ${eventId}:`, error);
       // Handle specific errors like not found (check Supabase error codes if needed)
      if (error.code === 'PGRST116') { // Example: Resource Not Found
         console.warn(`Event not found via RPC: ${eventId}`);
         return null; 
      } 
      throw error;
    }

    if (!data) {
      console.warn(`No data returned from RPC for event ${eventId}`);
      return null;
    }
    
    // Usar conversão via unknown para satisfazer o linter
    const result = data as unknown as EventDetailsRpcResponse;
    
    const eventWithAttendees: Event = {
      ...result.event,
      attendees: result.attendees.map((att: AttendeeWithProfile) => ({ userId: att.userId, status: att.status })) 
    };

    return {
      event: eventWithAttendees,
      group: result.group,
      attendees: result.attendees,
      isAdmin: result.isAdmin,
    };

  } catch (error) {
    console.error(`An unexpected error occurred fetching details for event ${eventId}:`, error);
    return null; 
  }
};

/**
 * Checks if a specific user is an administrator of a specific group.
 * 
 * @param groupId The ID of the group.
 * @param userId The ID of the user to check.
 * @returns Promise resolving to an object { isAdmin: boolean }.
 * @throws Error if user is not authenticated or DB error occurs.
 */
export const checkGroupAdminStatus = async (groupId: string, userId: string | undefined): Promise<{ isAdmin: boolean }> => {
  if (!userId) {
     return { isAdmin: false }; // Cannot be admin if no user ID
  }
  const supabase = createClient();
  // Need to re-authenticate? Usually handled by the client, but ensure user context exists.
  // const { data: { user: currentUser } } = await supabase.auth.getUser();
  // if (!currentUser) throw new Error("User not authenticated"); 
  // No auth check needed here as it checks a specific provided userId

  const { data, error } = await supabase
    .from('group_members')
    .select('is_admin')
    .eq('group_id', groupId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error(`Error checking admin status for user ${userId} in group ${groupId}:`, error);
    throw new Error("Failed to verify admin status.");
  }

  return { isAdmin: data?.is_admin ?? false };
};

/**
 * Updates the role (admin status) of a member within a group.
 * Requires the calling user to be an admin (enforced by RLS).
 * 
 * @param groupId The ID of the group.
 * @param userId The ID of the member whose role is being updated.
 * @param isAdmin The new admin status (true to promote, false to demote).
 * @returns Promise resolving when the update is complete.
 * @throws Error if user is not authenticated, not an admin, or DB error occurs.
 */
export const updateGroupMemberRole = async (groupId: string, userId: string, isAdmin: boolean): Promise<void> => {
  const supabase = createClient();
  // Ensure the current user is authenticated before attempting update
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  if (!currentUser) throw new Error("User not authenticated");
  if (currentUser.id === userId) throw new Error("Cannot change your own role."); // Prevent self-role change

  // RLS policy on group_members should enforce that only admins can update roles.
  const { error } = await supabase
    .from('group_members')
    .update({ is_admin: isAdmin })
    .eq('group_id', groupId)
    .eq('user_id', userId);

  if (error) {
    console.error(`Error updating role for user ${userId} in group ${groupId}:`, error);
     // Check for RLS violation error (code 42501 in PostgreSQL)
    if (error.code === '42501') {
        throw new Error("Permission denied. Only admins can update member roles.");
    }
    throw error;
  }
  console.log(`Role updated for user ${userId} in group ${groupId} to isAdmin=${isAdmin}.`);
};

/**
 * Removes a member from a group.
 * Requires the calling user to be an admin (enforced by RLS).
 * 
 * @param groupId The ID of the group.
 * @param userId The ID of the member to remove.
 * @returns Promise resolving when the deletion is complete.
 * @throws Error if user is not authenticated, not an admin, or DB error occurs.
 */
export const removeGroupMember = async (groupId: string, userId: string): Promise<void> => {
  const supabase = createClient();
  // Ensure the current user is authenticated before attempting removal
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  if (!currentUser) throw new Error("User not authenticated");
   if (currentUser.id === userId) throw new Error("Cannot remove yourself from the group."); // Prevent self-removal

  // RLS policy on group_members should enforce that only admins can delete members.
  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', userId);

  if (error) {
    console.error(`Error removing user ${userId} from group ${groupId}:`, error);
     // Check for RLS violation error (code 42501 in PostgreSQL)
    if (error.code === '42501') {
        throw new Error("Permission denied. Only admins can remove members.");
    }
    throw error;
  }
  console.log(`User ${userId} removed from group ${groupId}.`);
};

/**
 * Fetches specific membership details (like joined_at) for a user in a group.
 *
 * @param groupId The ID of the group.
 * @param userId The ID of the user.
 * @returns Promise resolving to an object with joined_at string or null if not found/error.
 */
export const getGroupMembershipDetails = async (
  groupId: string,
  userId: string | undefined
): Promise<{ joined_at: string } | null> => {
  if (!userId || !groupId) {
    return null;
  }

  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from('group_members')
      .select('joined_at')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .maybeSingle(); 

    if (error) {
      console.error(`Error fetching membership details for user ${userId} in group ${groupId}:`, error);
      throw error; 
    }

    if (!data) {
        console.warn(`Membership not found for user ${userId} in group ${groupId}.`);
        return null;
    }
    
    // A coluna joined_at é timestamptz, Supabase retorna como string ISO 8601
    return { joined_at: data.joined_at }; 

  } catch (error) {
    console.error(`Unexpected error in getGroupMembershipDetails for user ${userId}, group ${groupId}:`, error);
    return null; 
  }
};

/**
 * Calculates the event attendance statistics for a specific member in a group
 * using a database function for efficiency.
 * Considers only past events that occurred after the member joined.
 *
 * @param groupId The ID of the group.
 * @param userId The ID of the user.
 * @returns Promise resolving to an object { attendanceRate: number, eventsConsidered: number } or null if error calling RPC.
 */
export const getMemberAttendanceStats = async (
  groupId: string,
  userId: string | undefined
): Promise<{ attendanceRate: number; eventsConsidered: number } | null> => {
  if (!userId || !groupId) {
    return null; 
  }

  const supabase = createClient();

  try {
    // Chamar a função do banco de dados via RPC
    const { data, error } = await supabase.rpc('calculate_member_attendance', {
      p_group_id: groupId,
      p_user_id: userId,
    });

    if (error) {
      console.error(`Error calling calculate_member_attendance RPC for user ${userId}, group ${groupId}:`, error);
      throw error; 
    }

    const statsData = data as unknown;

    // Re-declarar interface localmente se não estiver mais globalmente
    interface MemberAttendanceStats {
      attendanceRate: number;
      eventsConsidered: number;
    }

    if (
      statsData && 
      typeof statsData === 'object' && 
      'attendanceRate' in statsData && 
      typeof statsData.attendanceRate === 'number' &&
      'eventsConsidered' in statsData &&
      typeof statsData.eventsConsidered === 'number'
    ) {
        const typedStats = statsData as MemberAttendanceStats;
         return {
            attendanceRate: typedStats.attendanceRate,
            eventsConsidered: typedStats.eventsConsidered,
         };
    } else {
         console.warn(`Unexpected response from calculate_member_attendance RPC:`, data);
         return null; 
    }

  } catch (error) {
    console.error(`Unexpected error in getMemberAttendanceStats (RPC call) for user ${userId}, group ${groupId}:`, error);
    return null;
  }
};

/**
 * Fetches basic details of a group invite using the token, including the group name.
 * Does not validate expiration or usage, intended for display purposes before accepting.
 *
 * @param {string} token The invitation token.
 * @returns {Promise<{ groupId: string; groupName: string | null } | null>} Invite details or null if token not found.
 * @throws {Error} If there's a DB error.
 */
export const getInviteDetailsByToken = async (token: string): Promise<{ groupId: string; groupName: string | null } | null> => {
  if (!token) return null;

  const supabase = createClient();

  try {
    const { data: invite, error: inviteError } = await supabase
      .from('group_invites')
      .select(`
        group_id,
        groups ( name )
      `)
      .eq('token', token)
      .maybeSingle();

    if (inviteError) {
      console.error(`Error fetching invite details for token ${token}:`, inviteError);
      return null;
    }

    if (!invite || !invite.groups) {
      console.warn(`Invite not found or associated group missing for token: ${token}`);
      return null;
    }

    return {
      groupId: invite.group_id,
      groupName: invite.groups.name,
    };

  } catch (error) {
    console.error("Unexpected error fetching invite details:", error);
    return null;
  }
};

// --- FUNÇÃO RESTAURADA: updateEvent ---
/**
 * Updates an existing event.
 * Requires the calling user to be an admin of the event's group (enforced by RLS).
 * 
 * @param eventId The ID of the event to update.
 * @param eventData An object containing the event fields to update.
 * @returns Promise resolving when the update is complete.
 * @throws Error if user is not authenticated, not an admin, or DB error occurs.
 */
export const updateEvent = async (
    eventId: string, 
    eventData: Partial<Omit<Event, 'id' | 'groupId' | 'attendees' | 'createdAt'>> // Dados atualizáveis
): Promise<void> => {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        console.error("User not authenticated for updateEvent", authError);
        throw new Error("User not authenticated");
    }

    // Mapear para nomes de coluna do DB (se necessário)
    const dbUpdatePayload: Partial<Database['public']['Tables']['events']['Update']> = {
        title: eventData.title,
        description: eventData.description,
        location: eventData.location,
        event_date: eventData.date,
        event_time: eventData.time,
        is_periodic: eventData.isPeriodic,
        frequency: eventData.frequency,
        notify_before: eventData.notifyBefore,
        // group_id e created_at não devem ser atualizados aqui
    };

    // RLS na tabela 'events' deve garantir que apenas admins do grupo podem atualizar
    // e também que o grupo está ativo (após nossa atualização de RLS)
    const { error } = await supabase
        .from('events')
        .update(dbUpdatePayload)
        .eq('id', eventId);

    if (error) {
        console.error(`Error updating event ${eventId}:`, error);
        // Check for RLS violation error (code 42501 in PostgreSQL)
        if (error.code === '42501') {
            throw new Error("Permission denied. Only group admins can update events in active groups.");
        }
        throw error;
    }

    console.log(`Event ${eventId} updated successfully.`);
};
// --- FIM DA FUNÇÃO RESTAURADA: updateEvent ---

// Fim do arquivo (Garante que não há código truncado)