"use client"

import * as React from "react"
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
  ShieldCheck,
  Clock,
  MapPin,
  X,
  RefreshCcw,
  BadgeAlert,
  Award
} from "lucide-react"
import { MemberDetails } from "@/components/ui-elements/MemberDetails"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useRouter } from "next/navigation"

interface NotificationCardProps {
  id: string
  title: string
  message: string
  type: "info" | "success" | "warning"
  isRead: boolean
  createdAt: string
  relatedId?: string
  className?: string
}

export function NotificationCard({
  title,
  message,
  type,
  isRead,
  createdAt,
  relatedId,
  className,
}: NotificationCardProps) {
  const router = useRouter()
  const typeIcons = {
    info: <Info className="h-5 w-5 text-primary" />,
    success: <Check className="h-5 w-5 text-green-500" />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-500" />,
  }

  const getIconByTitle = (title: string) => {
    const lowerTitle = title.toLowerCase()
    
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

  const handleClick = () => {
    if (!relatedId) {
      // Se não tiver relatedId, redireciona para a página de notificações
      router.push('/notifications')
      return
    }

    const lowerTitle = title.toLowerCase()
    
    // Redireciona com base no contexto da notificação
    if (lowerTitle.includes("grupo") || 
        lowerTitle.includes("membro") || 
        lowerTitle.includes("convite para grupo") || 
        lowerTitle.includes("promovido")) {
      // Notificações relacionadas a grupos
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
      // Notificações relacionadas a eventos
      router.push(`/events/${relatedId}`)
    } else {
      // Caso padrão, vai para a página de notificações
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
        isRead ? "border-border" : "border-primary/40 shadow-sm",
        className
      )}
    >
      {!isRead && (
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
                !isRead && "font-semibold text-foreground"
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
  avatar: string
  isAdmin?: boolean
  groupId: string
  className?: string
}

export function MemberCard({
  id,
  name,
  avatar,
  isAdmin = false,
  groupId,
  className,
}: MemberCardProps) {
  const [showDetails, setShowDetails] = React.useState(false);

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
                alt={name}
                className="object-cover"
              />
            ) : (
              <AvatarFallback>
                {name.split(" ").map((n) => n[0]).join("")}
              </AvatarFallback>
            )}
          </Avatar>
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-sm">{name}</h3>
          <div className="flex items-center gap-1">
            {isAdmin && (
              <div className="flex items-center text-xs text-muted-foreground">
                <ShieldCheck className="h-3 w-3 mr-0.5" />
                <span>Admin</span>
              </div>
            )}
          </div>
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
