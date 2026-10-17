import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { TALISAY_BARANGAYS } from '../data/talisay-barangays';
import { formatTimestampPHT } from '../utils/dateUtils';

// ── Types ──
export interface BotMessage {
  sender: 'bot' | 'user';
  text: string;
  timestamp?: string;
}

export interface BotConversation {
  id: string;
  psid: string;
  name: string;
  barangay: string;
  type: string;
  status: 'Incomplete' | 'Complete';
  time: string;
  createdAt?: string;
  messages: BotMessage[];
}

function titleCase(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function normalizeBarangayName(name: string): string {
  if (!name) return 'General';
  const trimmed = name.trim();
  const matched = TALISAY_BARANGAYS.find(
    (b) => b.toLowerCase() === trimmed.toLowerCase()
  );
  if (matched) return matched;
  const cleaned = trimmed.replace(/^(brgy\.?|barangay)\s+/i, '');
  const matchedCleaned = TALISAY_BARANGAYS.find(
    (b) => b.toLowerCase() === cleaned.toLowerCase()
  );
  if (matchedCleaned) return matchedCleaned;
  return titleCase(trimmed);
}

export const initialBotConversations: BotConversation[] = [];

const STORAGE_KEY = 'responde_bot_status_overrides_v2';
const INACTIVITY_GAP_MS = 60 * 60 * 1000;
const POLL_INTERVAL_MS = 30_000;

const getInitialOverrides = (): Record<string, 'Incomplete' | 'Complete'> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

interface BotConversationsContextValue {
  conversations: BotConversation[];
  updateConversationStatus: (id: string, newStatus: 'Incomplete' | 'Complete') => void;
  loading: boolean;
  error: string | null;
  refetchConversations: () => Promise<void>;
  incompleteCount: number;
}

const BotConversationsContext = createContext<BotConversationsContextValue | null>(null);

export function BotConversationsProvider({ children }: { children: ReactNode }) {
  const [statusOverrides, setStatusOverrides] = useState<Record<string, 'Incomplete' | 'Complete'>>(getInitialOverrides);
  const statusOverridesRef = useRef(statusOverrides);
  statusOverridesRef.current = statusOverrides;

  const [conversations, setConversations] = useState<BotConversation[]>(() => {
    const overrides = getInitialOverrides();
    return initialBotConversations.map((c) => ({
      ...c,
      status: overrides[c.id] || c.status,
    }));
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateConversationStatus = useCallback((id: string, newStatus: 'Incomplete' | 'Complete') => {
    setStatusOverrides((prev) => {
      const updated = { ...prev, [id]: newStatus };
      statusOverridesRef.current = updated;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to save status override to localStorage:', err);
      }
      return updated;
    });

    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c))
    );
  }, []);

  const fetchConversations = useCallback(async (isFirst = false) => {
    if (isFirst) setLoading(true);
    setError(null);

    // Use authenticated backend API instead of direct Supabase anon access
    const API_BASE = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL ?? '');
    const storedToken = (() => { try { return localStorage.getItem('responde_session_token'); } catch { return null; } })();
    const hdrs: Record<string, string> = { 'Content-Type': 'application/json' };
    if (storedToken) hdrs['Authorization'] = `Bearer ${storedToken}`;

    let data: any[] | null = null;
    try {
      const res = await fetch(`${API_BASE}/api/auth/data/conversations?limit=500`, {
        credentials: 'include',
        headers: hdrs,
      });
      if (res.ok) {
        const json = await res.json();
        data = json.data ?? [];
      } else {
        const errJson = await res.json().catch(() => ({ error: res.statusText }));
        console.error('[BotConversationsContext] API error:', errJson.error);
        setError(errJson.error || 'Failed to fetch conversations');
        if (isFirst) setLoading(false);
        return;
      }
    } catch (netErr: any) {
      console.error('[BotConversationsContext] Network error:', netErr.message);
      setError(netErr.message || 'Network error');
      if (isFirst) setLoading(false);
      return;
    }

    const sbError = null; // kept for type compatibility below
    if (sbError) {
      if (isFirst) setLoading(false);
      return;
    }

    type Session = {
      id: string;
      psid: string;
      senderName: string;
      lastTime: number;
      barangay: string;
      type: string;
      needsReview: boolean;
      messages: BotMessage[];
    };

    const psidNameMap = new Map<string, string>();
    for (const row of data ?? []) {
      const psid = String(row.sender_psid || row.id || 'unknown');
      const name = row.sender_name;
      if (name && name !== 'Unknown User' && !psidNameMap.has(psid)) {
        psidNameMap.set(psid, name);
      }
    }

    const sessions: Session[] = [];
    const psidToLastIdx = new Map<string, number>();

    for (const row of data ?? []) {
      const psid = String(row.sender_psid || row.id || 'unknown');
      const rowTime = new Date(row.timestamp).getTime();
      const lastIdx = psidToLastIdx.get(psid);
      const resolvedName = psidNameMap.get(psid) ?? 'Unknown User';
      const rowBarangay = row.barangay && String(row.barangay).trim() ? String(row.barangay).trim() : '';
      const rowType = row.incident_type && String(row.incident_type).trim()
        ? String(row.incident_type).trim()
        : (row.intent && String(row.intent).trim() ? String(row.intent).trim() : '');
      const rowNeedsReview = Boolean(
        row.needs_review === true ||
        row.location_status === 'not_found' ||
        (!rowBarangay || rowBarangay.toLowerCase() === 'unknown')
      );

      let session: Session;
      if (lastIdx === undefined || rowTime - sessions[lastIdx].lastTime > INACTIVITY_GAP_MS) {
        session = {
          id: `${psid}_${rowTime}`,
          psid,
          senderName: resolvedName,
          lastTime: rowTime,
          barangay: rowBarangay,
          type: rowType,
          needsReview: rowNeedsReview,
          messages: [],
        };
        sessions.push(session);
        psidToLastIdx.set(psid, sessions.length - 1);
      } else {
        session = sessions[lastIdx];
        session.lastTime = rowTime;
        if (session.senderName === 'Unknown User' && resolvedName !== 'Unknown User') {
          session.senderName = resolvedName;
        }
        if (!session.barangay && rowBarangay) {
          session.barangay = rowBarangay;
        }
        if (!session.type && rowType) {
          session.type = rowType;
        }
        if (rowNeedsReview) {
          session.needsReview = true;
        }
      }

      if (row.user_message) session.messages.push({ sender: 'user', text: row.user_message, timestamp: row.timestamp });
      if (row.ai_reply) session.messages.push({ sender: 'bot', text: row.ai_reply, timestamp: row.timestamp });
    }

    if (sessions.length > 0) {
      const mapped: BotConversation[] = sessions
        .sort((a, b) => b.lastTime - a.lastTime)
        .map((session) => {
          const timeFormatted = formatTimestampPHT(session.lastTime);

          const override = statusOverridesRef.current[session.id];
          const calculatedStatus = session.needsReview || !session.barangay ? 'Incomplete' : 'Complete';

          return {
            id: session.id,
            psid: session.psid,
            name:
              session.senderName !== 'Unknown User'
                ? session.senderName
                : `PSID: ${session.psid.slice(-6)}`,
            barangay: session.barangay ? normalizeBarangayName(session.barangay) : 'General',
            type: session.type ? titleCase(session.type) : 'Emergency',
            status: override || calculatedStatus,
            time: timeFormatted,
            createdAt: new Date(session.lastTime).toISOString(),
            messages: session.messages,
          };
        });

      setConversations(mapped);
    } else {
      // Keep sample conversations merged with latest overrides
      const overrides = statusOverridesRef.current;
      setConversations(
        initialBotConversations.map((c) => ({
          ...c,
          status: overrides[c.id] || c.status,
        }))
      );
    }

    if (isFirst) setLoading(false);
  }, []);

  useEffect(() => {
    fetchConversations(true);
    const interval = setInterval(() => fetchConversations(false), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchConversations]);

  const incompleteCount = conversations.filter((c) => c.status === 'Incomplete').length;

  return (
    <BotConversationsContext.Provider
      value={{
        conversations,
        updateConversationStatus,
        loading,
        error,
        refetchConversations: () => fetchConversations(false),
        incompleteCount,
      }}
    >
      {children}
    </BotConversationsContext.Provider>
  );
}

export function useBotConversations() {
  const ctx = useContext(BotConversationsContext);
  if (!ctx) {
    throw new Error('useBotConversations must be used within a BotConversationsProvider');
  }
  return ctx;
}
