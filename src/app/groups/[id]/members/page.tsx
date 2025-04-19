"use client";

import React from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MemberCard } from "@/components/cards/NotificationMemberCards";
import { getGroupById, getGroupMembers, isGroupAdmin, getCurrentUser } from "@/lib/mockData";
import { UserPlus, Search, UserMinus, UserCog } from "lucide-react";
import Link from "next/link";
import { InviteDialog } from "@/components/ui-elements/DialogsAndTabs";
import { useParams } from "next/navigation";

export default function GroupMembersPage() {
  // Obter ID do grupo da URL
  const params = useParams();
  const groupId = params.id as string;
  
  // Simulando dados do grupo e membros
  const group = getGroupById(groupId);
  const members = getGroupMembers(groupId);
  const currentUser = getCurrentUser();
  const isAdmin = isGroupAdmin(currentUser.id, groupId);
  
  // Estado para controlar o diálogo de convite
  const [inviteDialogOpen, setInviteDialogOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  if (!group) {
    return (
      <MobileLayout
        header={<TopNav title="Membros" backHref="/groups" />}
        footer={<BottomNav />}
      >
        <div className="flex flex-col items-center justify-center h-full py-10 text-center">
          <h2 className="text-xl font-semibold mb-2">Grupo não encontrado</h2>
          <p className="text-muted-foreground mb-6">
            O grupo que você está procurando não existe ou foi removido.
          </p>
          <Button asChild>
            <Link href="/groups">Voltar para Grupos</Link>
          </Button>
        </div>
      </MobileLayout>
    );
  }

  // Filtrar membros com base na pesquisa
  const filteredMembers = searchQuery 
    ? members.filter(member => 
        member.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : members;

  return (
    <MobileLayout
      header={<TopNav title="Membros do Grupo" backHref={`/groups/${groupId}`} />}
      footer={<BottomNav />}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Membros</h2>
          <div className="flex gap-2">
            {isAdmin && (
              <Button size="sm" onClick={() => setInviteDialogOpen(true)}>
                <UserPlus className="h-4 w-4 mr-1" /> Convidar
              </Button>
            )}
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar membros..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          {filteredMembers.length === 0 ? (
            <p className="text-center py-6 text-muted-foreground">
              {searchQuery ? "Nenhum membro encontrado." : "Este grupo ainda não tem membros."}
            </p>
          ) : (
            <>
              {isAdmin && (
                <div className="pb-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Administradores</h3>
                </div>
              )}
              
              {isAdmin && filteredMembers
                .filter(member => group.admins.includes(member.id))
                .map(member => (
                  <div key={member.id} className="relative">
                    <MemberCard
                      id={member.id}
                      name={member.name}
                      avatar={member.avatar}
                      isAdmin={true}
                      groupId={groupId}
                    />
                    {member.id !== group.createdBy && (
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <UserMinus className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))
              }
              
              {isAdmin && (
                <div className="pt-4 pb-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Membros</h3>
                </div>
              )}
              
              {filteredMembers
                .filter(member => isAdmin ? !group.admins.includes(member.id) : true)
                .map(member => (
                  <div key={member.id} className="relative">
                    <MemberCard
                      id={member.id}
                      name={member.name}
                      avatar={member.avatar}
                      isAdmin={group.admins.includes(member.id)}
                      groupId={groupId}
                    />
                    {isAdmin && (
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <UserCog className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <UserMinus className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))
              }
            </>
          )}
        </div>
      </div>

      <InviteDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        groupName={group.name}
        inviteLink={`https://sportsgroupapp.com/invite/${groupId}`}
      />
    </MobileLayout>
  );
}
