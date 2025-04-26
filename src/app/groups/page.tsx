"use client";

import React, { useState, useEffect } from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { Button } from "@/components/ui/button";
import { GroupCard } from "@/components/cards/GroupEventCards";
import { Plus } from "lucide-react";
import Link from "next/link";
import { Group } from "@/lib/types";
import { createClient } from '@/lib/supabase/client';
import { User as AuthUserType } from "@supabase/supabase-js";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { getUserGroups } from "@/services/api";

export default function GroupsListPage() {
  const supabase = createClient();
  const [authUser, setAuthUser] = useState<AuthUserType | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      setLoadingAuth(true);
      const { data: { user } } = await supabase.auth.getUser();
      setAuthUser(user);
      setLoadingAuth(false);
    };
    getUser();
  }, [supabase]);

  // Fetch user groups using React Query
  const { 
    data: userGroupsData, 
    isLoading: isLoadingGroups, 
    error: groupsError 
  } = useQuery<Group[]>({ 
    queryKey: ['userGroups', authUser?.id],
    queryFn: getUserGroups,
    enabled: !!authUser,
    staleTime: 5 * 60 * 1000,
  });
  
  // Combine loading states
  const isLoading = loadingAuth || (!!authUser && isLoadingGroups);

  // Show loading skeleton while auth OR group data is loading
  if (isLoading) {
    return (
      <MobileLayout
        header={<TopNav title="Meus Grupos" showNotifications />}
        footer={<BottomNav />}
      >
        <div className="space-y-6 p-4">
          {/* Skeleton for groups list */}
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </MobileLayout>
    );
  }
  
  // Use fetched groups data, default to empty array if undefined/null
  const userGroups = userGroupsData ?? [];

  return (
    <MobileLayout
      header={<TopNav title="Meus Grupos" showNotifications />}
      footer={<BottomNav />}
    >
      <div className="space-y-6 p-4"> 
        {/* Check for empty state or error after loading */}
        {!isLoading && userGroups.length === 0 ? ( 
          <div className="text-center py-10 space-y-4">
             {groupsError ? (
                <p className="text-destructive">Erro ao carregar grupos.</p>
             ) : (
                <p className="text-muted-foreground">
                  Você ainda não participa de nenhum grupo.
                </p>
             )}
            <Button asChild>
              <Link href="/groups/create">
                <Plus className="h-4 w-4 mr-1" /> Criar Grupo
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {userGroups.map((group) => (
              <GroupCard
                key={group.id}
                id={group.id}
                name={group.name}
                description={group.description ?? ''} // Handle null description
                sport={group.sport}
                image={group.image}
                memberCount={group.memberCount ?? 0} // Use memberCount from API
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Floating button - Render only when not loading */}
      {!isLoading && (
        <div className="fixed right-6 bottom-20 z-20"> {/* Added z-index just in case */}
          <Button 
            size="icon" 
            className="h-14 w-14 rounded-full shadow-lg"
            asChild
          >
            <Link href="/groups/create">
              <Plus className="h-6 w-6" />
            </Link>
          </Button>
        </div>
      )}
    </MobileLayout>
  );
}
