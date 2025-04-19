"use client";

import React from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { getGroupById, isGroupAdmin, getCurrentUser } from "@/lib/mockData";
import { Trash2, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Image from "next/image";

export default function GroupSettingsPage() {
  // Obter o ID do grupo da URL
  const params = useParams();
  const groupId = params.id as string;
  
  // Simulando dados do grupo
  const group = getGroupById(groupId);
  const currentUser = getCurrentUser();
  const isAdmin = isGroupAdmin(currentUser.id, groupId);
  
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);

  if (!group) {
    return (
      <MobileLayout
        header={<TopNav title="Configurações" backHref="/groups" />}
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

  if (!isAdmin) {
    return (
      <MobileLayout
        header={<TopNav title="Configurações" backHref={`/groups/${groupId}`} />}
        footer={<BottomNav />}
      >
        <div className="flex flex-col items-center justify-center h-full py-10 text-center">
          <h2 className="text-xl font-semibold mb-2">Acesso restrito</h2>
          <p className="text-muted-foreground mb-6">
            Apenas administradores podem acessar as configurações do grupo.
          </p>
          <Button asChild>
            <Link href={`/groups/${groupId}`}>Voltar para o Grupo</Link>
          </Button>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout
      header={<TopNav title="Configurações do Grupo" backHref={`/groups/${groupId}`} />}
      footer={<BottomNav />}
    >
      <div className="space-y-8">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Informações do Grupo</h2>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Grupo</Label>
              <Input
                id="name"
                defaultValue={group.name}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                defaultValue={group.description}
                className="min-h-[100px]"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="sport">Esporte</Label>
              <Select defaultValue={group.sport}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="futebol">Futebol</SelectItem>
                  <SelectItem value="basquete">Basquete</SelectItem>
                  <SelectItem value="vôlei">Vôlei</SelectItem>
                  <SelectItem value="tênis">Tênis</SelectItem>
                  <SelectItem value="corrida">Corrida</SelectItem>
                  <SelectItem value="ciclismo">Ciclismo</SelectItem>
                  <SelectItem value="natação">Natação</SelectItem>
                  <SelectItem value="handebol">Handebol</SelectItem>
                  <SelectItem value="futsal">Futsal</SelectItem>
                  <SelectItem value="beach_tennis">Beach Tennis</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="image">Imagem do Grupo</Label>
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 rounded-md border border-input flex items-center justify-center overflow-hidden relative">
                  <Image
                    src={group.image}
                    alt="Imagem do grupo"
                    className="object-cover"
                    fill
                    sizes="80px"
                    blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjZTZlNmU2Ii8+PC9zdmc+"
                    placeholder="blur"
                  />
                </div>
                <Button variant="outline" size="sm">
                  Alterar imagem
                </Button>
              </div>
            </div>
            
            <Button className="w-full">
              Salvar Alterações
            </Button>
          </div>
        </div>
        
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Configurações de Notificações</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notify-events">Notificações de eventos</Label>
                <p className="text-sm text-muted-foreground">
                  Receber notificações sobre novos eventos
                </p>
              </div>
              <Switch id="notify-events" defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notify-members">Notificações de membros</Label>
                <p className="text-sm text-muted-foreground">
                  Receber notificações quando novos membros entrarem
                </p>
              </div>
              <Switch id="notify-members" defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notify-changes">Notificações de alterações</Label>
                <p className="text-sm text-muted-foreground">
                  Receber notificações sobre alterações no grupo
                </p>
              </div>
              <Switch id="notify-changes" defaultChecked />
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-destructive">Zona de Perigo</h2>
          
          {!showDeleteConfirm ? (
            <Button 
              variant="destructive" 
              className="w-full"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" /> Excluir Grupo
            </Button>
          ) : (
            <Card className="border-destructive">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-6 w-6 text-destructive flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-medium text-destructive">Tem certeza?</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Esta ação não pode ser desfeita. Todos os dados do grupo, incluindo eventos e mensagens, serão permanentemente excluídos.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-2 justify-end">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    Cancelar
                  </Button>
                  <Button variant="destructive">
                    Excluir Permanentemente
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </MobileLayout>
  );
}
