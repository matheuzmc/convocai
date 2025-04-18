import React from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { Button } from "@/components/ui/button";
import { GroupCard } from "@/components/cards/GroupEventCards";
import { Plus } from "lucide-react";
import Link from "next/link";
import { getCurrentUser, getUserGroups } from "@/lib/mockData";

export default function GroupsListPage() {
  // Simulando dados do usuário logado e seus grupos
  const currentUser = getCurrentUser();
  const userGroups = getUserGroups(currentUser.id);

  return (
    <MobileLayout
      header={<TopNav title="Meus Grupos" showNotifications user={currentUser} />}
      footer={<BottomNav />}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Seus Grupos</h2>
          <Button size="sm" asChild>
            <Link href="/groups/create">
              <Plus className="h-4 w-4 mr-1" /> Novo Grupo
            </Link>
          </Button>
        </div>

        {userGroups.length === 0 ? (
          <div className="text-center py-10 space-y-4">
            <p className="text-muted-foreground">
              Você ainda não participa de nenhum grupo.
            </p>
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
                description={group.description}
                sport={group.sport}
                image={group.image}
                memberCount={group.members.length}
              />
            ))}
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
