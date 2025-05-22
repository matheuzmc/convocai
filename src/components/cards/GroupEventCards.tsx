"use client"

import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { MapPin, Users, Loader2 } from "lucide-react";
import { Event } from "@/lib/types";
import { createClient } from '@/lib/supabase/client';
import { User as AuthUserType } from "@supabase/supabase-js";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { handleRespondToEventAction } from "@/app/events/actions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface GroupCardProps {
  id: string;
  name: string;
  sport: string;
  image: string;
  memberCount: number;
  className?: string;
}

export function GroupCard({
  id,
  name,
  sport,
  image,
  memberCount,
  className,
}: GroupCardProps) {
  const displayImage = image || '/placeholder.svg';

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
            style={{ backgroundImage: `url(${displayImage})` }}
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
  event: Event;
  className?: string;
}

export function EventCard({ event, className }: EventCardProps) {
  const queryClient = useQueryClient();
  const supabase = createClient();
  const [authUser, setAuthUser] = useState<AuthUserType | null>(null);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
  
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setAuthUser(user);
    };
    getUser();
  }, [supabase]);

  const currentUserAttendee = useMemo(() => 
     event.attendees.find(att => att.userId === authUser?.id)
  , [event.attendees, authUser?.id]);

  const currentStatus = currentUserAttendee?.status ?? 'pending';
  
  const timeString = event.time || '00:00:00';
  const timeWithoutOffset = timeString.split(/[+-]/)[0];
  const eventDateTimeString = `${event.date}T${timeWithoutOffset}`;

  const eventDateObj = new Date(eventDateTimeString);
  const now = new Date();
  const isPast = eventDateObj < now;

  const mutation = useMutation({
    mutationFn: async (status: 'confirmed' | 'declined') => {
        if (!authUser) throw new Error("User not logged in");
        const result = await handleRespondToEventAction({ eventId: event.id, status });
        if (result.error) {
          throw new Error(result.error);
        }
        return status;
    },
    onSuccess: (status) => {
      console.log(`Successfully responded with ${status} to event ${event.id}`);
      queryClient.invalidateQueries({ queryKey: ['userUpcomingEvents', authUser?.id] });
      queryClient.invalidateQueries({ queryKey: ['userPastEvents', authUser?.id] });
      queryClient.invalidateQueries({ queryKey: ['groupDetails', event.groupId] });
      
      if (status === 'confirmed') {
        toast.success('Participação confirmada!');
      } else {
        toast.success('Participação cancelada.');
      }
    },
    onError: (error) => {
      console.error(`Error responding to event ${event.id}:`, error);
      toast.error(`Erro ao responder ao evento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  });

  const handleRespond = (status: 'confirmed' | 'declined') => {
    mutation.mutate(status);
  }

  const formatDate = (dateString: string) => {
    try {
        const dateObj = new Date(`${dateString}T00:00:00`); 
        const options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
        if (isNaN(dateObj.getTime())) {
            console.warn("Invalid date provided to formatDate:", dateString);
            return "Data Inválida";
        }
        return dateObj.toLocaleDateString("pt-BR", options);
    } catch (e) {
        console.error("Error formatting date:", dateString, e);
        return "Data Inválida";
    }
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return '--:--';
    return timeString.substring(0, 5);
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
      <div className="p-4 space-y-3">
         <Link href={`/events/${event.id}`} className="block cursor-pointer group">
            <div className="flex justify-between items-start">
                <div>
                <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">{event.title}</h3>
                </div>
                <div className="px-2 py-1 rounded-md bg-accent/20 text-accent-foreground text-xs font-medium flex-shrink-0 ml-2">
                  {formatDate(event.date)} • {formatTime(event.time)}
                </div>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{event.description ?? 'Sem descrição'}</p>
            <div className="flex items-center justify-between text-sm mt-2">
                <div className="flex items-center text-muted-foreground">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span className="truncate max-w-[150px]">{event.location ?? 'Local não definido'}</span>
                </div>
                <div className="flex items-center text-muted-foreground">
                    <Users className="h-4 w-4 mr-1" />
                    <span>{event.attendees?.filter(a => a.status === 'confirmed').length ?? 0} confirmados</span>
                </div>
            </div>
        </Link>
          
        {!isPast && authUser && (
             <div className="mt-4 pt-3 border-t border-border flex items-center justify-center">
                {currentStatus === 'confirmed' ? (
                  <>
                    <Button
                      variant="outline"
                      className="w-full text-destructive border-destructive/50 hover:bg-red-100 hover:text-destructive/90 dark:hover:bg-red-900/20"
                      onClick={() => setIsCancelConfirmOpen(true)}
                      disabled={mutation.isPending}
                    >
                      {mutation.isPending && mutation.variables === 'declined' ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Cancelar participação
                    </Button>

                    <AlertDialog open={isCancelConfirmOpen} onOpenChange={setIsCancelConfirmOpen}>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar Cancelamento</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja cancelar sua participação neste evento?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel disabled={mutation.isPending && mutation.variables === 'declined'}>Voltar</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => {
                              handleRespond('declined');
                            }}
                            className="bg-destructive hover:bg-destructive/90"
                            style={{ color: 'var(--destructive-foreground)' }}
                            disabled={mutation.isPending}
                           >
                             {mutation.isPending && mutation.variables === 'declined' ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : null}
                            Confirmar Cancelamento
                           </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                ) : (
                    <Button
                      variant="default"
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => handleRespond('confirmed')}
                      disabled={mutation.isPending}
                    >
                      {mutation.isPending && mutation.variables === 'confirmed' ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : null}
                      Confirmar participação
                    </Button>
                )}
            </div>
        )}
      </div>
    </motion.div>
  );
}
