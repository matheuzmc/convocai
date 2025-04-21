"use client"

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { MapPin, Users } from "lucide-react";

interface GroupCardProps {
  id: string;
  name: string;
  description: string;
  sport: string;
  image: string;
  memberCount: number;
  className?: string;
}

export function GroupCard({
  id,
  name,
  description,
  sport,
  image,
  memberCount,
  className,
}: GroupCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className={cn(
        "rounded-xl overflow-hidden border border-border bg-card hover-lift elevation-1",
        className
      )}
    >
      <Link href={`/groups/${id}`}>
        <div className="relative h-32 w-full">
          <div 
            className="absolute inset-0 bg-cover bg-center" 
            style={{ backgroundImage: `url(${image})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 p-3">
            <div className="inline-block px-2 py-1 rounded-md bg-primary/90 text-primary-foreground text-xs font-medium">
              {sport}
            </div>
          </div>
        </div>
        <div className="p-4 space-y-2">
          <h3 className="font-semibold text-lg">{name}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
          <div className="flex items-center text-sm text-muted-foreground">
            <Users className="h-4 w-4 mr-1" />
            <span>{memberCount} {memberCount === 1 ? "membro" : "membros"}</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

interface EventCardProps {
  id: string;
  title: string;
  description: string;
  location: string;
  date: string;
  time: string;
  attendeeCount: number;
  className?: string;
  groupName?: string;
  attendanceStatus?: 'confirmed' | 'declined' | 'pending';
  isPast?: boolean;
}

export function EventCard({
  id,
  title,
  description,
  location,
  date,
  time,
  attendeeCount,
  className,
  groupName,
  attendanceStatus,
  isPast = false,
}: EventCardProps) {
  // Formatar a data para exibição
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
    return new Date(dateString).toLocaleDateString("pt-BR", options);
  };

  // Definir cores do status de presença
  const statusColors = {
    confirmed: "bg-green-500/20 text-green-700 border-green-500/30",
    declined: "bg-red-500/20 text-red-700 border-red-500/30",
    pending: "bg-amber-500/20 text-amber-700 border-amber-500/30"
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className={cn(
        "rounded-xl overflow-hidden border border-border bg-card hover-lift elevation-1",
        isPast && "opacity-75",
        className
      )}
    >
      <Link href={`/events/${id}`}>
        <div className="p-4 space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-lg">{title}</h3>
              {groupName && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Grupo: {groupName}
                </p>
              )}
            </div>
            <div className="px-2 py-1.5 rounded-md bg-accent/20 text-accent-foreground text-xs font-medium flex-shrink-0 ml-2">
              {formatDate(date)} • {time}
            </div>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center text-muted-foreground">
              <MapPin className="h-4 w-4 mr-1" />
              <span className="truncate max-w-[150px]">{location}</span>
            </div>
            <div className="flex items-center text-muted-foreground">
              <Users className="h-4 w-4 mr-1" />
              <span>{attendeeCount} {attendeeCount === 1 ? "participante" : "participantes"}</span>
            </div>
          </div>
          
          {attendanceStatus && (
            <div className={cn(
              "mt-2 text-xs px-2 py-1 rounded border w-fit",
              statusColors[attendanceStatus]
            )}>
              {attendanceStatus === 'confirmed' && 'Confirmado'}
              {attendanceStatus === 'declined' && 'Recusado'}
              {attendanceStatus === 'pending' && 'Pendente'}
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
