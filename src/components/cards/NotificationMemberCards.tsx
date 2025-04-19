"use client";

import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Bell, Calendar, Clock, User } from "lucide-react";
import { MemberDetailsDialog } from "@/components/ui-elements/MemberDetailsDialog";

interface NotificationCardProps {
  id: string;
  title: string;
  message: string;
  type: 'event' | 'group' | 'member' | 'system' | 'invite';
  isRead: boolean;
  createdAt: string;
}

interface MemberCardProps {
  id: string;
  name: string;
  avatar: string;
  isAdmin?: boolean;
  groupId?: string;
}

export function NotificationCard({
  title,
  message,
  type,
  isRead,
  createdAt
}: NotificationCardProps) {
  // Formatar data para exibição
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getIcon = () => {
    switch (type) {
      case 'event':
        return <Calendar className="h-5 w-5 text-primary" />;
      case 'group':
        return <User className="h-5 w-5 text-primary" />;
      case 'member':
        return <User className="h-5 w-5 text-primary" />;
      case 'invite':
        return <User className="h-5 w-5 text-primary" />;
      case 'system':
        return <Bell className="h-5 w-5 text-primary" />;
      default:
        return <Bell className="h-5 w-5 text-primary" />;
    }
  };

  return (
    <Card className={`overflow-hidden ${!isRead ? 'border-primary' : ''}`}>
      <CardContent className="p-4">
        <div className="flex gap-3">
          <div className="p-2 rounded-full bg-primary/10 h-fit">
            {getIcon()}
          </div>
          <div className="space-y-1 flex-1">
            <div className="flex justify-between items-start">
              <h3 className="font-medium">{title}</h3>
              {!isRead && (
                <Badge variant="default" className="ml-2">
                  Nova
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {message}
            </p>
            <div className="flex items-center text-xs text-muted-foreground">
              <Clock className="h-3 w-3 mr-1" />
              <span>{formatDate(createdAt)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function MemberCard({
  id,
  name,
  avatar,
  isAdmin = false,
  groupId
}: MemberCardProps) {
  const [showDetails, setShowDetails] = React.useState(false);
  
  return (
    <>
      <Card 
        className="overflow-hidden cursor-pointer hover:border-primary transition-colors"
        onClick={() => groupId && setShowDetails(true)}
      >
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={avatar} alt={name} />
              <AvatarFallback>
                {name.split(" ").map((n) => n[0]).join("")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center">
                <h3 className="font-medium">{name}</h3>
                {isAdmin && (
                  <Badge variant="outline" className="ml-2 text-xs">
                    Admin
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {groupId && (
        <MemberDetailsDialog
          open={showDetails}
          onOpenChange={setShowDetails}
          userId={id}
          groupId={groupId}
          memberSince="01/01/2025" // Simulado - seria obtido do backend
        />
      )}
    </>
  );
}
