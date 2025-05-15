

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."event_attendee_status" AS ENUM (
    'confirmed',
    'declined',
    'pending'
);


ALTER TYPE "public"."event_attendee_status" OWNER TO "postgres";


CREATE TYPE "public"."event_frequency" AS ENUM (
    'weekly',
    'biweekly',
    'monthly'
);


ALTER TYPE "public"."event_frequency" OWNER TO "postgres";


CREATE TYPE "public"."notification_type" AS ENUM (
    'info',
    'success',
    'warning',
    'error'
);


ALTER TYPE "public"."notification_type" OWNER TO "postgres";


CREATE TYPE "public"."sport_type" AS ENUM (
    'futebol',
    'basquete',
    'vôlei',
    'tênis',
    'corrida',
    'ciclismo',
    'natação',
    'handebol',
    'futsal',
    'beach_tennis',
    'outro'
);


ALTER TYPE "public"."sport_type" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_member_attendance"("p_group_id" "uuid", "p_user_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_joined_at timestamp with time zone;
  v_events_considered integer := 0;
  v_confirmed_count integer := 0;
  v_attendance_rate integer := 0;
BEGIN
  -- 1. Get member's joined_at date
  SELECT joined_at INTO v_joined_at
  FROM public.group_members
  WHERE group_id = p_group_id AND user_id = p_user_id;

  -- If member not found, return 0 stats
  IF NOT FOUND THEN
    RETURN jsonb_build_object('attendanceRate', 0, 'eventsConsidered', 0);
  END IF;

  -- Ensure joined_at is valid (though DB constraint should handle this)
  IF v_joined_at IS NULL THEN
     RETURN jsonb_build_object('attendanceRate', 0, 'eventsConsidered', 0);
  END IF;

  -- 2. Count relevant past events (occurred on or after member joined)
  SELECT COUNT(*) INTO v_events_considered
  FROM public.events
  WHERE group_id = p_group_id
    AND event_date < CURRENT_DATE -- Past events
    AND event_date >= date(v_joined_at); -- On or after joining (cast timestamp to date)

  -- If no relevant events, return 0 stats
  IF v_events_considered = 0 THEN
    RETURN jsonb_build_object('attendanceRate', 0, 'eventsConsidered', 0);
  END IF;

  -- 3. Count confirmed attendances for those relevant events
  SELECT COUNT(*) INTO v_confirmed_count
  FROM public.event_attendees ea
  JOIN public.events e ON ea.event_id = e.id
  WHERE ea.user_id = p_user_id
    AND ea.status = 'confirmed'
    AND e.group_id = p_group_id -- Redundant due to join, but safe
    AND e.event_date < CURRENT_DATE
    AND e.event_date >= date(v_joined_at); -- Ensure only relevant events counted

  -- 4. Calculate rate (avoid division by zero, though checked above)
  v_attendance_rate := round((v_confirmed_count * 100.0) / v_events_considered);

  -- 5. Return JSON object
  RETURN jsonb_build_object('attendanceRate', v_attendance_rate, 'eventsConsidered', v_events_considered);

EXCEPTION
  WHEN others THEN
    -- Log error maybe? For now, return null or 0 on any unexpected error
    RAISE WARNING 'Error in calculate_member_attendance for group %, user %: %', p_group_id, p_user_id, SQLERRM;
    RETURN jsonb_build_object('attendanceRate', 0, 'eventsConsidered', 0); -- Or NULL depending on desired frontend handling
END;
$$;


ALTER FUNCTION "public"."calculate_member_attendance"("p_group_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_event_details_with_attendees"("_event_id" "uuid") RETURNS "json"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  event_details json;
  group_details json;
  attendees_details json;
  _is_admin boolean;
  current_user_id uuid := auth.uid();
BEGIN
  -- Get event details (Corrigido to_char para time)
  SELECT json_build_object(
      'id', e.id,
      'groupId', e.group_id,
      'title', e.title,
      'description', e.description,
      'location', e.location,
      'date', to_char(e.event_date, 'YYYY-MM-DD'),
      'time', COALESCE(e.event_time::text, null), -- Usa cast para text
      'isPeriodic', e.is_periodic,
      'frequency', e.frequency,
      'notifyBefore', e.notify_before,
      'createdAt', e.created_at
    )
  INTO event_details
  FROM public.events e
  WHERE e.id = _event_id;

  -- Get group details
  SELECT json_build_object(
      'id', g.id,
      'name', g.name,
      'image_url', g.image_url
    )
  INTO group_details
  FROM public.groups g
  JOIN public.events e ON e.group_id = g.id
  WHERE e.id = _event_id;
  
  -- Check if the current user is an admin of the group
  SELECT EXISTS (
    SELECT 1
    FROM public.group_members gm
    WHERE gm.group_id = (SELECT group_id FROM public.events WHERE id = _event_id)
      AND gm.user_id = current_user_id
      AND gm.is_admin = TRUE
  )
  INTO _is_admin;

  -- Get attendees details with profile info
  SELECT json_agg(
    json_build_object(
      'userId', ea.user_id,
      'status', ea.status,
      'profile', json_build_object(
        'name', p.name, 
        'last_name', p.last_name,
        'nickname', p.nickname,
        'avatar_url', p.avatar_url
      )
    )
  )
  INTO attendees_details
  FROM public.event_attendees ea
  JOIN public.profiles p ON ea.user_id = p.id
  WHERE ea.event_id = _event_id;

  -- Return the combined JSON object
  RETURN json_build_object(
    'event', event_details,
    'group', group_details,
    'attendees', COALESCE(attendees_details, '[]'::json), -- Return empty array if no attendees
    'isAdmin', _is_admin
  );
END;
$$;


ALTER FUNCTION "public"."get_event_details_with_attendees"("_event_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, name, last_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'name',
    NEW.raw_user_meta_data ->> 'last_name'
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = timezone('utc', now()); -- Ensure UTC
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_group_admin"("p_group_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM group_members gm
    WHERE gm.group_id = p_group_id
      AND gm.user_id = auth.uid()
      AND gm.is_admin = true
  );
$$;


ALTER FUNCTION "public"."is_group_admin"("p_group_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_group_admin"("p_group_id" "uuid", "p_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    AS $$
DECLARE
  is_admin_flag boolean;
BEGIN
  SELECT gm.is_admin
  FROM public.group_members gm -- Assuming group_members is in the public schema
  WHERE gm.group_id = p_group_id AND gm.user_id = p_user_id
  INTO is_admin_flag;
  
  -- Return true if is_admin is true, otherwise false (handles null as false)
  RETURN COALESCE(is_admin_flag, false);
END;
$$;


ALTER FUNCTION "public"."is_group_admin"("p_group_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_group_member"("p_group_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM group_members gm
    WHERE gm.group_id = p_group_id
      AND gm.user_id = auth.uid()
  );
$$;


ALTER FUNCTION "public"."is_group_member"("p_group_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_group_member"("p_group_id" "uuid", "p_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    AS $$
DECLARE
  is_member boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM public.group_members gm -- Assuming group_members is in the public schema
    WHERE gm.group_id = p_group_id AND gm.user_id = p_user_id
  ) INTO is_member;
  RETURN is_member;
END;
$$;


ALTER FUNCTION "public"."is_group_member"("p_group_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."leave_group_transaction"("p_group_id" "uuid", "p_user_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    member_count INTEGER;
    admin_count INTEGER;
    is_member BOOLEAN;
    v_is_admin BOOLEAN;
    result JSONB := jsonb_build_object('should_delete', FALSE, 'image_url_to_delete', null);
    v_image_url TEXT;
BEGIN
    -- Verificar se o usuário é membro
    SELECT EXISTS (
        SELECT 1 FROM public.group_members WHERE group_id = p_group_id AND user_id = p_user_id
    ) INTO is_member;

    IF NOT is_member THEN
        RAISE EXCEPTION 'User % is not a member of group %.', p_user_id, p_group_id;
    END IF;

    -- Bloquear e Contar membros e admins
    LOCK TABLE public.group_members IN ROW EXCLUSIVE MODE;
    SELECT COUNT(*), COUNT(*) FILTER (WHERE is_admin = TRUE)
    INTO member_count, admin_count
    FROM public.group_members WHERE group_id = p_group_id;

    -- Verificar se o usuário atual é admin
    SELECT is_admin INTO v_is_admin FROM public.group_members WHERE group_id = p_group_id AND user_id = p_user_id;

    -- Lógica principal
    IF member_count = 1 THEN
        -- Último membro: Buscar URL e SINALIZAR exclusão do grupo com URL
        -- NÃO deletar o membro aqui, o CASCADE fará isso após deletar o grupo.
        SELECT image_url INTO v_image_url FROM public.groups WHERE id = p_group_id;

        result := jsonb_build_object('should_delete', TRUE, 'image_url_to_delete', v_image_url);
        RAISE LOG 'Last member % is leaving group %. Group deletion required. Image URL: %', p_user_id, p_group_id, v_image_url;

    ELSIF v_is_admin AND admin_count = 1 THEN
        -- Último admin: remover membro e DESATIVAR grupo
        -- A remoção do membro aqui está OK, pois não precisamos mais da permissão dele depois.
        DELETE FROM public.group_members WHERE group_id = p_group_id AND user_id = p_user_id;
        UPDATE public.groups SET is_active = FALSE WHERE id = p_group_id;
        RAISE LOG 'Group % deactivated because last admin % left.', p_group_id, p_user_id;

    ELSE
        -- Caso normal: apenas remover o membro
        DELETE FROM public.group_members WHERE group_id = p_group_id AND user_id = p_user_id;
        RAISE LOG 'User % left group %.', p_user_id, p_group_id;
    END IF;

    RETURN result;

END;
$$;


ALTER FUNCTION "public"."leave_group_transaction"("p_group_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."event_attendees" (
    "event_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "status" "public"."event_attendee_status" DEFAULT 'pending'::"public"."event_attendee_status" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."event_attendees" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "location" "text",
    "event_date" "date" NOT NULL,
    "event_time" time with time zone,
    "is_periodic" boolean DEFAULT false NOT NULL,
    "frequency" "public"."event_frequency",
    "notify_before" integer DEFAULT 2,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "title_length" CHECK (("char_length"("title") >= 3))
);


ALTER TABLE "public"."events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_invites" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid" NOT NULL,
    "token" "text" NOT NULL,
    "created_by" "uuid" NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "used_by" "uuid",
    "used_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."group_invites" OWNER TO "postgres";


COMMENT ON TABLE "public"."group_invites" IS 'Stores unique, time-limited invitation tokens for groups.';



COMMENT ON COLUMN "public"."group_invites"."id" IS 'Unique identifier for the invite.';



COMMENT ON COLUMN "public"."group_invites"."group_id" IS 'The group this invite belongs to.';



COMMENT ON COLUMN "public"."group_invites"."token" IS 'The unique invitation token string.';



COMMENT ON COLUMN "public"."group_invites"."created_by" IS 'The admin user who created the invite.';



COMMENT ON COLUMN "public"."group_invites"."expires_at" IS 'Timestamp when the invite token becomes invalid.';



COMMENT ON COLUMN "public"."group_invites"."used_by" IS 'The user who accepted the invite.';



COMMENT ON COLUMN "public"."group_invites"."used_at" IS 'Timestamp when the invite was accepted.';



COMMENT ON COLUMN "public"."group_invites"."created_at" IS 'Timestamp when the invite was created.';



CREATE TABLE IF NOT EXISTS "public"."group_members" (
    "group_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "is_admin" boolean DEFAULT false NOT NULL,
    "joined_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."group_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."groups" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "sport" "public"."sport_type" NOT NULL,
    "image_url" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    CONSTRAINT "name_length" CHECK (("char_length"("name") >= 3))
);


ALTER TABLE "public"."groups" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "type" "public"."notification_type" DEFAULT 'info'::"public"."notification_type" NOT NULL,
    "related_event_id" "uuid",
    "related_group_id" "uuid",
    "is_read" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "avatar_url" "text",
    "is_premium" boolean DEFAULT false NOT NULL,
    "sport_preferences" "jsonb",
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "phone_number" "text",
    "last_name" "text",
    "nickname" "text",
    "fcm_tokens" "text"[],
    CONSTRAINT "name_length" CHECK (("char_length"("name") >= 3))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


COMMENT ON COLUMN "public"."profiles"."last_name" IS 'Sobrenome do usuário.';



COMMENT ON COLUMN "public"."profiles"."nickname" IS 'Apelido opcional do usuário.';



ALTER TABLE ONLY "public"."event_attendees"
    ADD CONSTRAINT "event_attendees_pkey" PRIMARY KEY ("event_id", "user_id");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."group_invites"
    ADD CONSTRAINT "group_invites_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."group_invites"
    ADD CONSTRAINT "group_invites_token_key" UNIQUE ("token");



ALTER TABLE ONLY "public"."group_members"
    ADD CONSTRAINT "group_members_pkey" PRIMARY KEY ("group_id", "user_id");



ALTER TABLE ONLY "public"."groups"
    ADD CONSTRAINT "groups_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_group_invites_expires_at" ON "public"."group_invites" USING "btree" ("expires_at");



CREATE INDEX "idx_group_invites_group_id" ON "public"."group_invites" USING "btree" ("group_id");



CREATE INDEX "idx_group_invites_token" ON "public"."group_invites" USING "btree" ("token");



CREATE OR REPLACE TRIGGER "on_groups_update" BEFORE UPDATE ON "public"."groups" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



ALTER TABLE ONLY "public"."event_attendees"
    ADD CONSTRAINT "event_attendees_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_attendees"
    ADD CONSTRAINT "event_attendees_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."group_invites"
    ADD CONSTRAINT "group_invites_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."group_invites"
    ADD CONSTRAINT "group_invites_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."group_invites"
    ADD CONSTRAINT "group_invites_used_by_fkey" FOREIGN KEY ("used_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."group_members"
    ADD CONSTRAINT "group_members_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."group_members"
    ADD CONSTRAINT "group_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."groups"
    ADD CONSTRAINT "groups_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_related_event_id_fkey" FOREIGN KEY ("related_event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_related_group_id_fkey" FOREIGN KEY ("related_group_id") REFERENCES "public"."groups"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Allow admin delete access" ON "public"."events" FOR DELETE TO "authenticated" USING (("public"."is_group_admin"("group_id") AND ( SELECT "groups"."is_active"
   FROM "public"."groups"
  WHERE ("groups"."id" = "events"."group_id"))));



CREATE POLICY "Allow admin delete access" ON "public"."groups" FOR DELETE TO "authenticated" USING ("public"."is_group_admin"("id"));



CREATE POLICY "Allow admin insert access" ON "public"."group_invites" FOR INSERT TO "authenticated" WITH CHECK (("public"."is_group_admin"("group_id") AND ( SELECT "groups"."is_active"
   FROM "public"."groups"
  WHERE ("groups"."id" = "group_invites"."group_id"))));



CREATE POLICY "Allow admin update access" ON "public"."events" FOR UPDATE TO "authenticated" USING ("public"."is_group_admin"("group_id")) WITH CHECK (("public"."is_group_admin"("group_id") AND ( SELECT "groups"."is_active"
   FROM "public"."groups"
  WHERE ("groups"."id" = "events"."group_id"))));



CREATE POLICY "Allow admin update access" ON "public"."group_members" FOR UPDATE TO "authenticated" USING ("public"."is_group_admin"("group_id")) WITH CHECK (("public"."is_group_admin"("group_id") AND ( SELECT "groups"."is_active"
   FROM "public"."groups"
  WHERE ("groups"."id" = "group_members"."group_id"))));



CREATE POLICY "Allow admin update access" ON "public"."groups" FOR UPDATE TO "authenticated" USING ("public"."is_group_admin"("id")) WITH CHECK (("public"."is_group_admin"("id") AND "is_active"));



CREATE POLICY "Allow authenticated insert access" ON "public"."groups" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Allow authenticated read access" ON "public"."group_invites" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated read access" ON "public"."groups" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow authenticated read access" ON "public"."profiles" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow creator delete access" ON "public"."groups" FOR DELETE USING (("auth"."uid"() = "created_by"));



CREATE POLICY "Allow creator to insert self as admin" ON "public"."group_members" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."uid"() = "user_id") AND ("is_admin" = true) AND ("group_id" IN ( SELECT "g"."id"
   FROM "public"."groups" "g"
  WHERE ("g"."created_by" = "auth"."uid"()))) AND ( SELECT "groups"."is_active"
   FROM "public"."groups"
  WHERE ("groups"."id" = "group_members"."group_id"))));



CREATE POLICY "Allow group admins update/delete access" ON "public"."events" USING ((EXISTS ( SELECT 1
   FROM "public"."group_members" "gm"
  WHERE (("gm"."group_id" = "events"."group_id") AND ("gm"."user_id" = "auth"."uid"()) AND ("gm"."is_admin" = true)))));



CREATE POLICY "Allow group members insert access" ON "public"."events" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."group_members" "gm"
  WHERE (("gm"."group_id" = "events"."group_id") AND ("gm"."user_id" = "auth"."uid"())))));



CREATE POLICY "Allow group members read access" ON "public"."events" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."group_members" "gm"
  WHERE (("gm"."group_id" = "events"."group_id") AND ("gm"."user_id" = "auth"."uid"())))));



CREATE POLICY "Allow individual read access" ON "public"."notifications" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow individual update access" ON "public"."notifications" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow individual update access" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "id"));



CREATE POLICY "Allow insert access to group members" ON "public"."events" FOR INSERT TO "authenticated" WITH CHECK (("public"."is_group_member"("group_id") AND ( SELECT "groups"."is_active"
   FROM "public"."groups"
  WHERE ("groups"."id" = "events"."group_id"))));



CREATE POLICY "Allow members read access" ON "public"."group_members" FOR SELECT TO "authenticated" USING ("public"."is_group_member"("group_id"));



CREATE POLICY "Allow members to respond to events in active groups" ON "public"."event_attendees" USING ("public"."is_group_member"(( SELECT "events"."group_id"
   FROM "public"."events"
  WHERE ("events"."id" = "event_attendees"."event_id")))) WITH CHECK ((("auth"."uid"() = "user_id") AND ( SELECT "g"."is_active"
   FROM ("public"."groups" "g"
     JOIN "public"."events" "e" ON (("g"."id" = "e"."group_id")))
  WHERE ("e"."id" = "event_attendees"."event_id"))));



CREATE POLICY "Allow read access to group members" ON "public"."event_attendees" FOR SELECT TO "authenticated" USING (("event_id" IN ( SELECT "ev"."id"
   FROM "public"."events" "ev"
  WHERE "public"."is_group_member"("ev"."group_id"))));



CREATE POLICY "Allow read access to group members" ON "public"."events" FOR SELECT TO "authenticated" USING ("public"."is_group_member"("group_id"));



CREATE POLICY "Allow read access to members" ON "public"."groups" FOR SELECT TO "authenticated" USING ("public"."is_group_member"("id"));



CREATE POLICY "Allow self delete attendance" ON "public"."event_attendees" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Allow self or admin delete access" ON "public"."group_members" FOR DELETE TO "authenticated" USING ((("auth"."uid"() = "user_id") OR "public"."is_group_admin"("group_id")));



CREATE POLICY "Permitir usuários autenticados inserirem a si mesmos como memb" ON "public"."group_members" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."uid"() = "user_id") AND ( SELECT "groups"."is_active"
   FROM "public"."groups"
  WHERE ("groups"."id" = "group_members"."group_id"))));



CREATE POLICY "Restrict deletes" ON "public"."group_invites" FOR DELETE TO "authenticated" USING (false);



CREATE POLICY "Restrict deletes" ON "public"."notifications" FOR DELETE USING (false);



CREATE POLICY "Restrict deletes" ON "public"."profiles" FOR DELETE USING (false);



CREATE POLICY "Restrict inserts" ON "public"."notifications" FOR INSERT WITH CHECK (false);



CREATE POLICY "Restrict inserts" ON "public"."profiles" FOR INSERT WITH CHECK (false);



CREATE POLICY "Restrict updates" ON "public"."group_invites" FOR UPDATE TO "authenticated" USING (false);



ALTER TABLE "public"."event_attendees" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_invites" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."groups" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";











































































































































































GRANT ALL ON FUNCTION "public"."calculate_member_attendance"("p_group_id" "uuid", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_member_attendance"("p_group_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_member_attendance"("p_group_id" "uuid", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_event_details_with_attendees"("_event_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_event_details_with_attendees"("_event_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_event_details_with_attendees"("_event_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_group_admin"("p_group_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_group_admin"("p_group_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_group_admin"("p_group_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_group_admin"("p_group_id" "uuid", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_group_admin"("p_group_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_group_admin"("p_group_id" "uuid", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_group_member"("p_group_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_group_member"("p_group_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_group_member"("p_group_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_group_member"("p_group_id" "uuid", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_group_member"("p_group_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_group_member"("p_group_id" "uuid", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."leave_group_transaction"("p_group_id" "uuid", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."leave_group_transaction"("p_group_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."leave_group_transaction"("p_group_id" "uuid", "p_user_id" "uuid") TO "service_role";


















GRANT ALL ON TABLE "public"."event_attendees" TO "anon";
GRANT ALL ON TABLE "public"."event_attendees" TO "authenticated";
GRANT ALL ON TABLE "public"."event_attendees" TO "service_role";



GRANT ALL ON TABLE "public"."events" TO "anon";
GRANT ALL ON TABLE "public"."events" TO "authenticated";
GRANT ALL ON TABLE "public"."events" TO "service_role";



GRANT ALL ON TABLE "public"."group_invites" TO "anon";
GRANT ALL ON TABLE "public"."group_invites" TO "authenticated";
GRANT ALL ON TABLE "public"."group_invites" TO "service_role";



GRANT ALL ON TABLE "public"."group_members" TO "anon";
GRANT ALL ON TABLE "public"."group_members" TO "authenticated";
GRANT ALL ON TABLE "public"."group_members" TO "service_role";



GRANT ALL ON TABLE "public"."groups" TO "anon";
GRANT ALL ON TABLE "public"."groups" TO "authenticated";
GRANT ALL ON TABLE "public"."groups" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
