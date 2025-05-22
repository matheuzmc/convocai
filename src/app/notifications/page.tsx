'use client';

import React, { useEffect } from 'react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { TopNav } from '@/components/navigation/TopNav';
import { BottomNav } from '@/components/navigation/BottomNav';
import { NotificationCard } from '@/components/cards/NotificationMemberCards';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MailCheck, Loader2 } from 'lucide-react';
import { toast } from "sonner";
import { useNotifications } from "@/contexts/NotificationsContext";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function NotificationsPage() {
    const {
        notifications,
        isLoading,
        error,
        markAllAsRead,
        markAllAsSeen,
        unreadCount,
        loadMoreNotifications,
        hasMore,
        isLoadingMore,
    } = useNotifications();

    useEffect(() => {
        if (unreadCount > 0) {
            markAllAsSeen();
        }
    }, [unreadCount, markAllAsSeen]);

    const handleManualMarkAllRead = async () => {
        try {
            await markAllAsRead();
            toast.success("Todas as notificações marcadas como lidas!");
        } catch (error) {
            console.error("Falha ao marcar todas como lidas manualmente na página:", error);
        }
    }

    const hasUnread = notifications.some(n => !n.isRead);

    if (isLoading && notifications.length === 0) {
        return (
            <MobileLayout
                header={<TopNav title="Notificações" backHref="/events" showNotifications={true} />}
                footer={<BottomNav />}
            >
                <div className="p-4 space-y-4">
                    <Skeleton className="h-8 w-48 ml-auto" />
                    {[...Array(5)].map((_, i) => (
                         <Skeleton key={i} className="h-20 w-full" />
                    ))}
                </div>
            </MobileLayout>
        );
    }

    return (
        <MobileLayout
            header={<TopNav title="Notificações" backHref="/events" showNotifications={true} />}
            footer={<BottomNav />}
        >
            <div className="p-4">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold">Notificações</h1>
                    {notifications.length > 0 && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                    <Button 
                                        variant="ghost" 
                        size="sm"
                                        onClick={handleManualMarkAllRead}
                                        disabled={!hasUnread}
                    >
                            <MailCheck className="h-4 w-4 mr-2" />
                                        Marcar todas como lidas
                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Marcar todas as notificações como lidas.</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                </div>

                {error && (
                    <div className="text-center text-destructive py-10">
                         Erro ao carregar notificações: {error.message}
                    </div>
                )}

                {!error && notifications.length === 0 && !isLoading && (
                    <div className="text-center text-muted-foreground py-10">
                        <p>Você não tem nenhuma notificação.</p>
                    </div>
                )}

                {notifications.length > 0 && (
                    <div className="space-y-3">
                        {notifications.map((notification) => (
                            <NotificationCard 
                                key={notification.id}
                                {...notification} 
                            />
                        ))}
                    </div>
                )}

                {!isLoading && hasMore && (
                    <div className="mt-6 text-center">
                        <Button
                            onClick={loadMoreNotifications}
                            disabled={isLoadingMore}
                            variant="outline"
                        >
                            {isLoadingMore ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Carregando...
                                </>    
                            ) : (
                                'Carregar Mais'
                            )}
                        </Button>
                    </div>
                )}
            </div>
        </MobileLayout>
    );
}
