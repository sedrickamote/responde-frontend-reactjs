import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, ExternalLink, MapPin, Clock, User, AlertCircle, CheckCircle, HelpCircle } from 'lucide-react';
import { StaggerContainer, StaggerItem } from '../components/Stagger';
import { supabase } from '../lib/supabaseClient';

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

export default function Dashboard() {
  const navigate = useNavigate();

  // Data states
  const [botConversations, setBotConversations] = useState<BotConversation[]>([]);
  const [scraperItems, setScraperItems] = useState<ScraperItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [activeConv, setActiveConv] = useState<BotConversation | null>(null);
  const [selectedConvId, setSelectedConvId] = useState<string>('');
  const [activeScraper, setActiveScraper] = useState<ScraperItem | null>(null);

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
    };

    fetchData();
  }, []);

  // Stats
  const totalIncidents = botConversations.length + scraperItems.length;
  const avgResponse = 0;

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

  return (
    <>
      <StaggerContainer className="grid grid-cols-12 gap-6 h-full lg:grid-rows-[auto_1fr]">
        
        {/* ── 1. Stats Row ── */}
        <StaggerItem className="col-span-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-900/30 flex items-center justify-center text-xl">⚠️</div>
              <div>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{loading ? '—' : totalIncidents}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Incidents</p>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-xl">💬</div>
              <div>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{loading ? '—' : botConversations.length}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Bot Conversations</p>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center text-xl">🌐</div>
              <div>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{loading ? '—' : scraperItems.length}</p>
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
              {loading && <span className="text-xs text-slate-400 animate-pulse">Loading...</span>}
            </div>
            <div className="p-2 overflow-y-auto flex-1 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
              {botConversations.length === 0 && !loading ? (
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
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      conv.status === 'Unread'
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
              {loading && <span className="text-xs text-slate-400 animate-pulse">Loading...</span>}
            </div>
            <div className="p-4 space-y-3 overflow-y-auto flex-1 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
              {scraperItems.length === 0 && !loading ? (
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

        {/* ── 3. Heat Map ── */}
        <StaggerItem className="col-span-12 lg:col-span-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col lg:min-h-0">
          <div className="p-5 border-b border-slate-100 dark:border-slate-700">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100">Talisay Heat Map</h3>
          </div>
          <div className="p-4 flex flex-col h-full min-h-0">
            <div className="flex-1 min-h-0 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center p-3">
              <svg viewBox="0 0 400 320" className="w-full h-full">
                <rect width="400" height="320" fill="transparent" rx="6"/>
                <path d="M 70 50 L 200 35 L 330 65 L 360 170 L 310 280 L 140 295 L 45 240 L 35 140 Z" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="2"/>
                <path d="M 200 35 L 330 65 L 360 170 L 260 150 L 230 80 Z" fill="#fca5a5" stroke="#ef4444" strokeWidth="1.5" opacity="0.75"/>
                <circle cx="290" cy="100" r="5" fill="#ef4444"/>
                <text x="290" y="98" fontSize="9" fill="#7f1d1d" textAnchor="middle" fontWeight="600">Sampaloc</text>
                <path d="M 70 50 L 200 35 L 230 80 L 260 150 L 170 190 L 90 170 L 35 140 Z" fill="#fde68a" stroke="#eab308" strokeWidth="1.5" opacity="0.7"/>
                <circle cx="155" cy="110" r="5" fill="#eab308"/>
                <text x="155" y="108" fontSize="9" fill="#713f12" textAnchor="middle" fontWeight="600">Leynes</text>
                <path d="M 35 140 L 90 170 L 170 190 L 260 150 L 310 280 L 140 295 L 45 240 Z" fill="#86efac" stroke="#22c55e" strokeWidth="1.5" opacity="0.6"/>
                <circle cx="130" cy="230" r="5" fill="#22c55e"/>
                <text x="130" y="228" fontSize="9" fill="#14532d" textAnchor="middle" fontWeight="600">Banga</text>
                <text x="200" y="315" fontSize="10" fill="#64748b" textAnchor="middle">Barangays by Incident Density</text>
              </svg>
            </div>
            <div className="mt-3 flex justify-center gap-4">
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
          </div>
        </StaggerItem>

      </StaggerContainer>

      {/* ════════════════════════════════════════
          CONVERSATION MODAL — Animated
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
                      className={`w-full flex items-center gap-3 p-4 text-left transition-colors border-l-4 ${
                        selectedConvId === conv.id
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
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                            conv.status === 'Unread'
                              ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                              : 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                          }`}>{conv.status}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Right: Chat View */}
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

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto min-h-0 p-5 space-y-4 bg-slate-50/50 dark:bg-slate-900/30">
                      {selectedConversation.messages.map((msg, i) =>
                        msg.sender === 'bot' ? (
                          <div key={i} className="flex items-start gap-2.5 justify-end">
                            <div className="bg-blue-600 rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[75%]">
                              <p className="text-sm text-white leading-relaxed">{msg.text}</p>
                            </div>
                            <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-[10px] font-bold text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">B</div>
                          </div>
                        ) : (
                          <div key={i} className="flex items-start gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-[10px] font-bold text-slate-500 dark:text-slate-300 shrink-0 mt-0.5">U</div>
                            <div className="bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[75%]">
                              <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">{msg.text}</p>
                            </div>
                          </div>
                        )
                      )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 flex justify-end">
                      <button
                        onClick={() => { setActiveConv(null); navigate('/messenger-bot-logs'); }}
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
          SCRAPER MODAL — Animated
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

              {/* Body */}
              <div className="px-6 py-5 space-y-5">
                <div>
                  <h3 className={`text-lg font-bold ${getTypeColor(activeScraper.type)}`}>{activeScraper.type}</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">{activeScraper.barangay}, Talisay</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
                  <p className="text-slate-700 dark:text-slate-200 text-sm leading-relaxed">"{activeScraper.text}"</p>
                </div>
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
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Status:</span>
                  <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded border ${getStatusColor(activeScraper.status)}`}>
                    {getStatusIcon(activeScraper.status)}{activeScraper.status}
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                <button onClick={() => setActiveScraper(null)} className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                  Close
                </button>
                <button
                  onClick={() => { setActiveScraper(null); navigate('/scraper-feed'); }}
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