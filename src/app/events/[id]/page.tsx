"use client";

import React, { useState, useRef, useEffect, TouchEventHandler } from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { TopNav } from "@/components/navigation/TopNav";
import { BottomNav } from "@/components/navigation/BottomNav";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Clock, CheckCircle, XCircle, AlertTriangle, Loader2, Pencil } from "lucide-react"; 
import Link from "next/link";
import { useParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"; 
import { useCurrentUser } from "@/hooks/useCurrentUser"; 
import { getEventDetails, respondToEvent, EventDetailsRpcResponse } from "@/services/api"; 
import { toast } from "sonner"; 
import { MemberDetails } from "@/components/ui-elements/MemberDetails";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Simplified helper component for static inline icons
const InlineResponseButtons = ({
  currentStatus,
}: {
  currentStatus: 'confirmed' | 'declined' | 'pending';
}) => {
  // Always return static icon based on status
  if (currentStatus === 'confirmed') return <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0" />;
  if (currentStatus === 'declined') return <XCircle className="h-6 w-6 text-destructive flex-shrink-0" />;
  return <AlertTriangle className="h-6 w-6 text-amber-500 flex-shrink-0" />;
};

// Adicionar definição do tipo auxiliar
type AttendeeWithProfile = EventDetailsRpcResponse['attendees'][number];

export default function EventDetailsPage() {
  const params = useParams();
  const eventId = params.id as string;
  const queryClient = useQueryClient();

  const { data: currentUser, isLoading: isLoadingUser } = useCurrentUser();

  const { 
    data: eventDetails, 
    isLoading: isLoadingEvent, 
    error: eventError 
  } = useQuery<EventDetailsRpcResponse | null>({
    queryKey: ['eventDetails', eventId], 
    queryFn: () => getEventDetails(eventId),
    enabled: !!eventId && !!currentUser,
  });

  const [isMemberDrawerOpen, setIsMemberDrawerOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const descriptionRef = useRef<HTMLDivElement>(null);
  const [canExpandDescription, setCanExpandDescription] = useState(false);
  const [cardSlide, setCardSlide] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);

  // Refs and state for CARD SWIPING
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const minSwipeDistance = 50; // Minimum distance for a swipe gesture

  const isLoading = isLoadingUser || isLoadingEvent;

  const event = eventDetails?.event;
  const group = eventDetails?.group ?? null;
  const attendees = eventDetails?.attendees ?? [];
  const isAdmin = eventDetails?.isAdmin ?? false;
  
  // DEBUG: Log attendees data from API
  useEffect(() => {
    if(eventDetails) {
      console.log("Attendees data from API:", eventDetails.attendees);
    }
  }, [eventDetails]);

  // Tipar parâmetros aqui
  const confirmedAttendees = attendees.filter((a: AttendeeWithProfile) => a.status === 'confirmed');
  const declinedAttendees = attendees.filter((a: AttendeeWithProfile) => a.status === 'declined');
  const pendingAttendees = attendees.filter((a: AttendeeWithProfile) => a.status === 'pending');
  const currentUserAttendee = attendees.find((att: AttendeeWithProfile) => att.userId === currentUser?.id);
  const currentStatus = currentUserAttendee?.status ?? 'pending';
  
  // const isPast = event ? new Date(`${event.date}T${event.time || '00:00:00'}`) < new Date() : false; // Linha anterior com possível problema de offset
  const timeString = event?.time || '00:00:00';
  const timeWithoutOffset = timeString.split(/[+-]/)[0];
  const isPast = event ? new Date(`${event.date}T${timeWithoutOffset}`) < new Date() : false;

  // DEBUGGING LOGS FOR EventDetailsPage - REMOVER/CONFIRMAR COMENTADO
  // console.log(`[EventDetailsPage DEBUG] Event ID: ${event?.id}, isPast: ${isPast}`, { eventDate: event?.date, eventTime: event?.time, timeWithoutOffset, constructedDateTimeString: `${event?.date}T${timeWithoutOffset}` });

  const respondMutation = useMutation({
    mutationFn: async (status: 'confirmed' | 'declined') => {
        if (!currentUser) throw new Error("User not logged in");
        if (!event) throw new Error("Event data not available");
        await respondToEvent(event.id, currentUser.id, status);
        return status;
    },
    onSuccess: (status) => {
      if (status === 'confirmed') {
        toast.success('Participação confirmada!');
      } else {
        toast.success('Participação cancelada.');
      }
      queryClient.invalidateQueries({ queryKey: ['eventDetails', eventId] });
      queryClient.invalidateQueries({ queryKey: ['userUpcomingEvents', currentUser?.id] });
      queryClient.invalidateQueries({ queryKey: ['userPastEvents', currentUser?.id] });
      queryClient.invalidateQueries({ queryKey: ['groupDetails', event?.groupId] });
    },
    onError: (error) => {
      toast.error(`Erro ao responder ao evento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  });

  const handleRespond = (status: 'confirmed' | 'declined') => {
    respondMutation.mutate(status);
  }

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "Data indefinida";
    try {
        const dateObj = new Date(`${dateString}T00:00:00`); 
        const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: "numeric", month: "long" };
        if (isNaN(dateObj.getTime())) return "Data Inválida";
        return dateObj.toLocaleDateString("pt-BR", options);
    } catch (error) {
         console.error("Error formatting date:", dateString, error);
         return "Data Inválida"; 
    }
  };
  const formatTime = (timeString: string | null | undefined) => {
    if (!timeString) return '--:--';
    return timeString.substring(0, 5);
  };

  const handleMemberClick = (userId: string) => {
    setSelectedMemberId(userId);
    setIsMemberDrawerOpen(true);
  };

  useEffect(() => {
    setCanExpandDescription(false); 
    if (descriptionRef.current) {
      const checkClamping = () => {
           if (descriptionRef.current) {
               const isClamped = descriptionRef.current.scrollHeight > descriptionRef.current.clientHeight;
               setCanExpandDescription(isClamped);
           }
      };
      const timerId = setTimeout(checkClamping, 50); 
      return () => clearTimeout(timerId);
    }
  }, [event?.description, isDescriptionExpanded]);

  // --- Card Swiping Handlers ---
  const handleTouchStart: TouchEventHandler<HTMLDivElement> = (e) => {
    touchEndX.current = null; // Reset endX
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove: TouchEventHandler<HTMLDivElement> = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;

    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && cardSlide === 0) {
      setCardSlide(1); // Swipe left from info to description
    } else if (isRightSwipe && cardSlide === 1) {
      setCardSlide(0); // Swipe right from description to info
    }

    // Reset refs
    touchStartX.current = null;
    touchEndX.current = null;
  };
  // --- End Card Swiping Handlers ---

  if (isLoading) {
    return (
      <MobileLayout
        header={<TopNav title="Carregando Evento..." backHref="/events" />}
        footer={<BottomNav />}
      >
        <div className="space-y-4 p-4">
           <div className="flex justify-between items-center">
             <Skeleton className="h-8 w-3/4" />
             <Skeleton className="h-4 w-20 rounded-md" />
           </div>
           <div className="border bg-card rounded-lg shadow-sm overflow-hidden mt-4 p-4 space-y-2">
             <Skeleton className="h-4 w-1/3 mb-2" />
             <Skeleton className="h-5 w-1/2" />
             <Skeleton className="h-5 w-1/3" />
             <Skeleton className="h-5 w-3/4" />
           </div>
           <Skeleton className="h-10 w-full mt-4" />
           <div className="mt-4">
             <Skeleton className="h-10 w-full" />
             <div className="space-y-3 pt-4 mt-4">
               {[...Array(3)].map((_, i) => (
                 <div key={i} className="flex items-center justify-between gap-3 p-3 border rounded-lg bg-card">
                   <div className="flex items-center gap-3 flex-grow">
                     <Skeleton className="h-10 w-10 rounded-full" />
                     <Skeleton className="h-5 flex-1" />
                   </div>
                   <Skeleton className="h-6 w-6 rounded-md" />
                 </div>
               ))}
             </div>
           </div>
        </div>
      </MobileLayout>
    );
  }

  if (eventError || !eventDetails || !event || !group) {
     return (
      <MobileLayout
        header={<TopNav title="Erro" backHref="/events" />}
        footer={<BottomNav />}
      >
        <div className="p-4 text-center text-destructive">
          <AlertTriangle className="mx-auto h-8 w-8 mb-2"/>
          Erro ao carregar detalhes do evento.
          {eventError && <p className="text-xs mt-2">{(eventError as Error).message}</p>}
        </div>
      </MobileLayout>
    );
  }

  return (
    <>
    <MobileLayout
        header={<TopNav 
            title={event.title} 
            backHref={`/groups/${group.id}`} 
            showNotifications 
            rightElement={isAdmin && !isPast ? (
                <Link href={`/events/${eventId}/edit`}>
                    <Button variant="ghost" size="icon">
                        <Pencil className="h-5 w-5" />
                    </Button>
                </Link>
            ) : null}
        />}
      footer={<BottomNav />}
      >
        <div className="space-y-6 p-4">
          <div className="space-y-2">
            <div className="flex justify-between items-start gap-2">
              <div className="flex-grow min-w-0">
                  <h1 className="text-2xl font-bold leading-tight break-words">{event.title}</h1>
                  <Link href={`/groups/${group.id}`} className="text-xs text-primary hover:underline block mt-1 truncate">
                     {group.image_url && (
                       <Avatar className="inline-block h-4 w-4 mr-1 align-middle">
                         <AvatarImage src={group.image_url} alt={group.name ?? 'Grupo'} />
                         <AvatarFallback>{group.name?.charAt(0)?.toUpperCase() ?? 'G'}</AvatarFallback>
                       </Avatar>
                     )}
                     {group.name}
                  </Link>
              </div>
              {isPast && (
                    <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded flex-shrink-0">Passado</span>
                )}
            </div>

            <div className="border bg-card rounded-lg shadow-sm overflow-hidden mt-4"> 
              <div 
                ref={sliderRef}
                className={`flex transition-transform duration-300 ease-in-out`} 
                style={{ transform: `translateX(-${cardSlide * 100}%)` }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <div className="p-4 space-y-2 flex-shrink-0 w-full"> 
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Informações</h3>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" /> 
                      <span>{formatDate(event.date)}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-muted-foreground" /> 
                      <span>{formatTime(event.time)}</span>
                </div>
                    <div className="flex items-start">
                      <MapPin className="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0" />
                      <span>{event.location ?? 'Local a definir'}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 flex-shrink-0 w-full">
                  {event.description ? (
                    <>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Descrição</h3>
                      <p 
                        ref={descriptionRef} 
                        className={`text-sm whitespace-pre-wrap text-foreground ${!isDescriptionExpanded ? 'line-clamp-3' : ''}`}
                      >
                        {event.description}
                      </p>
                      {canExpandDescription && (
                        <button 
                          onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)} 
                          className="text-sm text-primary hover:underline mt-1 font-medium"
                        >
                          {isDescriptionExpanded ? 'Ver menos' : 'Ver mais'}
                        </button>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">Nenhuma descrição fornecida.</p>
                  )}
                </div>
              </div>
              
              {event.description && ( 
                <div className="flex justify-center items-center gap-2 pt-1 pb-3">
                  {[0, 1].map((index) => (
                    <button
                      key={index}
                      onClick={() => setCardSlide(index)}
                      className={`h-2 w-2 rounded-full transition-colors duration-200 ${cardSlide === index ? 'bg-primary' : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'}`}
                      aria-label={`Ir para ${index === 0 ? 'informações' : 'descrição'}`}
                    />
                  ))}
                </div>
              )}
                </div>

            <div className="flex flex-col gap-3 p-3 rounded-lg border bg-card text-sm mt-6">
              <div className="flex justify-around items-center w-full">
                <div className="flex flex-col items-center gap-1">
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="font-medium text-foreground">{confirmedAttendees.length}</span>
                  </div>
                  <span className="text-muted-foreground text-xs sm:inline">Confirmados</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="flex items-center gap-1">
                    <XCircle className="h-5 w-5 text-destructive" />
                    <span className="font-medium text-foreground">{declinedAttendees.length}</span>
                  </div>
                  <span className="text-muted-foreground text-xs sm:inline">Cancelados</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="flex items-center gap-1">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    <span className="font-medium text-foreground">{pendingAttendees.length}</span>
                  </div>
                  <span className="text-muted-foreground text-xs sm:inline">Pendentes</span>
                </div>
              </div>

              {currentUser && !isPast && (
                <>
                  <div className="border-t border-border my-1"></div>

                  <div> 
                    {currentStatus === 'confirmed' ? (
                      <>
                        <Button
                          variant="outline"
                          className="w-full text-destructive border-destructive/50 hover:bg-red-100 hover:text-destructive/90 dark:hover:bg-red-900/20"
                          onClick={() => setIsCancelConfirmOpen(true)}
                          disabled={respondMutation.isPending}
                        >
                          {respondMutation.isPending && respondMutation.variables === 'declined' ? (
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
                              <AlertDialogCancel>Voltar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleRespond('declined')}
                                className="bg-destructive hover:bg-destructive/90"
                                style={{ color: 'var(--destructive-foreground)' }}
                                disabled={respondMutation.isPending}
                              >
                                 {respondMutation.isPending && respondMutation.variables === 'declined' ? (
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
                        disabled={respondMutation.isPending}
                      >
                        {respondMutation.isPending && respondMutation.variables === 'confirmed' ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        Confirmar participação
                      </Button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
          
          <div> 
            <Tabs defaultValue="participants" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="participants">Participantes</TabsTrigger>
                  <TabsTrigger value="comments">Comentários</TabsTrigger>
                </TabsList>

                <TabsContent value="participants" className="mt-2 space-y-4">
                  <div className="space-y-2">
                    {isLoadingEvent ? (
                      <div className="space-y-3 pt-4">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="flex items-center justify-between gap-3 p-3 border rounded-lg bg-card">
                            <div className="flex items-center gap-3 flex-grow">
                              <Skeleton className="h-10 w-10 rounded-full" />
                              <Skeleton className="h-5 flex-1" />
                            </div>
                            <Skeleton className="h-6 w-6 rounded-md" />
                          </div>
                        ))}
                      </div>
                    ) : attendees.length === 0 ? (
                       <p className="text-sm text-center text-muted-foreground py-6">
                        Nenhum participante respondeu ainda.
                      </p>
                    ) : (
                      <>
                        {confirmedAttendees.length > 0 && (
                          <>
                             <div className="pt-4">
                              <h3 className="text-sm font-medium text-muted-foreground">Confirmados</h3>
          </div>
                            {confirmedAttendees.map((attendee: AttendeeWithProfile) => (
                              <div key={attendee.userId} className="flex items-center justify-between gap-3 p-3 border rounded-lg bg-card cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleMemberClick(attendee.userId)}>
                                <div className="flex items-center gap-3 flex-grow min-w-0">
                                  <Avatar className="h-10 w-10">
                                    <AvatarImage src={attendee.profile?.avatar_url} alt={attendee.profile?.name ?? 'Avatar'} />
                                    <AvatarFallback>{attendee.profile?.name?.charAt(0)?.toUpperCase() ?? '?'}</AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    {attendee.profile?.nickname ? (
                                       <>
                                         <span className="text-sm font-medium block truncate">
                                           {attendee.profile.nickname}
                                         </span>
                                         <span className="text-xs text-muted-foreground block truncate">
                                           {`${attendee.profile?.name || ''} ${attendee.profile?.lastName || ''}`.trim() || 'Nome Completo Indisponível'}
                                         </span>
                                       </>
                                    ) : (
                                       <span className="text-sm font-medium block truncate">
                                         {`${attendee.profile?.name || ''} ${attendee.profile?.lastName || ''}`.trim() || 'Nome Indisponível'}
                                       </span>
                                    )}
                                  </div>
                                </div>
                                <InlineResponseButtons
                                  currentStatus={attendee.status as 'confirmed' | 'declined' | 'pending'}
                                />
        </div>
                            ))}
                          </>
                        )}
                
                        {declinedAttendees.length > 0 && (
                          <>
                            <div className="pt-4">
                              <h3 className="text-sm font-medium text-muted-foreground">Cancelados</h3>
                            </div>
                            {declinedAttendees.map((attendee: AttendeeWithProfile) => (
                              <div key={attendee.userId} className="flex items-center justify-between gap-3 p-3 border rounded-lg bg-card cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleMemberClick(attendee.userId)}>
                                <div className="flex items-center gap-3 flex-grow min-w-0">
                                  <Avatar className="h-10 w-10">
                                    <AvatarImage src={attendee.profile?.avatar_url} alt={attendee.profile?.name ?? 'Avatar'} />
                                    <AvatarFallback>{attendee.profile?.name?.charAt(0)?.toUpperCase() ?? '?'}</AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    {attendee.profile?.nickname ? (
                                       <>
                                         <span className="text-sm font-medium block truncate">
                                           {attendee.profile.nickname}
                                         </span>
                                         <span className="text-xs text-muted-foreground block truncate">
                                           {`${attendee.profile?.name || ''} ${attendee.profile?.lastName || ''}`.trim() || 'Nome Completo Indisponível'}
                                         </span>
                                       </>
                                    ) : (
                                       <span className="text-sm font-medium block truncate">
                                         {`${attendee.profile?.name || ''} ${attendee.profile?.lastName || ''}`.trim() || 'Nome Indisponível'}
                                       </span>
                                    )}
                                  </div>
                                </div>
                                <InlineResponseButtons
                                  currentStatus={attendee.status as 'confirmed' | 'declined' | 'pending'}
                                />
                              </div>
                            ))}
                          </>
                        )}
                
                        {pendingAttendees.length > 0 && (
                          <>
                            <div className="pt-4">
                              <h3 className="text-sm font-medium text-muted-foreground">Pendentes</h3>
                            </div>
                            {pendingAttendees.map((attendee: AttendeeWithProfile) => (
                              <div key={attendee.userId} className="flex items-center justify-between gap-3 p-3 border rounded-lg bg-card cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => handleMemberClick(attendee.userId)}>
                                <div className="flex items-center gap-3 flex-grow min-w-0">
                                  <Avatar className="h-10 w-10">
                                    <AvatarImage src={attendee.profile?.avatar_url} alt={attendee.profile?.name ?? 'Avatar'} />
                                    <AvatarFallback>{attendee.profile?.name?.charAt(0)?.toUpperCase() ?? '?'}</AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    {attendee.profile?.nickname ? (
                                       <>
                                         <span className="text-sm font-medium block truncate">
                                           {attendee.profile.nickname}
                                         </span>
                                         <span className="text-xs text-muted-foreground block truncate">
                                           {`${attendee.profile?.name || ''} ${attendee.profile?.lastName || ''}`.trim() || 'Nome Completo Indisponível'}
                                         </span>
                                       </>
                                    ) : (
                                       <span className="text-sm font-medium block truncate">
                                         {`${attendee.profile?.name || ''} ${attendee.profile?.lastName || ''}`.trim() || 'Nome Indisponível'}
                                       </span>
                                    )}
                                  </div>
                                </div>
                                <InlineResponseButtons
                                  currentStatus={attendee.status as 'confirmed' | 'declined' | 'pending'}
                                />
                              </div>
                            ))}
                          </>
                        )}
              </>
            )}
          </div>
                </TabsContent>

                <TabsContent value="comments" className="mt-2">
                     <p className="text-center text-muted-foreground py-8">Seção de comentários em breve.</p>
                  </TabsContent>
                  
              </Tabs>
        </div>
      </div>
    </MobileLayout>

      {/* Drawer/Sheet for Member Details - Ensure group is not null */}
      {group && selectedMemberId && (
        <MemberDetails 
            userId={selectedMemberId}
            groupId={group.id}
            open={isMemberDrawerOpen}
            onOpenChange={setIsMemberDrawerOpen}
        />
      )}
    </>
  );
}
