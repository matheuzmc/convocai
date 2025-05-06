'use client';

import React, { useState, useEffect } from 'react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { TopNav } from '@/components/navigation/TopNav';
import { BottomNav } from '@/components/navigation/BottomNav';
import { NotificationCard } from '@/components/cards/NotificationMemberCards';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { createClient } from '@/lib/supabase/client';
import { User as AuthUserType } from "@supabase/supabase-js";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllNotifications, markAllNotificationsAsRead } from '@/services/api';
import { Notification } from '@/lib/types';
import { MailCheck, Loader2, BellOff } from 'lucide-react';
import { toast } from "sonner";

export default function NotificationsPage() {
    const queryClient = useQueryClient();
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

    // Fetch all notifications
    const { 
        data: notificationsData,
        isLoading: isLoadingNotifications,
        error: notificationsError 
    } = useQuery<Notification[]>({
        queryKey: ['allNotifications', authUser?.id],
        queryFn: getAllNotifications,
        enabled: !!authUser,
        staleTime: 1 * 60 * 1000, // Cache for 1 minute
    });

    // Mutation to mark all as read
    const markAllReadMutation = useMutation({
        mutationFn: markAllNotificationsAsRead,
        onSuccess: () => {
            console.log("Marked all notifications as read.");
            queryClient.invalidateQueries({ queryKey: ['allNotifications', authUser?.id] });
            queryClient.invalidateQueries({ queryKey: ['unreadNotifications', authUser?.id] });
            toast.success("Todas as notificações marcadas como lidas!");
        },
        onError: (error) => {
            console.error("Error marking all as read:", error);
            toast.error(`Erro ao marcar notificações: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        }
    });

    const handleMarkAllRead = () => {
        markAllReadMutation.mutate();
    }

    const notifications = notificationsData ?? [];
    const hasUnread = notifications.some(n => !n.isRead);

    // Show loading skeleton
    if (loadingAuth || isLoadingNotifications) {
        return (
            <MobileLayout
                header={<TopNav title="Notificações" backHref="/events" />}
                footer={<BottomNav />}
            >
                <div className="p-4 space-y-4">
                    <Skeleton className="h-8 w-48 ml-auto" /> {/* Button Skeleton */}
                    {[...Array(5)].map((_, i) => (
                         <Skeleton key={i} className="h-20 w-full" />
                    ))}
                </div>
            </MobileLayout>
        );
    }

    return (
        <MobileLayout
            header={<TopNav title="Notificações" backHref="/events" />}
            footer={<BottomNav />}
        >
            <div className="p-4">
                <div className="flex justify-end mb-4">
                    <Button 
                        variant="outline"
                        size="sm"
                        onClick={handleMarkAllRead}
                        disabled={!hasUnread || markAllReadMutation.isPending}
                    >
                         {markAllReadMutation.isPending ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                         ) : (
                            <MailCheck className="h-4 w-4 mr-2" />
                         )}
                        {markAllReadMutation.isPending ? 'Marcando...' : 'Marcar todas como lidas'}
                    </Button>
                </div>

                {notificationsError && (
                    <div className="text-center text-destructive py-10">
                         Erro ao carregar notificações.
                    </div>
                )}

                {!notificationsError && notifications.length === 0 && (
                    <div className="text-center text-muted-foreground py-10">
                        <BellOff className="mx-auto h-12 w-12 mb-4 text-gray-400"/>
                        <p>Você não tem nenhuma notificação.</p>
                    </div>
                )}

                {!notificationsError && notifications.length > 0 && (
                    <div className="space-y-3">
                        {notifications.map((notification) => (
                            <NotificationCard 
                                key={notification.id}
                                {...notification} // Spread notification props
                            />
                        ))}
                    </div>
                )}
            </div>
        </MobileLayout>
    );
}
