"use client"

import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { 
  Info, 
  Check, 
  AlertTriangle, 
  Bell, 
  Calendar, 
  Users, 
  MessageSquare,
  ChevronRight,
  Clock,
  MapPin,
  X,
  RefreshCcw,
  BadgeAlert,
  Award,
  ShieldAlert
} from "lucide-react"
import { MemberDetails } from "@/components/ui-elements/MemberDetails"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useRouter } from "next/navigation"
import { useNotifications } from "@/contexts/NotificationsContext";

interface NotificationCardProps {
  id: string
  title: string
  message: string
  type: "info" | "success" | "warning" | "error" | string
  isRead: boolean
  createdAt: string
  relatedId?: string
  targetType?: 'event' | 'group' | null;
  className?: string
}

export function NotificationCard({
  id,
  title,
  message,
  type,
  isRead,
  createdAt,
  relatedId,
  targetType,
  className,
}: NotificationCardProps) {
  const router = useRouter()
  const [markedAsReadVisual, setMarkedAsReadVisual] = useState(isRead);
  const { markOneAsRead } = useNotifications();

  useEffect(() => {
    setMarkedAsReadVisual(isRead);
  }, [isRead]);

  const typeIcons = {
    info: <Info className="h-5 w-5 text-primary" />,
    success: <Check className="h-5 w-5 text-green-500" />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-500" />,
    error: <ShieldAlert className="h-5 w-5 text-destructive" />
  }

  const getIconByTitle = (notificationTitle: string) => {
    const lowerTitle = notificationTitle.toLowerCase()
    if (lowerTitle.includes("erro")) return typeIcons.error
    
    if (lowerTitle.startsWith("novo evento:")) return <Calendar className="h-5 w-5 text-blue-500" />
    if (lowerTitle.startsWith("evento atualizado:")) return <Calendar className="h-5 w-5 text-primary" />
    if (lowerTitle.startsWith("evento cancelado:")) return <Calendar className="h-5 w-5 text-primary" />
    if (lowerTitle.includes("aproximando")) return <Calendar className="h-5 w-5 text-primary" />

    if (lowerTitle.startsWith("grupo excluído:")) return <Users className="h-5 w-5 text-primary" />
    if (lowerTitle.startsWith("grupo atualizado:")) return <Users className="h-5 w-5 text-primary" />
    if (lowerTitle.includes("membro") && lowerTitle.includes("entrou")) return <Users className="h-5 w-5 text-green-500" />

    if (lowerTitle.includes("presença confirmada")) return <Check className="h-5 w-5 text-green-500" />
    if (lowerTitle.includes("presença cancelada") && !lowerTitle.startsWith("evento cancelado:")) return <X className="h-5 w-5 text-red-500" />

    if (lowerTitle.includes("cancelado") && !lowerTitle.startsWith("evento cancelado:") && !lowerTitle.includes("presença cancelada")) return <X className="h-5 w-5 text-red-500" />
    if (lowerTitle.includes("alterado") && !lowerTitle.startsWith("evento atualizado:") && !lowerTitle.startsWith("grupo atualizado:")) return <RefreshCcw className="h-5 w-5 text-amber-500" />
    if (lowerTitle.includes("reagendado")) return <RefreshCcw className="h-5 w-5 text-amber-500" />
    if (lowerTitle.includes("horário")) return <Clock className="h-5 w-5 text-amber-500" />
    if (lowerTitle.includes("local")) return <MapPin className="h-5 w-5 text-amber-500" />
    if (lowerTitle.includes("vagas")) return <BadgeAlert className="h-5 w-5 text-amber-500" />
    if (lowerTitle.includes("convite")) return <MessageSquare className="h-5 w-5 text-blue-500" />
    if (lowerTitle.includes("promovido")) return <Award className="h-5 w-5 text-yellow-500" />
    
    const iconKey = type as ("info" | "success" | "warning" | "error");
    if (iconKey === 'info' && (lowerTitle.startsWith("novo evento:") || lowerTitle.startsWith("evento atualizado:") || lowerTitle.startsWith("evento cancelado:") || lowerTitle.startsWith("grupo excluído:") || lowerTitle.startsWith("grupo atualizado:") )) {
    } else {
        if (typeIcons[iconKey]) {
            return typeIcons[iconKey];
        }
    }

    if (type === 'info') {
        if (targetType === 'group') return <Users className="h-5 w-5 text-primary" />;
        if (targetType === 'event') return <Calendar className="h-5 w-5 text-primary" />;
    }

    return <Bell className="h-5 w-5 text-primary" />
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    if (isToday(date)) return `Hoje, ${format(date, 'HH:mm', { locale: ptBR })}`
    if (isYesterday(date)) return `Ontem, ${format(date, 'HH:mm', { locale: ptBR })}`
    if (new Date().getTime() - date.getTime() < 7 * 24 * 60 * 60 * 1000) {
      return formatDistanceToNow(date, { addSuffix: true, locale: ptBR })
    }
    return format(date, "d 'de' MMM", { locale: ptBR })
  }

  const handleClick = async () => {
    if (!markedAsReadVisual) {
      setMarkedAsReadVisual(true); 
      try {
        await markOneAsRead(id);
      } catch (error) {
        setMarkedAsReadVisual(isRead); 
        console.error(`Falha ao marcar notificação ${id} como lida no card:`, error);
      }
    }

    let targetUrl = '/notifications'; // URL Padrão

    if (relatedId && targetType) {
      if (targetType === 'group') {
        targetUrl = `/groups/${relatedId}`;
      } else if (targetType === 'event') {
        targetUrl = `/events/${relatedId}`;
      }
    }
    
    console.log(`[NotificationCard] Navigating to: ${targetUrl} (relatedId: ${relatedId}, targetType: ${targetType}, title: "${title}")`);
    router.push(targetUrl);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.01 }}
      onClick={handleClick}
      className={cn(
        "relative overflow-hidden rounded-xl border bg-card transition-all cursor-pointer",
        markedAsReadVisual ? "border-border opacity-70" : "border-primary/40 shadow-sm",
        className
      )}
    >
      {!markedAsReadVisual && (
        <div className="absolute right-0 top-0 -mt-px -mr-px">
          <div className="bg-primary text-primary-foreground text-[10px] font-medium px-2 py-0.5 rounded-bl-lg">
            Novo
          </div>
        </div>
      )}
      
      <div className="p-4 flex items-start gap-3">
        <div className="shrink-0 mt-1 p-2 rounded-full bg-background shadow-sm">
          {getIconByTitle(title)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex flex-col">
            <div className="flex justify-between items-start gap-2 mb-1">
              <h3 className={cn(
                "font-medium text-sm line-clamp-1", 
                !markedAsReadVisual && "font-semibold text-foreground"
              )}>
                {title}
              </h3>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {formatDate(createdAt)}
              </span>
            </div>
            
            <p className="text-sm text-muted-foreground line-clamp-2">
              {message}
            </p>
          </div>
        </div>
        
        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 self-center" />
      </div>
    </motion.div>
  )
}

interface MemberCardProps {
  id: string
  name: string
  nickname?: string | null
  avatar: string
  groupId: string
  className?: string
}

export function MemberCard({
  id,
  name,
  nickname,
  avatar,
  groupId,
  className,
}: MemberCardProps) {
  const [showDetails, setShowDetails] = React.useState(false);
  
  const primaryName = nickname || name;
  const secondaryName = nickname ? name : null;

  return (
    <>
      <motion.div
        whileHover={{ x: 3 }}
        className={cn(
          "p-3 rounded-lg border border-border bg-card flex items-center gap-3 cursor-pointer",
          className
        )}
        onClick={() => setShowDetails(true)}
      >
        <div className="relative">
          <Avatar className="h-10 w-10">
            {avatar ? (
              <AvatarImage
                src={avatar}
                alt={primaryName}
                className="object-cover"
              />
            ) : (
              <AvatarFallback>
                {primaryName.split(" ").map((n) => n[0]).join("").toUpperCase() || 'M'}
              </AvatarFallback>
            )}
          </Avatar>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm truncate">{primaryName}</h3>
          {secondaryName && (
              <p className="text-xs text-muted-foreground truncate">{secondaryName}</p>
          )}
        </div>
      </motion.div>

      <MemberDetails
        open={showDetails}
        onOpenChange={setShowDetails}
        userId={id}
        groupId={groupId}
      />
    </>
  )
}
