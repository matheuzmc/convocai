"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Calendar, Clock, MapPin, Users } from "lucide-react";
import Image from "next/image";

interface EventCardProps {
  id: string;
  title: string;
  description: string;
  location: string;
  date: string;
  time: string;
  attendeeCount: number;
  groupName?: string;
  attendanceStatus?: 'confirmed' | 'declined' | 'pending';
  isPast?: boolean;
}

interface GroupCardProps {
  id: string;
  name: string;
  description: string;
  sport: string;
  image: string;
  memberCount: number;
}

export function EventCard({
  id,
  title,
  description,
  location,
  date,
  time,
  attendeeCount,
  groupName,
  attendanceStatus,
  isPast = false
}: EventCardProps) {
  // Formatar data para exibição
  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="p-4 space-y-3">
          <div className="flex justify-between items-start">
            <h3 className="font-medium">{title}</h3>
            {attendanceStatus && (
              <Badge 
                variant={
                  attendanceStatus === 'confirmed' ? 'default' : 
                  attendanceStatus === 'declined' ? 'destructive' : 'outline'
                }
                className="ml-2"
              >
                {attendanceStatus === 'confirmed' ? 'Participou' : 
                 attendanceStatus === 'declined' ? 'Não participou' : 'Pendente'}
              </Badge>
            )}
          </div>
          
          {groupName && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Users className="h-4 w-4 mr-1" />
              <span>{groupName}</span>
            </div>
          )}
          
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center text-sm">
              <Calendar className="h-4 w-4 mr-1.5 text-muted-foreground" />
              <span>{formatDate(date)}</span>
            </div>
            <div className="flex items-center text-sm">
              <Clock className="h-4 w-4 mr-1.5 text-muted-foreground" />
              <span>{time}</span>
            </div>
            <div className="flex items-center text-sm">
              <MapPin className="h-4 w-4 mr-1.5 text-muted-foreground" />
              <span>{location}</span>
            </div>
          </div>
          
          <div className="flex justify-between items-center pt-2">
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-1 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {attendeeCount} {attendeeCount === 1 ? 'participante' : 'participantes'}
              </span>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/events/${id}`}>
                {isPast ? 'Detalhes' : 'Ver evento'}
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function GroupCard({
  id,
  name,
  description,
  sport,
  image,
  memberCount
}: GroupCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="relative h-32 w-full">
          <Image
            src={image}
            alt={name}
            className="object-cover"
            fill
            sizes="(max-width: 768px) 100vw, 350px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent" />
          <div className="absolute bottom-2 left-3 right-3">
            <h3 className="font-medium text-white drop-shadow-sm">{name}</h3>
            <Badge variant="secondary" className="mt-1">
              {sport}
            </Badge>
          </div>
        </div>
        <div className="p-4 space-y-3">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {description}
          </p>
          
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-1 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {memberCount} {memberCount === 1 ? 'membro' : 'membros'}
              </span>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/groups/${id}`}>
                Ver grupo
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
