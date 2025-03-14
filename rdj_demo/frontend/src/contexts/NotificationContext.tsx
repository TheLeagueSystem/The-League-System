import React, { createContext, useContext, useState, useEffect } from 'react';
import { fetchWithAuth } from '../utils/api';

export interface Notification {
  id: number;
  type: string;
  message: string;
  link: string | null;
  time: string;
  created_at: string;
  read: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  markAsRead: (id: number) => void;
  markAsUnread: (id: number) => void;
  markAllAsRead: () => void;
  refreshNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  const fetchNotifications = async () => {
    try {
      const data = await fetchWithAuth('/notifications/');
      setNotifications(data);
      setUnreadCount(data.filter((n: Notification) => !n.read).length);
      setError(null);
    } catch (err: any) {
      console.error("Error fetching notifications:", err);
      setError(err.message || "Failed to fetch notifications");
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const data = await fetchWithAuth('/notifications/count/');
      setUnreadCount(data.count);
    } catch (err) {
      console.error("Error fetching notification count:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Set up polling for notification count every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    setPollingInterval(interval);

    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const markAsRead = async (id: number) => {
    try {
      await fetchWithAuth(`/notifications/${id}/`, {
        method: 'POST',
        body: JSON.stringify({ action: 'mark_read' })
      });
      
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const markAsUnread = async (id: number) => {
    try {
      await fetchWithAuth(`/notifications/${id}/`, {
        method: 'POST',
        body: JSON.stringify({ action: 'mark_unread' })
      });
      
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: false } : n)
      );
      
      setUnreadCount(prev => prev + 1);
    } catch (err) {
      console.error("Error marking notification as unread:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetchWithAuth('/notifications/actions/', {
        method: 'POST',
        body: JSON.stringify({ action: 'mark_all_read' })
      });
      
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      );
      
      setUnreadCount(0);
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
    }
  };

  const refreshNotifications = () => {
    fetchNotifications();
  };

  const value = {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    refreshNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};