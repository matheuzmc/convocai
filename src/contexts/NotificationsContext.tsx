'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User as AuthUserType } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/lib/database.types';
import { toast } from 'sonner';

const NOTIFICATIONS_PER_PAGE = 6; // Quantidade de notificações por página

// Tipos para o Supabase (gerados)
type DbNotification = Database['public']['Tables']['notifications']['Row'];

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error" | "default"; // Tipo mais específico
  relatedId?: string; // ID do evento ou grupo relacionado
  targetType?: 'event' | 'group' | null; // NOVO CAMPO para o tipo de destino
  isRead: boolean;
  is_seen: boolean; // Nova propriedade
  createdAt: string;
  // Adicionar quaisquer outros campos que você possa precisar na UI
}

interface NotificationsContextType {
  notifications: AppNotification[];
  unreadCount: number;
  markOneAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  markAllAsSeen: () => Promise<void>; // Nova função
  isLoading: boolean;
  isLoadingMore: boolean; // Novo estado para carregamento de mais itens
  error: Error | null;
  loadMoreNotifications: () => void; // Nova função para carregar mais
  hasMore: boolean; // Novo estado para indicar se há mais itens
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

interface NotificationsProviderProps {
  children: ReactNode;
}

export const NotificationsProvider: React.FC<NotificationsProviderProps> = ({ children }) => {
  const supabase = createClient();
  const [authUser, setAuthUser] = useState<AuthUserType | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

  const mapDbNotificationToNotification = useCallback((dbNotification: DbNotification): AppNotification => {
    // Garante que o tipo seja um dos valores permitidos ou 'default'
    const validTypeValues = ["info", "success", "warning", "error"];
    const mappedType = validTypeValues.includes(dbNotification.type || "") 
                       ? dbNotification.type as AppNotification['type'] 
                       : 'default';
    
    let targetType: AppNotification['targetType'] = null;
    if (dbNotification.related_event_id) {
      targetType = 'event';
    } else if (dbNotification.related_group_id) {
      targetType = 'group';
    }

    return {
      id: dbNotification.id,
      userId: dbNotification.user_id,
      title: dbNotification.title,
      message: dbNotification.message,
      type: mappedType,
      relatedId: dbNotification.related_event_id || dbNotification.related_group_id || undefined,
      targetType, // Incluindo o novo campo
      isRead: dbNotification.is_read,
      is_seen: dbNotification.is_seen,
      createdAt: dbNotification.created_at,
    };
  }, []);

  const fetchNotifications = useCallback(async (userId: string, page: number) => {
    if (page === 1) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }
    setError(null);

    const limit = NOTIFICATIONS_PER_PAGE;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    try {
      const { data: fetchedNotificationsData, error: fetchError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (fetchError) throw fetchError;
      
      const mappedNotifications = fetchedNotificationsData.map(mapDbNotificationToNotification);
      
      setNotifications(prevNotifications => 
        page === 1 ? mappedNotifications : [...prevNotifications, ...mappedNotifications]
      );
      setHasMore(mappedNotifications.length === limit);
      if (page === 1) setCurrentPage(1); // Reseta a página se for o primeiro fetch

    } catch (err) {
      console.error(`Error fetching notifications (page ${page}):`, err);
      setError(err as Error);
      // Não limpar notificações se for erro em loadMore para manter o que já tem
      if (page === 1) setNotifications([]); 
    } finally {
      if (page === 1) {
        setIsLoading(false);
      } else {
        setIsLoadingMore(false);
      }
    }
  }, [supabase, mapDbNotificationToNotification]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setAuthUser(currentAuthUser => {
        if (!currentAuthUser && user) {
          return user;
        }
        return currentAuthUser; 
      });
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      const newUserFromSession = session?.user ?? null;
      
      setAuthUser(prevAuthUser => {
        const oldUserId = prevAuthUser?.id;
        const newUserId = newUserFromSession?.id;

        if (oldUserId !== newUserId) {
          return newUserFromSession;
        } else {
          return prevAuthUser; 
        }
      });
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (authUser?.id) {
      setNotifications([]); // Limpa notificações antigas antes de buscar novas para o usuário
      setCurrentPage(1);    // Reseta a página para 1
      setHasMore(true);     // Assume que tem mais até a primeira busca dizer o contrário
      fetchNotifications(authUser.id, 1); // Busca a primeira página
    } else {
      setNotifications([]);
      setUnreadCount(0);
      setCurrentPage(1);
      setHasMore(true); // Resetar estado hasMore
      setIsLoading(false);
      setError(null);
    }
  }, [authUser, fetchNotifications]);

  useEffect(() => {
    if (!authUser) return;

    const channel = supabase
      .channel('realtime-notifications')
      .on<DbNotification>(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications', 
          filter: `user_id=eq.${authUser.id}` 
        },
        (payload) => {
          console.log('New notification received via Realtime:', payload);
          const newNotification = mapDbNotificationToNotification(payload.new as DbNotification);
          
          setNotifications((prevNotifications) => [newNotification, ...prevNotifications]);
          if (!newNotification.isRead) {
            setUnreadCount((prevCount) => prevCount + 1);
          }
          toast.info(`Nova notificação: ${newNotification.title}`);
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log('Subscribed to notifications channel');
        }
        if (status === 'CHANNEL_ERROR' && err) {
          console.error('Notifications channel error:', err);
          setError(err as Error);
        }
        if (status === 'TIMED_OUT') {
          console.warn('Notifications channel timed out');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, authUser, mapDbNotificationToNotification]);

  useEffect(() => {
    const count = notifications.filter(n => !n.is_seen).length;
    setUnreadCount(count);
  }, [notifications]);

  const handleMarkOneAsRead = async (notificationId: string) => {
    if (!authUser) return;
    const notification = notifications.find(n => n.id === notificationId);
    if (notification && (!notification.isRead || !notification.is_seen)) {
      try {
        const { error: updateError } = await supabase
          .from('notifications')
          .update({ is_read: true, is_seen: true })
          .eq('id', notificationId)
          .eq('user_id', authUser.id);

        if (updateError) throw updateError;

        setNotifications(prev =>
          prev.map(n =>
            n.id === notificationId ? { ...n, isRead: true, is_seen: true } : n
          )
        );
      } catch (err) {
        console.error('Error marking notification as read:', err);
        setError(err as Error);
        toast.error('Erro ao marcar notificação como lida.');
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!authUser) return;
    const notificationsToUpdate = notifications.filter(n => !n.isRead || !n.is_seen);
    if (notificationsToUpdate.length === 0) return;

    try {
      const updates = notificationsToUpdate.map(n =>
        supabase
          .from('notifications')
          .update({ is_read: true, is_seen: true })
          .eq('id', n.id)
          .eq('user_id', authUser.id)
      );
      
      const results = await Promise.all(updates.map(p => p.then(res => {
        if (res.error) console.error('Error in batch marking as read:', res.error);
        return res;
      })));

      if (results.some(res => res.error)) {
        throw new Error('Some notifications failed to update during markAllAsRead.');
      }
      
      setNotifications(prev =>
        prev.map(n =>
          notificationsToUpdate.find(ntu => ntu.id === n.id) ? { ...n, isRead: true, is_seen: true } : n
        )
      );
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      setError(err as Error);
      toast.error('Erro ao marcar todas as notificações como lidas.');
    }
  };

  const handleMarkAllAsSeen = async () => {
    if (!authUser) return;
    const notificationsToUpdate = notifications.filter(n => !n.is_seen);
    if (notificationsToUpdate.length === 0) return;
  
    try {
      const updates = notificationsToUpdate.map(n =>
        supabase
          .from('notifications')
          .update({ is_seen: true })
          .eq('id', n.id)
          .eq('user_id', authUser.id)
      );
  
      const results = await Promise.all(updates.map(p => p.then(res => {
        if (res.error) console.error('Error in batch marking as seen:', res.error);
        return res;
      })));

      if (results.some(res => res.error)) {
        throw new Error('Some notifications failed to update during markAllAsSeen.');
      }
  
      setNotifications(prev =>
        prev.map(n =>
          notificationsToUpdate.find(ntu => ntu.id === n.id) ? { ...n, is_seen: true } : n
        )
      );
    } catch (err) {
      console.error('Error marking all notifications as seen:', err);
      setError(err as Error);
      toast.error('Erro ao marcar notificações como vistas.');
    }
  };

  const loadMoreNotifications = useCallback(() => {
    if (!isLoadingMore && hasMore && authUser?.id) {
      const nextPage = currentPage + 1;
      fetchNotifications(authUser.id, nextPage);
      setCurrentPage(nextPage);
    }
  }, [isLoadingMore, hasMore, authUser, currentPage, fetchNotifications]);

  const contextValue: NotificationsContextType = {
    notifications,
    unreadCount,
    isLoading,
    isLoadingMore,
    error,
    loadMoreNotifications,
    hasMore,
    markOneAsRead: handleMarkOneAsRead,
    markAllAsRead: handleMarkAllAsRead,
    markAllAsSeen: handleMarkAllAsSeen,
  };

  return (
    <NotificationsContext.Provider value={contextValue}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = (): NotificationsContextType => {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
}; 