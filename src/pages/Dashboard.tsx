import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, ExternalLink, MapPin, Clock, User, AlertCircle, CheckCircle, HelpCircle, Loader2 } from 'lucide-react';
import { StaggerContainer, StaggerItem } from '../components/Stagger';
import { useTheme } from '../components/ThemeContent';
import { supabase } from '../lib/supabaseClient';
import MapContainer from '../components/MapContainer';
import { useReports } from '../context/ReportsContext';
import type { MapLayerState } from '../types/geospatial';

// ── Types ──
interface BotMessage { sender: 'bot' | 'user'; text: string; }
interface BotConversation {
  id: string; psid: string; name: string; barangay: string; type: string;
  status: 'Unread' | 'Complete'; time: string; messages: BotMessage[];
}
interface ScraperItem {
  id: string; text: string; barangay: string; type: string;
  urgency: 'High' | 'Moderate' | 'Low'; source: string; time: string;
  status: 'Pending Review' | 'Verified' | 'False Alarm';
  reporter: string; confidence: number;
}

// ── Toast Type ──
interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

// ── Helpers ──
const INACTIVITY_GAP_MS = 60 * 60 * 1000;

function formatTimestamp(ts: string | null): string {
  if (!ts) return '';
  const d = new Date(ts);
  if (isNaN(d.getTime())) return String(ts);
  return `${d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })} ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
}

function inferType(incidentType: string, text: string): string {
  const t = (incidentType || '').toLowerCase();
  const txt = (text || '').toLowerCase();
  if (t === 'casualty' || t === 'medical' || txt.includes('sugat') || txt.includes('ospital') || txt.includes('ambulansya') || txt.includes('medic')) return 'Medical';
  if (t === 'evacuation' || txt.includes('evacuate') || txt.includes('stranded') || txt.includes('nakaipit') || txt.includes('rescue')) return 'Search & Rescue';
  if (t === 'flood' || t === 'landslide' || t === 'earthquake' || t === 'fire' || txt.includes('gumuhong') || txt.includes('bumagsak') || txt.includes('putol') || txt.includes('poste') || txt.includes('kuryente')) return 'Infrastructure';
  if (txt.includes('food') || txt.includes('tubig') || txt.includes('relief') || txt.includes('gatas') || txt.includes('gamot') || txt.includes('supply')) return 'Food & Water';
  return 'Medical';
}

function inferUrgency(incidentType: string, text: string): ScraperItem['urgency'] {
  const t = (incidentType || '').toLowerCase();
  const txt = (text || '').toLowerCase();
  const high = ['emergency', 'casualty', 'fire', 'now', 'asap', 'naipit', 'natabunan', 'patay', 'matanda', 'bata', 'nawawala'];
  const mod = ['flood', 'evacuation', 'landslide', 'earthquake', 'baha', 'gumuhong', 'tumumba', 'putol'];
  if (high.some(k => t.includes(k) || txt.includes(k))) return 'High';
  if (mod.some(k => t.includes(k) || txt.includes(k))) return 'Moderate';
  return 'Low';
}

// ── Animation presets ──
const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: 20 },
};

const contentVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

// ── Toast Item Component ──
function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 3500);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const icon = toast.type === 'success'
    ? <CheckCircle className="w-4 h-4 text-emerald-500" />
    : toast.type === 'error'
      ? <AlertCircle className="w-4 h-4 text-red-500" />
      : <Loader2 className="w-4 h-4 text-blue-500" />;

  const bgClass = toast.type === 'success'
    ? 'bg-white dark:bg-slate-800 border-emerald-200 dark:border-emerald-800'
    : toast.type === 'error'
      ? 'bg-white dark:bg-slate-800 border-red-200 dark:border-red-800'
      : 'bg-white dark:bg-slate-800 border-blue-200 dark:border-blue-800';

  return (
    <motion.div
      initial={{ opacity: 0, x: 60, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40, scale: 0.95 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg ${bgClass} min-w-[280px] max-w-[380px]`}
    >
      {icon}
      <span className="text-sm font-medium text-slate-700 dark:text-slate-200 flex-1">{toast.message}</span>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { reports } = useReports();

  // Data states
  const [botConversations, setBotConversations] = useState<BotConversation[]>([]);
  const [scraperItems, setScraperItems] = useState<ScraperItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [activeConv, setActiveConv] = useState<BotConversation | null>(null);
  const [selectedConvId, setSelectedConvId] = useState<string>('');
  const [activeScraper, setActiveScraper] = useState<ScraperItem | null>(null);

  // ── Toast State ──
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [toastIdCounter, setToastIdCounter] = useState(0);
  const showToast = (message: string, type: Toast['type'] = 'info') => {
    const id = toastIdCounter + 1;
    setToastIdCounter(id);
    setToasts((prev) => [...prev, { id, message, type }]);
  };
  const dismissToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // ── Ref to prevent Strict Mode duplicate toasts ──
  const hasShownInitialToast = useRef(false);

  // ── Fetch from Supabase ──
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const [convRes, scraperRes] = await Promise.all([
        supabase.from('conversations').select('*').order('timestamp', { ascending: true }),
        supabase.from('fb_comments').select('*').order('created_at', { ascending: false }),
      ]);

      // ── Process Conversations (group by PSID session) ──
      type Session = { id: string; psid: string; senderName: string; lastTime: number; messages: BotMessage[] };
      const sessions: Session[] = [];
      const psidToLastIdx = new Map<string, number>();

      if (!convRes.error && convRes.data) {
        for (const row of convRes.data) {
          const psid = String(row.sender_psid || row.id || 'unknown');
          const rowTime = new Date(row.timestamp).getTime();
          const lastIdx = psidToLastIdx.get(psid);

          let session: Session;
          if (lastIdx === undefined || rowTime - sessions[lastIdx].lastTime > INACTIVITY_GAP_MS) {
            session = {
              id: `${psid}_${rowTime}`,
              psid,
              senderName: row.sender_name || 'Unknown User',
              lastTime: rowTime,
              messages: [],
            };
            sessions.push(session);
            psidToLastIdx.set(psid, sessions.length - 1);
          } else {
            session = sessions[lastIdx];
            session.lastTime = rowTime;
            if (session.senderName === 'Unknown User' && row.sender_name && row.sender_name !== 'Unknown User') {
              session.senderName = row.sender_name;
            }
          }

          if (row.user_message) session.messages.push({ sender: 'user', text: row.user_message });
          if (row.ai_reply) session.messages.push({ sender: 'bot', text: row.ai_reply });
        }
      }

      const mappedConvs: BotConversation[] = sessions
        .sort((a, b) => b.lastTime - a.lastTime)
        .map(session => ({
          id: session.id,
          psid: session.psid,
          name: session.senderName !== 'Unknown User' ? session.senderName : `PSID: ${session.psid.slice(-6)}`,
          barangay: 'General',
          type: 'Emergency',
          status: 'Complete',
          time: formatTimestamp(new Date(session.lastTime).toISOString()),
          messages: session.messages,
        }));

      // ── Process Scraper Posts ──
      const mappedScraper: ScraperItem[] = [];
      if (!scraperRes.error && scraperRes.data) {
        for (const row of scraperRes.data) {
          const text = row.comment_text || '';
          mappedScraper.push({
            id: String(row.id),
            text,
            barangay: row.barangay || 'Unknown',
            type: inferType(row.incident_type, text),
            urgency: inferUrgency(row.incident_type, text),
            source: 'Facebook Comment',
            time: formatTimestamp(row.created_at),
            status: 'Pending Review',
            reporter: row.user_name || 'Unknown',
            confidence: 0,
          });
        }
      }

      setBotConversations(mappedConvs);
      setScraperItems(mappedScraper);
      setLoading(false);

      // Toast feedback
      if (!hasShownInitialToast.current) {
        hasShownInitialToast.current = true;
        const total = mappedConvs.length + mappedScraper.length;
        if (total > 0) {
          showToast(`${total} items loaded — ${mappedConvs.length} bot, ${mappedScraper.length} scraper`, 'success');
        }
      }

      if (convRes.error) {
        showToast(`Bot data error: ${convRes.error.message}`, 'error');
      }
      if (scraperRes.error) {
        showToast(`Scraper data error: ${scraperRes.error.message}`, 'error');
      }
    };

    fetchData();
  }, []);

  // Stats
  const totalIncidents = botConversations.length + scraperItems.length;
  const avgResponse = 0;

  // ── Dashboard Map Data ──
  const URGENCY_WEIGHTS: Record<string, number> = { High: 3, Moderate: 2, Low: 1 };

  const dashboardMapLayers: MapLayerState = { choropleth: true, pins: true, boundaries: true };

  const dashboardBarangayCounts = useMemo(() => {
    const maxUrgency: Record<string, number> = {};
    reports
      .filter((r) => r.status === 'verified' || r.status === 'under_review')
      .forEach((r) => {
        const weight = URGENCY_WEIGHTS[r.urgency] || 1;
        maxUrgency[r.barangay] = Math.max(maxUrgency[r.barangay] || 0, weight);
      });
    return maxUrgency;
  }, [reports]);

  const dashboardPinReports = useMemo(() => {
    return reports.filter((r) =>
      (r.status === 'verified' || r.status === 'under_review') &&
      r.coordinates && r.coordinates.includes(',')
    );
  }, [reports]);

  const openConversation = (conv: BotConversation) => {
    setSelectedConvId(conv.id);
    setActiveConv(conv);
  };

  const selectedConversation = botConversations.find(c => c.id === selectedConvId) || activeConv;

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'High': return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
      case 'Moderate': return 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800';
      case 'Low': return 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600';
      default: return 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Search & Rescue': return 'text-orange-600 dark:text-orange-400';
      case 'Medical': return 'text-emerald-600 dark:text-emerald-400';
      case 'Food & Water': return 'text-blue-600 dark:text-blue-400';
      case 'Infrastructure': return 'text-purple-600 dark:text-purple-400';
      default: return 'text-slate-600 dark:text-slate-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Verified': return <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />;
      case 'False Alarm': return <AlertCircle className="w-3.5 h-3.5 text-amber-500" />;
      default: return <HelpCircle className="w-3.5 h-3.5 text-blue-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Verified': return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800';
      case 'False Alarm': return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800';
      default: return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800';
    }
  };

  // ════════════════════════════════════════
  //  FIX #1: Smooth loading — render ONLY a spinner while fetching.
  //  This prevents StaggerContainer from mounting early and shaking
  //  as empty states flip to populated lists.
  // ════════════════════════════════════════
  if (loading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 animate-pulse">
          Loading dashboard…
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Toast Notifications — Top Right */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <div key={toast.id} className="pointer-events-auto">
              <ToastItem toast={toast} onDismiss={dismissToast} />
            </div>
          ))}
        </AnimatePresence>
      </div>

      {/* ════════════════════════════════════════
          FIX #2: Prevent horizontal scrollbar
          by adding overflow-x-hidden.
         ════════════════════════════════════════ */}
      <StaggerContainer className="grid grid-cols-12 gap-6 h-full lg:grid-rows-[auto_1fr] overflow-x-hidden w-full">

        {/* ── 1. Stats Row ── */}
        <StaggerItem className="col-span-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-900/30 flex items-center justify-center text-xl">⚠️</div>
              <div>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{totalIncidents}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Incidents</p>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-xl">💬</div>
              <div>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{botConversations.length}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Bot Conversations</p>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center text-xl">🌐</div>
              <div>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{scraperItems.length}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Scraped Comments</p>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-50 dark:bg-green-900/30 flex items-center justify-center text-xl">⏱️</div>
              <div>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{avgResponse}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Avg Response Time</p>
              </div>
            </div>
          </div>
        </StaggerItem>

        {/* ── 2. Left Column ── */}
        <StaggerItem className="col-span-12 lg:col-span-6 flex flex-col gap-6 h-full lg:min-h-0">
          {/* Messenger Bot Activities */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex-1 flex flex-col lg:min-h-0 overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <h3 className="font-semibold text-slate-800 dark:text-slate-100">Messenger Bot Activities</h3>
            </div>
            <div className="p-2 overflow-y-auto flex-1 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
              {botConversations.length === 0 ? (
                <div className="flex items-center justify-center py-10 text-slate-400 dark:text-slate-500 text-sm">No conversations yet.</div>
              ) : (
                botConversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => openConversation(conv)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700/30 rounded-lg transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-xs text-slate-600 dark:text-slate-300 shrink-0">
                      {conv.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate">{conv.name}</p>
                    </div>
                    <span className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">{conv.type}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${conv.status === 'Unread'
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      : 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                      }`}>{conv.status}</span>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Scraper Activities */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex-1 flex flex-col lg:min-h-0 overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <h3 className="font-semibold text-slate-800 dark:text-slate-100">Scraper Activities</h3>
            </div>
            <div className="p-4 space-y-3 overflow-y-auto flex-1 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
              {scraperItems.length === 0 ? (
                <div className="flex items-center justify-center py-10 text-slate-400 dark:text-slate-500 text-sm">No scraped posts yet.</div>
              ) : (
                scraperItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveScraper(item)}
                    className="w-full text-left p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 flex-1">{item.text}</p>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border ${getStatusColor(item.status)} flex items-center gap-1`}>
                        {getStatusIcon(item.status)}{item.status}
                      </span>
                      <span className={`text-[10px] font-medium ${getTypeColor(item.type)}`}>{item.type}</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 ml-auto">{item.time}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </StaggerItem>

        {/* ── 3. Heat Map (Real MapContainer) ── */}
        <StaggerItem className="col-span-12 lg:col-span-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col lg:min-h-0">
          <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100">Talisay Heat Map</h3>
            <button
              onClick={() => navigate('/geospatial-map')}
              className="flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              View Full Map <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="relative flex-1 min-h-[320px]">
            <MapContainer
              theme={theme}
              layers={dashboardMapLayers}
              barangayCounts={dashboardBarangayCounts}
              pinReports={dashboardPinReports}
              onSelectFeature={() => { }}
            />
          </div>
          <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-700 flex justify-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">High</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Moderate</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Low</span>
            </div>
          </div>
        </StaggerItem>

      </StaggerContainer>

      {/* ════════════════════════════════════════
          CONVERSATION MODAL — Staggered
         ════════════════════════════════════════ */}
      <AnimatePresence>
        {activeConv && selectedConversation && (
          <motion.div
            key="conv-modal-backdrop"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setActiveConv(null)}
          >
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-4xl h-[80vh] flex overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Left: Conversation List */}
              <div className="w-80 border-r border-slate-100 dark:border-slate-700 flex flex-col shrink-0 h-full">
                <div className="p-4 border-b border-slate-100 dark:border-slate-700">
                  <h3 className="font-semibold text-slate-800 dark:text-slate-100">Recent Conversations</h3>
                </div>
                <div className="flex-1 overflow-y-auto min-h-0">
                  {botConversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConvId(conv.id)}
                      className={`w-full flex items-center gap-3 p-4 text-left transition-colors border-l-4 ${selectedConvId === conv.id
                        ? 'bg-slate-50 dark:bg-slate-700/40 border-l-blue-500'
                        : 'border-l-transparent hover:bg-slate-50 dark:hover:bg-slate-700/30'
                        }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 shrink-0 text-sm">
                        {conv.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{conv.name}</p>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0 ml-2">{conv.time}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-slate-500 dark:text-slate-400">{conv.type}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${conv.status === 'Unread'
                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                            : 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                            }`}>{conv.status}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Right: Chat View — Staggered */}
              <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={selectedConvId}
                    variants={contentVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                    className="flex-1 flex flex-col min-w-0 h-full"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-700">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 text-sm">
                          {selectedConversation.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{selectedConversation.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{selectedConversation.barangay} • {selectedConversation.type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {selectedConversation.status === 'Unread' && (
                          <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium border border-blue-100 dark:border-blue-800">
                            Unread
                          </span>
                        )}
                        <button
                          onClick={() => setActiveConv(null)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Messages — Staggered */}
                    <div className="flex-1 overflow-y-auto min-h-0 p-5 bg-slate-50/50 dark:bg-slate-900/30">
                      <StaggerContainer className="space-y-4">
                        {selectedConversation.messages.map((msg, i) =>
                          msg.sender === 'bot' ? (
                            <StaggerItem key={i}>
                              <div className="flex items-start gap-2.5 justify-end">
                                <div className="bg-blue-600 rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[75%]">
                                  <p className="text-sm text-white leading-relaxed">{msg.text}</p>
                                </div>
                                <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-[10px] font-bold text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">B</div>
                              </div>
                            </StaggerItem>
                          ) : (
                            <StaggerItem key={i}>
                              <div className="flex items-start gap-2.5">
                                <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-[10px] font-bold text-slate-500 dark:text-slate-300 shrink-0 mt-0.5">U</div>
                                <div className="bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[75%]">
                                  <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">{msg.text}</p>
                                </div>
                              </div>
                            </StaggerItem>
                          )
                        )}
                      </StaggerContainer>
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 flex justify-end">
                      <button
                        onClick={() => { setActiveConv(null); showToast('Navigating to Messenger Bot Logs', 'info'); navigate('/messenger-bot-logs'); }}
                        className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
                      >
                        Go to MessengerBot<ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ════════════════════════════════════════
          SCRAPER MODAL — Staggered
         ════════════════════════════════════════ */}
      <AnimatePresence>
        {activeScraper && (
          <motion.div
            key="scraper-modal-backdrop"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setActiveScraper(null)}
          >
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-lg overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm text-slate-500 dark:text-slate-400">#{activeScraper.id.slice(-10)}</span>
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${getUrgencyColor(activeScraper.urgency)}`}>
                    {activeScraper.urgency}
                  </span>
                </div>
                <button onClick={() => setActiveScraper(null)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body — Staggered */}
              <div className="px-6 py-5">
                <StaggerContainer className="space-y-5">
                  <StaggerItem>
                    <div>
                      <h3 className={`text-lg font-bold ${getTypeColor(activeScraper.type)}`}>{activeScraper.type}</h3>
                      <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">{activeScraper.barangay}, Talisay</p>
                    </div>
                  </StaggerItem>

                  <StaggerItem>
                    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
                      <p className="text-slate-700 dark:text-slate-200 text-sm leading-relaxed">&ldquo;{activeScraper.text}&rdquo;</p>
                    </div>
                  </StaggerItem>

                  <StaggerItem>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-start gap-2.5">
                        <User className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider font-medium">Original Poster</p>
                          <p className="text-sm text-slate-700 dark:text-slate-200 font-medium">{activeScraper.reporter}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <Clock className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider font-medium">Scraped At</p>
                          <p className="text-sm text-slate-700 dark:text-slate-200">{activeScraper.time}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider font-medium">Source</p>
                          <p className="text-sm text-slate-700 dark:text-slate-200">{activeScraper.source}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <AlertCircle className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider font-medium">NLP Confidence</p>
                          <p className="text-sm text-slate-700 dark:text-slate-200 font-mono">{activeScraper.confidence > 0 ? `${(activeScraper.confidence * 100).toFixed(0)}%` : 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  </StaggerItem>

                  <StaggerItem>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 dark:text-slate-400">Status:</span>
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded border ${getStatusColor(activeScraper.status)}`}>
                        {getStatusIcon(activeScraper.status)}{activeScraper.status}
                      </span>
                    </div>
                  </StaggerItem>
                </StaggerContainer>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                <button onClick={() => setActiveScraper(null)} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                  Close
                </button>
                <button
                  onClick={() => { setActiveScraper(null); showToast('Navigating to Scraper Feed', 'info'); navigate('/scraper-feed'); }}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
                >
                  Go to Scraper Feed<ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}