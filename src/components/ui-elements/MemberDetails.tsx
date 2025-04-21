"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { CalendarCheck, Medal, PhoneCall, ShieldCheck, Trophy, UserCog, UserX } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
} from "@/components/ui/drawer";
import { 
  getCurrentUser,
  getGroupEvents,
  getGroupById,
  isGroupAdmin,
  getUserById
} from "@/lib/mockData";

interface MemberDetailsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  groupId: string;
  memberSince?: string; // Data de entrada no grupo (opcional)
}

export function MemberDetails({ 
  open, 
  onOpenChange, 
  userId, 
  groupId,
  memberSince = "01/01/2025" // valor padrão simulado
}: MemberDetailsProps) {
  const currentUser = getCurrentUser();
  const isAdmin = isGroupAdmin(currentUser.id, groupId);
  const group = getGroupById(groupId);
  const groupEvents = getGroupEvents(groupId);
  
  // Usando useState para gerenciar o estado do usuário
  const [user, setUser] = useState({
    id: userId,
    name: "Nome do Membro",
    avatar: "",
    whatsapp: "(11) 98765-4321",
    isAdmin: group?.admins.includes(userId) || false,
    sportPreferences: [
      { sport: "futebol", position: "Atacante" },
      { sport: "basquete", position: "Ala" }
    ],
    showWhatsapp: true,
  });
  
  // Buscar dados do usuário quando o componente for montado ou quando userId mudar
  useEffect(() => {
    // Resetar o usuário para valores padrão ao abrir o diálogo
    if (open) {
      const realUser = getUserById(userId);
      if (realUser) {
        // Atualizar o estado com os dados reais do usuário
        setUser({
          id: userId,
          name: realUser.name,
          avatar: realUser.avatar,
          whatsapp: "(11) 98765-4321",
          isAdmin: group?.admins.includes(userId) || false,
          sportPreferences: realUser.sportPreferences,
          showWhatsapp: true,
        });
      }
    }
  }, [userId, open, group?.admins]);
  
  // Calcular estatísticas de participação
  const totalGroupEvents = groupEvents.length;
  const userAttendedEvents = groupEvents.filter(event => 
    event.attendees.some(a => a.userId === userId && a.status === 'confirmed')
  ).length;
  
  const attendanceRate = totalGroupEvents > 0 
    ? Math.round((userAttendedEvents / totalGroupEvents) * 100) 
    : 0;
  
  // Simular uma sequência de participações (para conquistas)
  const consecutiveAttendance = 5; // Ex: participou de 5 eventos seguidos
  
  // Verificar se o usuário é o membro mais antigo do grupo
  const isLongestMember = true; // Simulado - normalmente calculado com base na data de entrada
  
  // Promover membro a administrador
  const promoteMember = () => {
    // Lógica para promover membro a administrador
    console.log(`Promovendo ${user.name} a administrador`);
    // Aqui seria implementada a chamada à API
    
    // Fechar o drawer após a ação
    setTimeout(() => {
      onOpenChange(false);
    }, 500);
  };
  
  // Remover membro do grupo
  const removeMember = () => {
    // Lógica para remover membro do grupo
    console.log(`Removendo ${user.name} do grupo`);
    // Aqui seria implementada a chamada à API
    
    // Fechar o drawer após a ação
    setTimeout(() => {
      onOpenChange(false);
    }, 500);
  };
  
  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <DrawerContent className="h-[85vh]">
        <div className="mx-auto w-full max-w-md h-full flex flex-col overflow-hidden">
          <div className="sr-only">
            <DrawerTitle>Perfil do Membro</DrawerTitle>
          </div>
          <div className="px-4 overflow-y-auto flex-1 scrollbar-hide">
            <div className="flex flex-col items-center pt-6">
              <Avatar className="h-20 w-20">
                {user.avatar ? (
                  <AvatarImage 
                    src={user.avatar} 
                    alt={user.name} 
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <AvatarFallback className="text-xl">
                    {user.name.split(" ").map((n) => n[0]).join("")}
                  </AvatarFallback>
                )}
              </Avatar>
              
              <h2 className="text-xl font-bold mt-2">{user.name}</h2>
              
              <div className="flex items-center gap-2 mt-1">
                {user.isAdmin && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" /> Admin
                  </Badge>
                )}
              </div>
              
              {user.showWhatsapp && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2 gap-2"
                  onClick={() => window.open(`https://wa.me/${user.whatsapp.replace(/\D/g, '')}`, '_blank')}
                >
                  <PhoneCall className="h-4 w-4" /> WhatsApp
                </Button>
              )}
            </div>
            
            <Separator className="my-3" />
            
            <div className="space-y-4 pb-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Data de entrada no grupo</h3>
                <p className="font-medium">{memberSince}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Preferências esportivas</h3>
                <div className="flex flex-wrap gap-2">
                  {user.sportPreferences.map((pref, i) => (
                    <Badge key={i} variant="outline" className="capitalize">
                      {pref.sport} - {pref.position}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Participação em eventos</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span>Taxa de presença</span>
                    <span className="font-medium">{attendanceRate}%</span>
                  </div>
                  <Progress value={attendanceRate} className="h-2" />
                  <p className="text-sm text-muted-foreground mt-1">
                    Participou de {userAttendedEvents} de {totalGroupEvents} eventos
                  </p>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Conquistas e distintivos</h3>
                <div className="flex flex-wrap gap-2.5">
                  {consecutiveAttendance >= 3 && (
                    <Badge className="flex items-center gap-1 bg-amber-500">
                      <Trophy className="h-3 w-3 mr-1.5" /> Presença constante
                    </Badge>
                  )}
                  
                  {isLongestMember && (
                    <Badge className="flex items-center gap-1 bg-blue-500">
                      <Medal className="h-3 w-3 mr-1.5" /> Membro mais antigo
                    </Badge>
                  )}
                  
                  {attendanceRate >= 80 && (
                    <Badge className="flex items-center gap-1 bg-green-500">
                      <CalendarCheck className="h-3 w-3 mr-1.5" /> 80%+ de presença
                    </Badge>
                  )}
                </div>
              </div>
              
              {isAdmin && !user.isAdmin && userId !== currentUser.id && (
                <div className="pt-2">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Ações administrativas</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={promoteMember}
                    >
                      <UserCog className="h-4 w-4 mr-1.5" />
                      <span className="whitespace-nowrap text-sm">Tornar admin</span>
                    </Button>
                    <Button 
                      variant="destructive" 
                      className="w-full"
                      onClick={removeMember}
                    >
                      <UserX className="h-4 w-4 mr-1.5" />
                      <span className="whitespace-nowrap text-sm">Remover</span>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
} 