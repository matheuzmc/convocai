'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User as AuthUserType } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/lib/database.types';
import { toast } from 'sonner';

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
  error: Error | null;
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

  const fetchInitialNotifications = useCallback(async (userId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data: fetchedNotificationsData, error: fetchError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      
      const mappedNotifications = fetchedNotificationsData.map(mapDbNotificationToNotification);
      setNotifications(mappedNotifications);
    } catch (err) {
      console.error('Error fetching initial notifications:', err);
      setError(err as Error);
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, mapDbNotificationToNotification]);

  useEffect(() => {
    const authUnsubscribe: (() => void) | undefined = (() => {
      const getCurrentUserAndInitialLoad = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setAuthUser(user);
        if (user) {
          await fetchInitialNotifications(user.id);
        } else {
          setNotifications([]);
          setIsLoading(false);
        }
      };
      
      getCurrentUserAndInitialLoad();

      const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
        console.log('Auth state changed. Event:', _event, 'Session:', session);
        const currentUser = session?.user ?? null;
        const previousAuthUserId = authUser?.id;
        setAuthUser(currentUser);

        if (currentUser) {
          if (!previousAuthUserId || previousAuthUserId !== currentUser.id) {
            await fetchInitialNotifications(currentUser.id);
          }
        } else {
          setNotifications([]);
        }
      });
      return listener.subscription?.unsubscribe;
    })();

    return () => {
      if (authUnsubscribe) {
        authUnsubscribe();
      }
    };
  }, [supabase, fetchInitialNotifications, authUser?.id]);

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

  const contextValue: NotificationsContextType = {
    notifications,
    unreadCount,
    isLoading,
    error,
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