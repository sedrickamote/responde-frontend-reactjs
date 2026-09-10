// src/context/NotificationContext.tsx
// Global real-time notification system using Supabase Realtime
// Listens for INSERT events on: fb_comments, conversations
// ─────────────────────────────────────────────────────────────────────────────

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import { supabase } from '../lib/supabaseClient';

// ── Types ─────────────────────────────────────────────────────────────────────

export type NotificationType = 'scraper' | 'messenger';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  /** Short preview of the comment or message text */
  message: string;
  /** Barangay location — scraper notifications only */
  barangay?: string;
  /** Sender name — messenger notifications only */
  sender?: string;
  /** Where clicking should navigate the user */
  targetPath: string;
  timestamp: Date;
  read: boolean;
}

export interface ToastNotification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  targetPath: string;
}

interface NotificationContextValue {
  notifications: AppNotification[];
  toasts: ToastNotification[];
  unreadCount: number;
  markAllRead: () => void;
  markNotificationRead: (id: string) => void;
  deleteNotification: (id: string) => void;
  clearAll: () => void;
  dismissToast: (id: number) => void;
}

// ── Context ───────────────────────────────────────────────────────────────────

const NotificationContext = createContext<NotificationContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const toastIdRef = useRef(0);

  const addNotification = useCallback(
    (
      type: NotificationType,
      title: string,
      message: string,
      targetPath: string,
      extra?: { barangay?: string; sender?: string }
    ) => {
      const id = crypto.randomUUID();
      const newNotif: AppNotification = {
        id,
        type,
        title,
        message,
        targetPath,
        barangay: extra?.barangay,
        sender: extra?.sender,
        timestamp: new Date(),
        read: false,
      };
      setNotifications((prev) => [newNotif, ...prev].slice(0, 50));

      const toastId = ++toastIdRef.current;
      setToasts((prev) => [
        ...prev,
        { id: toastId, type, title, message, targetPath },
      ]);
    },
    []
  );

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const deleteNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // ── Supabase Realtime Subscriptions ──────────────────────────────────────────

  useEffect(() => {
    // fb_comments — scraped Facebook comments
    const scraperChannel = supabase
      .channel('rt:fb_comments')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'fb_comments' },
        (payload) => {
          const row = payload.new as Record<string, any>;
          const barangay = row.barangay || 'Unknown Barangay';
          const preview = row.comment_text
            ? String(row.comment_text).slice(0, 70) +
              (String(row.comment_text).length > 70 ? '...' : '')
            : 'New comment scraped';
          addNotification('scraper', 'New Scraped Comment', preview, '/scraper-feed', {
            barangay,
          });
        }
      )
      .subscribe((s) => {
        if (import.meta.env.DEV) console.log('[Notif] fb_comments:', s);
      });

    // conversations — Messenger Bot messages
    const messengerChannel = supabase
      .channel('rt:conversations')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'conversations' },
        (payload) => {
          const row = payload.new as Record<string, any>;
          const sender =
            row.sender_name && row.sender_name !== 'Unknown User'
              ? row.sender_name
              : row.sender_psid
              ? `PSID ...${String(row.sender_psid).slice(-6)}`
              : 'Unknown User';
          const preview = row.user_message
            ? String(row.user_message).slice(0, 70) +
              (String(row.user_message).length > 70 ? '...' : '')
            : 'New message received';
          addNotification(
            'messenger',
            'New Messenger Message',
            preview,
            '/messenger-bot-logs',
            { sender }
          );
        }
      )
      .subscribe((s) => {
        if (import.meta.env.DEV) console.log('[Notif] conversations:', s);
      });

    return () => {
      supabase.removeChannel(scraperChannel);
      supabase.removeChannel(messengerChannel);
    };
  }, [addNotification]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        toasts,
        unreadCount,
        markAllRead,
        markNotificationRead,
        deleteNotification,
        clearAll,
        dismissToast,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx)
    throw new Error('useNotifications must be used inside NotificationProvider');
  return ctx;
}
