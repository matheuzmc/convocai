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
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { markNotificationAsRead } from '@/services/api'
import { createClient } from '@/lib/supabase/client';
import { User as AuthUserType } from "@supabase/supabase-js";
import { toast } from "sonner"

interface NotificationCardProps {
  id: string
  title: string
  message: string
  type: "info" | "success" | "warning" | "error"
  isRead: boolean
  createdAt: string
  relatedId?: string
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
  className,
}: NotificationCardProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const supabase = createClient();
  const [authUser, setAuthUser] = useState<AuthUserType | null>(null);
  const [markedAsRead, setMarkedAsRead] = useState(isRead)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setAuthUser(user);
    };
    getUser();
  }, [supabase]);

  const typeIcons = {
    info: <Info className="h-5 w-5 text-primary" />,
    success: <Check className="h-5 w-5 text-green-500" />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-500" />,
    error: <ShieldAlert className="h-5 w-5 text-destructive" />
  }

  const getIconByTitle = (title: string) => {
    const lowerTitle = title.toLowerCase()
    
    if (lowerTitle.includes("erro")) return typeIcons.error
    
    // Notificações de eventos
    if (lowerTitle.includes("aproximando")) return <Calendar className="h-5 w-5 text-primary" />
    if (lowerTitle.includes("evento") && lowerTitle.includes("criado")) return <Calendar className="h-5 w-5 text-blue-500" />
    if (lowerTitle.includes("cancelado")) return <X className="h-5 w-5 text-red-500" />
    if (lowerTitle.includes("alterado")) return <RefreshCcw className="h-5 w-5 text-amber-500" />
    if (lowerTitle.includes("reagendado")) return <RefreshCcw className="h-5 w-5 text-amber-500" />
    if (lowerTitle.includes("horário")) return <Clock className="h-5 w-5 text-amber-500" />
    if (lowerTitle.includes("local")) return <MapPin className="h-5 w-5 text-amber-500" />
    if (lowerTitle.includes("vagas")) return <BadgeAlert className="h-5 w-5 text-amber-500" />
    if (lowerTitle.includes("confirmação")) return <Check className="h-5 w-5 text-amber-500" />
    
    // Notificações de grupo e membros
    if (lowerTitle.includes("grupo")) return <Users className="h-5 w-5 text-violet-500" />
    if (lowerTitle.includes("membro")) return <Users className="h-5 w-5 text-violet-500" />
    if (lowerTitle.includes("convite")) return <MessageSquare className="h-5 w-5 text-blue-500" />
    if (lowerTitle.includes("promovido")) return <Award className="h-5 w-5 text-yellow-500" />
    
    return typeIcons[type] || <Bell className="h-5 w-5 text-primary" />
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    
    if (isToday(date)) {
      return `Hoje, ${format(date, 'HH:mm', { locale: ptBR })}`
    }
    
    if (isYesterday(date)) {
      return `Ontem, ${format(date, 'HH:mm', { locale: ptBR })}`
    }
    
    if (new Date().getTime() - date.getTime() < 7 * 24 * 60 * 60 * 1000) {
      return formatDistanceToNow(date, { addSuffix: true, locale: ptBR })
    }
    
    return format(date, "d 'de' MMM", { locale: ptBR })
  }

  const markAsReadMutation = useMutation({
    mutationFn: () => markNotificationAsRead(id),
    onSuccess: () => {
      console.log(`Notification ${id} marked as read via mutation.`)
      setMarkedAsRead(true)
      queryClient.invalidateQueries({ queryKey: ['unreadNotifications', authUser?.id] })
      queryClient.invalidateQueries({ queryKey: ['allNotifications', authUser?.id] })
    },
    onError: (error) => {
      console.error(`Error marking notification ${id} as read:`, error)
      setMarkedAsRead(isRead)
      toast.error(`Erro ao marcar notificação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
    },
  })

  const handleClick = () => {
    if (!markedAsRead) {
      markAsReadMutation.mutate()
    }

    if (!relatedId) {
      router.push('/notifications')
      return
    }

    const lowerTitle = title.toLowerCase()
    
    if (lowerTitle.includes("grupo") || 
        lowerTitle.includes("membro") || 
        lowerTitle.includes("convite para grupo") || 
        lowerTitle.includes("promovido")) {
      router.push(`/groups/${relatedId}`)
    } else if (lowerTitle.includes("evento") || 
               lowerTitle.includes("aproximando") ||
               lowerTitle.includes("cancelado") ||
               lowerTitle.includes("alterado") ||
               lowerTitle.includes("reagendado") ||
               lowerTitle.includes("horário") ||
               lowerTitle.includes("local") ||
               lowerTitle.includes("vagas") ||
               lowerTitle.includes("confirmação")) {
      router.push(`/events/${relatedId}`)
    } else {
      router.push('/notifications')
    }
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
        markedAsRead ? "border-border opacity-70" : "border-primary/40 shadow-sm",
        className
      )}
    >
      {!markedAsRead && (
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
                !markedAsRead && "font-semibold text-foreground"
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
