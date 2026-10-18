// src/context/NotificationContext.tsx
// Global real-time notification & priority alert system using Supabase Realtime
// Listens for INSERT events on: incident_reports, fb_comments, conversations
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
import { apiRequest } from '../services/apiClient';

// ── Types ─────────────────────────────────────────────────────────────────────

export type NotificationType = 'scraper' | 'messenger' | 'priority';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  /** Short preview of the comment, message, or incident text */
  message: string;
  /** Barangay location */
  barangay?: string;
  /** Sender name — messenger notifications only */
  sender?: string;
  /** Where clicking should navigate the user */
  targetPath: string;
  timestamp: Date;
  read: boolean;
  /** Priority Alert indicators for FR-007 */
  isPriority?: boolean;
  urgency?: string;
  incidentType?: string;
  reportId?: string;
}

export interface ToastNotification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  targetPath: string;
  isPriority?: boolean;
  barangay?: string;
  urgency?: string;
  incidentType?: string;
  reportId?: string;
}

interface NotificationContextValue {
  notifications: AppNotification[];
  toasts: ToastNotification[];
  unreadCount: number;
  priorityUnreadCount: number;
  markAllRead: () => void;
  markTypeRead: (type: NotificationType) => void;
  markNotificationRead: (id: string) => void;
  markMultipleRead: (ids: string[]) => void;
  deleteNotification: (id: string) => void;
  clearAll: () => void;
  dismissToast: (id: number) => void;
  triggerPriorityAlert: (data: {
    id?: string;
    title?: string;
    message: string;
    barangay?: string;
    type?: string;
    urgency?: string;
    targetPath?: string;
    reportId?: string;
  }) => void;
}

// ── Web Audio API Emergency Alert Chime ───────────────────────────────────────

/**
 * Play a clean two-tone acoustic alert chime for high-priority emergency incidents.
 * Utilizes the browser's native Web Audio API (zero audio asset dependencies).
 */
export function playPriorityChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const playTone = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.18, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + duration);
    };

    const t = ctx.currentTime;
    // Two-tone warning: 880Hz (A5) -> 1174.66Hz (D6)
    playTone(880, t, 0.18);
    playTone(1174.66, t + 0.14, 0.28);
  } catch (err) {
    console.debug('[NotificationContext] Web Audio chime suspended or not allowed:', err);
  }
}

// ── Storage Key ─────────────────────────────────────────────────────────────
const NOTIFS_STORAGE_KEY = 'responde_notifications_v3';

// ── Context ───────────────────────────────────────────────────────────────────

const NotificationContext = createContext<NotificationContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────

export function NotificationProvider({ children }: { children: ReactNode }) {
  // 1. Initialize from localStorage so notifications persist across refresh/logout/login
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const raw = localStorage.getItem(NOTIFS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.map((item: any) => ({
            ...item,
            timestamp: new Date(item.timestamp),
          }));
        }
      }
    } catch (err) {
      console.warn('[NotificationContext] Failed to parse stored notifications:', err);
    }
    return [];
  });

  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const toastIdRef = useRef(0);

  // 2. Persist to localStorage whenever notifications change
  useEffect(() => {
    try {
      localStorage.setItem(NOTIFS_STORAGE_KEY, JSON.stringify(notifications));
    } catch (err) {
      console.warn('[NotificationContext] Failed to persist notifications:', err);
    }
  }, [notifications]);

  const addNotification = useCallback(
    (
      type: NotificationType,
      title: string,
      message: string,
      targetPath: string,
      extra?: {
        barangay?: string;
        sender?: string;
        id?: string;
        timestamp?: Date;
        read?: boolean;
        isPriority?: boolean;
        urgency?: string;
        incidentType?: string;
        reportId?: string;
      }
    ) => {
      const id = extra?.id || crypto.randomUUID();
      const isPriority = extra?.isPriority || type === 'priority';
      const newNotif: AppNotification = {
        id,
        type,
        title,
        message,
        targetPath,
        barangay: extra?.barangay,
        sender: extra?.sender,
        timestamp: extra?.timestamp || new Date(),
        read: extra?.read ?? false,
        isPriority,
        urgency: extra?.urgency,
        incidentType: extra?.incidentType,
        reportId: extra?.reportId,
      };

      setNotifications((prev) => {
        const filtered = prev.filter((n) => n.id !== id);
        return [newNotif, ...filtered].slice(0, 50);
      });

      if (!extra?.read) {
        const toastId = ++toastIdRef.current;
        setToasts((prev) => [
          ...prev,
          {
            id: toastId,
            type,
            title,
            message,
            targetPath,
            isPriority,
            barangay: extra?.barangay,
            urgency: extra?.urgency,
            incidentType: extra?.incidentType,
            reportId: extra?.reportId,
          },
        ]);
        if (isPriority) {
          playPriorityChime();
        }
      }
    },
    []
  );

  const triggerPriorityAlert = useCallback(
    (data: {
      id?: string;
      title?: string;
      message: string;
      barangay?: string;
      type?: string;
      urgency?: string;
      targetPath?: string;
      reportId?: string;
    }) => {
      const id = data.id || `priority-${crypto.randomUUID()}`;
      const isSearchAndRescue =
        (data.type || '').toLowerCase().includes('rescue') ||
        (data.type || '').toLowerCase().includes('search');
      const title =
        data.title ||
        (isSearchAndRescue
          ? '🚨 PRIORITY ALERT: Search & Rescue'
          : '🚨 PRIORITY ALERT: High Urgency Incident');
      const targetPath = data.targetPath || '/incident-reports';

      addNotification('priority', title, data.message, targetPath, {
        id,
        barangay: data.barangay,
        read: false,
        isPriority: true,
        urgency: data.urgency || 'High',
        incidentType: data.type || (isSearchAndRescue ? 'Search & Rescue' : 'Emergency'),
        reportId: data.reportId,
      });

      playPriorityChime();
    },
    [addNotification]
  );

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const markTypeRead = useCallback((type: NotificationType) => {
    setNotifications((prev) =>
      prev.map((n) => (n.type === type ? { ...n, read: true } : n))
    );
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markMultipleRead = useCallback((ids: string[]) => {
    if (!ids || ids.length === 0) return;
    const idSet = new Set(ids);
    setNotifications((prev) =>
      prev.map((n) => (idSet.has(n.id) ? { ...n, read: true } : n))
    );
  }, []);

  const deleteNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // ── Fetch Recent Records on Mount & Merge with Stored ────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function loadRecentHistory() {
      try {
        let commentsData: any[] = [];
        let convosData: any[] = [];

        try {
          const [cRes, mRes] = await Promise.all([
            apiRequest<{ data?: any[] }>('/api/auth/data/fb-comments?limit=25', { cacheTtlMs: 8000 }),
            apiRequest<{ data?: any[] }>('/api/auth/data/conversations?limit=25', { cacheTtlMs: 8000 }),
          ]);
          commentsData = cRes.data ?? [];
          convosData = mRes.data ?? [];
        } catch {
          // Backend API fetch failed or rate-limited, proceed with cached/stored history
        }

        const fetchedItems: AppNotification[] = [];

        if (commentsData && commentsData.length > 0) {
          commentsData.forEach((row: any) => {
            const rawId = row.id || row.comment_id;
            const barangay = row.barangay || row.location || 'Unknown Barangay';
            const preview =
              row.comment_text || row.commentText || row.raw_text || row.text || 'New comment scraped';
            const time = row.created_at || row.timestamp || new Date().toISOString();
            const urgency = String(row.urgency || '').toLowerCase();
            const type = String(row.incident_type || row.type || '').toLowerCase();
            const isRescue = type.includes('rescue') || type.includes('search');
            const isHigh = urgency === 'high';

            fetchedItems.push({
              id: isHigh && isRescue ? `priority-sc-${rawId || crypto.randomUUID()}` : `scraper-${rawId || crypto.randomUUID()}`,
              type: isHigh && isRescue ? 'priority' : 'scraper',
              title: isHigh && isRescue ? '🚨 PRIORITY ALERT: Search & Rescue' : 'New Scraped Comment',
              message:
                String(preview).slice(0, 70) +
                (String(preview).length > 70 ? '...' : ''),
              barangay,
              targetPath: isHigh && isRescue ? '/incident-reports' : '/scraper-feed',
              timestamp: new Date(time),
              read: true,
              isPriority: isHigh && isRescue,
              urgency: row.urgency,
              incidentType: isRescue ? 'Search & Rescue' : row.incident_type,
            });
          });
        }

        if (convosData && convosData.length > 0) {
          convosData.forEach((row: any) => {
            const rawId = row.id || row.conversation_id;
            const sender =
              row.sender_name && row.sender_name !== 'Unknown User'
                ? row.sender_name
                : row.name || (row.sender_psid ? `PSID ...${String(row.sender_psid).slice(-6)}` : 'Unknown User');
            const preview =
              row.user_message ||
              (row.messages && row.messages[0]?.text) ||
              'New message received';
            const time = row.created_at || row.timestamp || row.time || new Date().toISOString();
            const urgency = String(row.urgency || '').toLowerCase();
            const type = String(row.type || '').toLowerCase();
            const isRescue = type.includes('rescue') || type.includes('search');
            const isHigh = urgency === 'high';

            fetchedItems.push({
              id: isHigh && isRescue ? `priority-msg-${rawId || crypto.randomUUID()}` : `messenger-${rawId || crypto.randomUUID()}`,
              type: isHigh && isRescue ? 'priority' : 'messenger',
              title: isHigh && isRescue ? '🚨 PRIORITY ALERT: Search & Rescue' : 'New Messenger Message',
              message:
                String(preview).slice(0, 70) +
                (String(preview).length > 70 ? '...' : ''),
              sender,
              targetPath: isHigh && isRescue ? '/incident-reports' : '/messenger-bot-logs',
              timestamp: new Date(time),
              read: true,
              isPriority: isHigh && isRescue,
              urgency: row.urgency,
              incidentType: isRescue ? 'Search & Rescue' : row.type,
            });
          });
        }

        if (cancelled) return;

        setNotifications((prev) => {
          const map = new Map<string, AppNotification>();
          
          // Add all fetched history items first
          fetchedItems.forEach((item) => {
            map.set(item.id, item);
          });

          // Overlay stored user notifications (preserving read status & realtime events)
          prev.forEach((stored) => {
            map.set(stored.id, stored);
          });

          // Sort by timestamp descending and keep up to 50
          return Array.from(map.values())
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, 50);
        });
      } catch (err) {
        if (import.meta.env.DEV) {
          console.warn('[NotificationContext] Failed to load history:', err);
        }
      }
    }

    loadRecentHistory();

    return () => {
      cancelled = true;
    };
  }, []);

  // ── Supabase Realtime Subscriptions ──────────────────────────────────────────

  useEffect(() => {
    // 1. incident_reports — Emergency Incident Reports table
    const incidentChannel = supabase
      .channel('rt:incident_reports')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'incident_reports' },
        (payload) => {
          const row = payload.new as Record<string, any>;
          if (!row) return;
          const urgency = String(row.urgency || '').toLowerCase();
          const type = String(row.type || row.incident_type || '').toLowerCase();
          const isHigh = urgency === 'high';
          const isSearchAndRescue = type.includes('rescue') || type.includes('search');
          const rawId = row.id || crypto.randomUUID();

          if (isHigh || isSearchAndRescue) {
            triggerPriorityAlert({
              id: `priority-inc-${rawId}`,
              title: isSearchAndRescue
                ? '🚨 PRIORITY ALERT: Search & Rescue'
                : '🚨 PRIORITY ALERT: High-Urgency Incident',
              message:
                row.description ||
                row.original_text ||
                'High-urgency Search and Rescue incident requiring immediate response.',
              barangay: row.barangay || 'Talisay',
              type: isSearchAndRescue ? 'Search & Rescue' : (row.type || 'Emergency'),
              urgency: 'High',
              targetPath: '/incident-reports',
              reportId: String(rawId),
            });
          }
        }
      )
      .subscribe();

    // 2. fb_comments — scraped Facebook comments
    const scraperChannel = supabase
      .channel('rt:fb_comments')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'fb_comments' },
        (payload) => {
          const row = payload.new as Record<string, any>;
          const rawId = row.id || row.comment_id;
          const barangay = row.barangay || 'Unknown Barangay';
          const text = String(row.comment_text || row.raw_text || '');
          const preview = text
            ? text.slice(0, 70) + (text.length > 70 ? '...' : '')
            : 'New comment scraped';
          const urgency = String(row.urgency || '').toLowerCase();
          const type = String(row.incident_type || row.type || '').toLowerCase();
          const lowerText = text.toLowerCase();

          const isSearchAndRescue =
            type.includes('rescue') ||
            lowerText.includes('rescue') ||
            lowerText.includes('stranded') ||
            lowerText.includes('naipit sa bubong') ||
            lowerText.includes('boat capsized') ||
            lowerText.includes('bangka');
          const isHigh =
            urgency === 'high' ||
            lowerText.includes('lampas tao') ||
            lowerText.includes('kailangan ng rescue boat') ||
            lowerText.includes('saklolo');

          if (isHigh && isSearchAndRescue) {
            triggerPriorityAlert({
              id: `priority-fb-${rawId || crypto.randomUUID()}`,
              title: '🚨 PRIORITY ALERT: Search & Rescue',
              message: text || 'High-urgency rescue request scraped from community comments.',
              barangay,
              type: 'Search & Rescue',
              urgency: 'High',
              targetPath: '/incident-reports',
              reportId: String(rawId),
            });
          } else {
            addNotification('scraper', 'New Scraped Comment', preview, '/scraper-feed', {
              barangay,
              id: `scraper-${rawId || crypto.randomUUID()}`,
              read: false,
            });
          }
        }
      )
      .subscribe();

    // 3. conversations — Messenger Bot messages
    const messengerChannel = supabase
      .channel('rt:conversations')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'conversations' },
        (payload) => {
          const row = payload.new as Record<string, any>;
          const rawId = row.id || row.conversation_id;
          const sender =
            row.sender_name && row.sender_name !== 'Unknown User'
              ? row.sender_name
              : row.sender_psid
              ? `PSID ...${String(row.sender_psid).slice(-6)}`
              : 'Unknown User';
          const text = String(row.user_message || (row.messages && row.messages[0]?.text) || '');
          const preview = text
            ? text.slice(0, 70) + (text.length > 70 ? '...' : '')
            : 'New message received';
          const urgency = String(row.urgency || '').toLowerCase();
          const type = String(row.type || '').toLowerCase();
          const lowerText = text.toLowerCase();

          const isSearchAndRescue =
            type.includes('rescue') ||
            lowerText.includes('rescue') ||
            lowerText.includes('stranded') ||
            lowerText.includes('saklolo');
          const isHigh =
            urgency === 'high' ||
            lowerText.includes('asap') ||
            lowerText.includes('emergency') ||
            lowerText.includes('tulong po');

          if (isHigh && isSearchAndRescue) {
            triggerPriorityAlert({
              id: `priority-msg-${rawId || crypto.randomUUID()}`,
              title: '🚨 PRIORITY ALERT: Search & Rescue',
              message: text || 'Immediate citizen distress call received via Messenger.',
              barangay: row.barangay || 'Talisay',
              type: 'Search & Rescue',
              urgency: 'High',
              targetPath: '/incident-reports',
              reportId: String(rawId),
            });
          } else {
            addNotification(
              'messenger',
              'New Messenger Message',
              preview,
              '/messenger-bot-logs',
              { sender, id: `messenger-${rawId || crypto.randomUUID()}`, read: false }
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(incidentChannel);
      supabase.removeChannel(scraperChannel);
      supabase.removeChannel(messengerChannel);
    };
  }, [addNotification, triggerPriorityAlert]);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const priorityUnreadCount = notifications.filter(
    (n) => (n.type === 'priority' || n.isPriority) && !n.read
  ).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        toasts,
        unreadCount,
        priorityUnreadCount,
        markAllRead,
        markTypeRead,
        markNotificationRead,
        markMultipleRead,
        deleteNotification,
        clearAll,
        dismissToast,
        triggerPriorityAlert,
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
