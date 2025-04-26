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
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { User, Group, Event } from "@/lib/types"; // Import types

interface MemberDetailsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  groupId: string;
  memberSince?: string; // Data de entrada no grupo (opcional)
}

// Placeholder functions/data (replace with actual data fetching)
const getCurrentUser = (): User | null => {
  // TODO: Replace with actual API call to get current user
  console.warn("Placeholder function getCurrentUser called");
  return null; 
};

const getGroupById = (groupId: string): Group | null => {
  // TODO: Replace with actual API call to get group by ID
  console.warn(`Placeholder function getGroupById called for group ${groupId}`);
  return null; 
};

const getGroupEvents = (groupId: string): Event[] => {
  // TODO: Replace with actual API call to get group events
  console.warn(`Placeholder function getGroupEvents called for group ${groupId}`);
  return []; 
};

const getUserById = (userId: string): User | null => {
  // TODO: Replace with actual API call to get user by ID
  console.warn(`Placeholder function getUserById called for user ${userId}`);
  return null; 
};

const isGroupAdmin = (userId: string | undefined, groupId: string): boolean => {
  // TODO: Replace with actual logic, potentially involving API calls or checking group/user data
  console.warn(`Placeholder function isGroupAdmin called for user ${userId} and group ${groupId}`);
  return false; 
};

export function MemberDetails({ 
  open, 
  onOpenChange, 
  userId, 
  groupId,
  memberSince = "01/01/2025" // valor padrão simulado
}: MemberDetailsProps) {
  const currentUser = getCurrentUser();
  const isAdmin = isGroupAdmin(currentUser?.id, groupId);
  const groupEvents = getGroupEvents(groupId);
  
  const [user, setUser] = useState<Partial<User> & { whatsapp?: string; showWhatsapp?: boolean; isAdmin?: boolean }>({ 
    id: userId,
    name: "Carregando...", // Initial placeholder name
    avatar: "",
    whatsapp: undefined,
    isAdmin: false,
    sportPreferences: [],
    showWhatsapp: false,
  });
  
  useEffect(() => {
    if (open) {
      // TODO: Implement actual user data fetching here
      const realUser = getUserById(userId); 
      const groupData = getGroupById(groupId); 

      if (realUser) {
        setUser({
          id: userId,
          name: realUser.name,
          avatar: realUser.avatar,
          whatsapp: "...", // TODO: Get real whatsapp
          isAdmin: groupData?.admins.includes(userId) || false,
          sportPreferences: realUser.sportPreferences ?? [], // Ensure array even if undefined
          showWhatsapp: true, // TODO: Determine based on data
        });
      } else {
         setUser({
           id: userId,
           name: "Membro",
           avatar: "",
           whatsapp: undefined,
           isAdmin: groupData?.admins.includes(userId) || false,
           sportPreferences: [],
           showWhatsapp: false,
         });
      }
    }
  }, [userId, open, groupId]);
  
  // Calcular estatísticas de participação
  const totalGroupEvents = groupEvents.length;
  const userAttendedEvents = groupEvents.filter((event: Event) => // Add Event type
    event.attendees.some((a: { userId: string; status: string }) => a.userId === userId && a.status === 'confirmed') // Add type for attendee
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
      <DrawerContent className="max-h-[85vh] overflow-auto">
        <div className="mx-auto w-full max-w-md">
          <DrawerHeader className="pt-5">
            <DrawerTitle className="text-xl text-center">Perfil do Membro</DrawerTitle>
          </DrawerHeader>
          
          <div className="px-4">
            <div className="flex flex-col items-center mt-2">
              <Avatar className="h-24 w-24">
                {user.avatar ? (
                  <AvatarImage 
                    src={user.avatar} 
                    alt={user.name ?? 'Avatar'} // Add fallback for alt
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <AvatarFallback className="text-xl">
                    {user.name?.split(" ").map((n) => n[0]).join("") ?? 'M'} // Handle potential undefined name
                  </AvatarFallback>
                )}
              </Avatar>
              
              <h2 className="text-xl font-bold mt-3">{user.name ?? 'Nome Indisponível'}</h2>
              
              <div className="flex items-center gap-2 mt-1">
                {user.isAdmin && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" /> Admin
                  </Badge>
                )}
              </div>
              
              {user.showWhatsapp && user.whatsapp && ( // Check if whatsapp exists
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-3 gap-1"
                  onClick={() => window.open(`https://wa.me/${user.whatsapp?.replace(/\D/g, '')}`, '_blank')} // Optional chaining on whatsapp
                >
                  <PhoneCall className="h-4 w-4" /> WhatsApp
                </Button>
              )}
            </div>
            
            <Separator className="my-4" />
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Data de entrada no grupo</h3>
                <p className="font-medium">{memberSince}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Preferências esportivas</h3>
                <div className="flex flex-wrap gap-2">
                  {user.sportPreferences && user.sportPreferences.length > 0 ? (
                     user.sportPreferences.map((pref, i) => ( 
                      <Badge key={i} variant="outline" className="capitalize">
                        {pref.sport} - {pref.position}
                      </Badge>
                     ))
                   ) : (
                      <p className="text-sm text-muted-foreground">Nenhuma preferência informada.</p>
                   )}
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
                <div className="flex flex-wrap gap-2">
                  {consecutiveAttendance >= 3 && (
                    <Badge className="flex items-center gap-1 bg-amber-500">
                      <Trophy className="h-3 w-3" /> Presença constante
                    </Badge>
                  )}
                  
                  {isLongestMember && (
                    <Badge className="flex items-center gap-1 bg-blue-500">
                      <Medal className="h-3 w-3" /> Membro mais antigo
                    </Badge>
                  )}
                  
                  {attendanceRate >= 80 && (
                    <Badge className="flex items-center gap-1 bg-green-500">
                      <CalendarCheck className="h-3 w-3" /> 80%+ de presença
                    </Badge>
                  )}
                </div>
              </div>
              
              {isAdmin && userId !== currentUser?.id && (
                <div className="pt-2 mb-6">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Ações administrativas</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="outline" 
                      className="w-full gap-1"
                      onClick={promoteMember}
                    >
                      <UserCog className="h-4 w-4" /> Promover a admin
                    </Button>
                    <Button 
                      variant="destructive" 
                      className="w-full gap-1"
                      onClick={removeMember}
                    >
                      <UserX className="h-4 w-4" /> Remover do grupo
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <DrawerFooter className="pt-2">
            <DrawerClose asChild>
              <Button variant="outline" className="w-full">Fechar</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
} 