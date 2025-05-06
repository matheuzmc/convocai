"use client"; // Required for hooks like useAuth, useState, useEffect

import React, { useState, useEffect } from 'react';
// import { useAuth } from '@/contexts/AuthContext'; // Remove useAuth
import { createClient } from '@/lib/supabase/client'; // Import Supabase client helper
import { User as AuthUserType } from "@supabase/supabase-js"; // Import Supabase User type
import MobileLayout from '@/components/layout/MobileLayout';
import BottomNav from '@/components/navigation/BottomNav'; // Correct path
import TopNav from '@/components/navigation/TopNav'; // Correct path
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton'; 
// import { EventCard, EventCardProps } from '@/components/ui-elements/EventCard'; // Incorrect path and unused props
import { EventCard } from '@/components/cards/GroupEventCards'; // Correct path for EventCard
// import { Event } from '@/types/definitions'; // Incorrect path
import { Event } from '@/lib/types'; // Correct path for Event type
import { useQuery } from "@tanstack/react-query"; // Import useQuery
import { getUpcomingEvents, getPastEvents } from "@/services/api"; // Import API functions
import { AlertTriangle } from 'lucide-react'; // Import icon for error
import { Calendar, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';


// Placeholder data definition moved inside the component or will be replaced by fetched data
// const placeholderEvents: Event[] = [...]; // Defined inside component for now

const EventsPage: React.FC = () => {
  // const { user, loading: authLoading } = useAuth(); // Remove useAuth
  const supabase = createClient();
  const [authUser, setAuthUser] = useState<AuthUserType | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      setLoadingAuth(true);
      const { data: { user } } = await supabase.auth.getUser();
      setAuthUser(user);
      setLoadingAuth(false);
    };
    getUser();
  }, [supabase]);

  // Fetch Upcoming Events
  const { 
    data: upcomingEventsData, 
    isLoading: isLoadingUpcoming, 
    error: upcomingError 
  } = useQuery<Event[]>({
    queryKey: ['userUpcomingEvents', authUser?.id], // Use authUser?.id
    queryFn: getUpcomingEvents,
    enabled: !!authUser, // Enable when authUser is loaded
    staleTime: 5 * 60 * 1000,
  });

  // Fetch Past Events
  const { 
    data: pastEventsData, 
    isLoading: isLoadingPast, 
    error: pastError 
  } = useQuery<Event[]>({
    queryKey: ['userPastEvents', authUser?.id], // Use authUser?.id
    queryFn: getPastEvents,
    enabled: !!authUser, // Enable when authUser is loaded
    staleTime: 15 * 60 * 1000,
  });

  // Removed placeholder state
  // const loadingEvents = false;

  // Render loading skeleton if auth is loading OR if the initial data for BOTH tabs is loading
  // We show the main skeleton until *initial* data for both tabs is checked
  const showInitialSkeleton = loadingAuth || (!!authUser && (isLoadingUpcoming || isLoadingPast) && (!upcomingEventsData && !pastEventsData));

  if (showInitialSkeleton) {
    return (
      <MobileLayout
        header={<TopNav title="Meus Eventos" />}
        footer={<BottomNav />}
      >
        <div className="container mx-auto p-4">
          {/* Skeleton for Tabs */}
          <Skeleton className="h-10 w-48 mb-4" />
          <Separator className="mb-4" />
          {/* Skeleton for Event List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {[...Array(3)].map((_, index) => (
              <Skeleton key={index} className="h-40 w-full" />
            ))}
          </div>
        </div>
      </MobileLayout>
    );
  }

  // Extract data with default values
  const upcomingEvents = upcomingEventsData ?? [];
  const pastEvents = pastEventsData ?? [];

  // Function to render the event list content, now using correct prop passing
  const renderEventContent = (events: Event[], isLoading: boolean, error: Error | null, eventType: 'upcoming' | 'past') => {
     // Show skeletons within the tab if this specific list is loading
     if (isLoading) { 
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {[...Array(3)].map((_, index) => (
            <Skeleton key={index} className="h-40 w-full" />
          ))}
        </div>
      );
    }
    // Show error message if fetching failed for this list
    if (error) {
        return (
            <div className="text-center text-destructive mt-4">
                <AlertTriangle className="mx-auto h-6 w-6 mb-1"/>
                Erro ao carregar eventos.
            </div>
        );
    }
    // Show empty message if no events and no error
    if (events.length === 0) {
      if (eventType === 'upcoming') {
        return (
          <div className="text-center text-muted-foreground mt-8 py-8">
            <Calendar className="mx-auto h-12 w-12 mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">Nenhum evento futuro</h3>
            <p className="text-sm mb-6">Parece que você não tem nenhum evento agendado.</p>
            <Button asChild>
              <Link href="/groups">
                <Users className="mr-2 h-4 w-4" /> Explorar Grupos
              </Link>
            </Button>
          </div>
        );
      } else { // For past events
        return <p className="text-center text-muted-foreground mt-4">Nenhum evento passado encontrado.</p>;
      }
    }
    // Render event cards
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
         {events.map((event) => (
          <EventCard 
            key={event.id}
            event={event}
          />
        ))}
      </div>
    );
  };

  return (
    <MobileLayout
      header={<TopNav title="Meus Eventos" showNotifications />} 
      footer={<BottomNav />}
    >
      <div className="container mx-auto p-4">
        <Tabs defaultValue="upcoming"> 
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="upcoming">Próximos</TabsTrigger>
            <TabsTrigger value="past">Histórico</TabsTrigger> 
          </TabsList>
          <TabsContent value="upcoming">
             {/* Pass upcoming events data and loading/error states */}
             {renderEventContent(upcomingEvents, isLoadingUpcoming, upcomingError, 'upcoming')}
          </TabsContent>
          <TabsContent value="past">
             {/* Pass past events data and loading/error states */}
             {renderEventContent(pastEvents, isLoadingPast, pastError, 'past')} 
          </TabsContent>
        </Tabs>
      </div>
    </MobileLayout>
  );
};

export default EventsPage;
