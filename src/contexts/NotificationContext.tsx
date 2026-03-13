import React, { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import { notificationService, type Notification } from '../services/notificationService';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isModalOpen: boolean;
  isLoading: boolean;
  openModal: () => void;
  closeModal: () => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
  loadMore: () => Promise<void>;
  hasMore: boolean;
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchUnreadCount = useCallback(async () => {
    const count = await notificationService.getUnreadCount();
    setUnreadCount(count);
  }, []);

  const refreshNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await notificationService.getNotifications(1, 20);
      setNotifications(data.notifications);
      setPage(1);
      setHasMore(data.page < data.totalPages);
      await fetchUnreadCount();
    } finally {
      setIsLoading(false);
    }
  }, [fetchUnreadCount]);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) return;
    setIsLoading(true);
    try {
      const nextPage = page + 1;
      const data = await notificationService.getNotifications(nextPage, 20);
      setNotifications(prev => [...prev, ...data.notifications]);
      setPage(nextPage);
      setHasMore(nextPage < data.totalPages);
    } finally {
      setIsLoading(false);
    }
  }, [hasMore, isLoading, page]);

  // Initialize socket and fetch data when user is available
  useEffect(() => {
    if (!user?.id) return;

    notificationService.initSocket(user.id);
    fetchUnreadCount();

    const unsubscribe = notificationService.onNotification((notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    // Poll unread count every 60 seconds
    const pollInterval = setInterval(fetchUnreadCount, 60000);

    return () => {
      unsubscribe();
      clearInterval(pollInterval);
      notificationService.disconnect();
    };
  }, [user?.id, fetchUnreadCount]);

  const openModal = useCallback(() => {
    setIsModalOpen(true);
    refreshNotifications();
  }, [refreshNotifications]);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    await notificationService.markAsRead(id);
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(async () => {
    await notificationService.markAllAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    const notification = notifications.find(n => n.id === id);
    await notificationService.deleteNotification(id);
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (notification && !notification.isRead) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  }, [notifications]);

  const value = {
    notifications,
    unreadCount,
    isModalOpen,
    isLoading,
    openModal,
    closeModal,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
    loadMore,
    hasMore
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
