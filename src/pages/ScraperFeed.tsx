import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  Filter, Globe, MessageCircle, AlertTriangle, MapPin, Clock,
  CheckCircle, XCircle, Brain, Users, ExternalLink,
  Loader2, Radio, X, ChevronLeft, ChevronDown, RotateCcw,
  Sparkles, CheckCircle2, Layers
} from "lucide-react";
import DatePicker from "../components/DatePicker";
import FilterDropdown from "../components/DropDown";
import { StaggerContainer, StaggerItem } from "../components/Stagger";
import { authService } from "../services/authService";
import PageLoader from "../components/PageLoader";
import { TALISAY_BARANGAYS } from "../data/talisay-barangays";
import { formatTimestampPHT } from "../utils/dateUtils";

interface ScrapedPost {
  id: string;
  source: "Facebook Page" | "Facebook Comment" | "Group Post";
  author: string;
  avatar: string;
  rawText: string;
  barangay: string;
  type: "Search & Rescue" | "Medical" | "Food & Water" | "Infrastructure";
  urgency: "High" | "Moderate" | "Low";
  status: "New" | "Verified" | "Flagged" | "Resolved";
  timestamp: string;
  createdAt?: string;
  confidence: number;
  isIncident: boolean;
  nlpCategory?: "Incident" | "Non-Incident";
  nlpReason?: string;
  extractedEntities: {
    location: string;
    contact?: string;
    peopleAffected?: number;
    needs?: string[];
  };
}

// -- Toast Type --
interface Toast {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}

// -- Apple Design Spring Physics & Motion --
const APPLE_SPRING = { type: "spring", stiffness: 400, damping: 32 } as const;

const contentVariants: Variants = {
  hidden: { opacity: 0, x: 12, scale: 0.99 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: APPLE_SPRING,
  },
  exit: {
    opacity: 0,
    x: -8,
    scale: 0.99,
    transition: { duration: 0.15, ease: "easeOut" },
  },
};

export const INACTIVITY_GAP_MS = 60 * 60 * 1000;

// -- Apple Notification Toast Component --
function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 3500);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const icon = toast.type === "success"
    ? <CheckCircle className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
    : toast.type === "error"
      ? <AlertTriangle className="w-4 h-4 text-red-500 dark:text-red-400" />
      : <Loader2 className="w-4 h-4 text-[#0071E3] dark:text-blue-400 animate-spin" />;

  const badgeBg = toast.type === "success"
    ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border border-emerald-500/20"
    : toast.type === "error"
      ? "bg-red-50 dark:bg-red-950/40 text-red-600 border border-red-500/20"
      : "bg-blue-50 dark:bg-blue-950/40 text-[#0071E3] border border-blue-500/20";

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -16, scale: 0.94 }}
      transition={{ type: "spring", stiffness: 420, damping: 30 }}
      className="flex items-center gap-3 px-4 py-3 rounded-2xl backdrop-blur-2xl bg-white/90 dark:bg-[#1C2433]/90 border border-slate-200/80 dark:border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.12)] border-t border-t-white/80 dark:border-t-white/20 min-w-[300px] max-w-[400px]"
    >
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${badgeBg}`}>
        {icon}
      </div>
      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex-1 leading-snug">
        {toast.message}
      </span>
      <button
        onClick={() => onDismiss(toast.id)}
        className="w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-[0.92] transition-all"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
}

// ── Heuristic: map DB incident_type + text to UI type ──
function inferType(incidentType: string, text: string): ScrapedPost["type"] {
  const t = (incidentType || "").toLowerCase();
  const txt = (text || "").toLowerCase();

  if (t === "casualty" || t === "medical" || txt.includes("sugat") || txt.includes("ospital") || txt.includes("ambulansya") || txt.includes("medic") || txt.includes("nabalian") || txt.includes("nasaktan")) return "Medical";
  if (t === "evacuation" || txt.includes("evacuate") || txt.includes("stranded") || txt.includes("nakaipit") || txt.includes("natabunan") || txt.includes("rescue")) return "Search & Rescue";
  if (t === "flood" || t === "landslide" || t === "earthquake" || t === "fire" || txt.includes("gumuhong") || txt.includes("bumagsak") || txt.includes("putol") || txt.includes("poste") || txt.includes("kuryente")) return "Infrastructure";
  if (txt.includes("food") || txt.includes("tubig") || txt.includes("relief") || txt.includes("gatas") || txt.includes("gamot") || txt.includes("supply")) return "Food & Water";

  return "Medical"; // default
}

// ── Heuristic: derive urgency from incident_type + text ──
function inferUrgency(incidentType: string, text: string): ScrapedPost["urgency"] {
  const t = (incidentType || "").toLowerCase();
  const txt = (text || "").toLowerCase();

  const highKeywords = ["emergency", "casualty", "fire", "now", "asap", "urgent", "naipit", "natabunan", "patay", "matanda", "bata", "nawawala"];
  const moderateKeywords = ["flood", "evacuation", "landslide", "earthquake", "baha", "gumuhong", "tumumba", "putol"];

  if (highKeywords.some(k => t.includes(k) || txt.includes(k))) return "High";
  if (moderateKeywords.some(k => t.includes(k) || txt.includes(k))) return "Moderate";
  return "Low";
}

// ── Heuristic: classify whether a scraped text represents a true incident or noise ──
function inferIsIncident(incidentType: string, text: string, confidence: number): {
  isIncident: boolean;
  nlpCategory: "Incident" | "Non-Incident";
  nlpReason: string;
} {
  const txt = (text || "").toLowerCase();
  const t = (incidentType || "").toLowerCase();

  const noiseKeywords = [
    "keep safe", "ingat po", "god bless", "salamat po", "maraming salamat", "thank you",
    "bukas po ba", "anong oras", "saan po pwede", "test comment", "congrats", "pa share",
    "amen", "magkano", "happy", "gandang araw", "good morning", "ingat kayo"
  ];

  const emergencyKeywords = [
    "tulong", "saklolo", "rescue", "baha", "stranded", "naipit", "natabunan", "sugat",
    "ospital", "ambulansya", "emergency", "sunog", "apoy", "gumuhong", "bumagsak",
    "poste", "kuryente", "relief", "tubig", "pagkain", "gamot", "lumikas", "evacuate",
    "evacuation", "landslide", "earthquake", "lindol", "patay", "bata", "matanda",
    "purok", "sitio", "boundary", "urgent", "asap"
  ];

  const hasEmergency = emergencyKeywords.some(k => txt.includes(k) || t.includes(k));
  const hasNoiseOnly = noiseKeywords.some(k => txt.includes(k)) && !hasEmergency;

  if (hasEmergency || confidence >= 60) {
    return {
      isIncident: true,
      nlpCategory: "Incident",
      nlpReason: "Emergency incident intent detected with actionable location, hazards, or resource request.",
    };
  }

  if (hasNoiseOnly || (confidence > 0 && confidence < 35)) {
    return {
      isIncident: false,
      nlpCategory: "Non-Incident",
      nlpReason: "Filtered by NLP: General commentary, community feedback, or non-emergency inquiry.",
    };
  }

  const isInc = hasEmergency;
  return {
    isIncident: isInc,
    nlpCategory: isInc ? "Incident" : "Non-Incident",
    nlpReason: isInc ? "Classified as potential incident report." : "Casual feedback or inquiry without actionable incident payload.",
  };
}

// Fallback seed dataset containing both structured incidents and raw noise
const SAMPLE_SCRAPED_POSTS: ScrapedPost[] = [
  {
    id: "sc-101",
    source: "Facebook Comment",
    author: "Ronaldo Mendoza",
    avatar: "R",
    rawText: "Mataas na po ang baha sa Purok 4 Tumaway, lampas tao na po ang tubig! Kailangan po ng rescue boat agad para sa mga bata at matanda na naipit sa bubong. Contact: 0917-555-1284",
    barangay: "Tumaway",
    type: "Search & Rescue",
    urgency: "High",
    status: "New",
    timestamp: "10/16 9:15 PM",
    createdAt: "2026-10-16T21:15:00.000Z",
    confidence: 96,
    isIncident: true,
    nlpCategory: "Incident",
    nlpReason: "High-priority distress call with rising floodwaters, stranded victims, and emergency contact.",
    extractedEntities: {
      location: "Purok 4, Tumaway",
      contact: "0917-555-1284",
      peopleAffected: 6,
      needs: ["Rescue Boat", "Immediate Evacuation", "Life Vests"],
    },
  },
  {
    id: "sc-102",
    source: "Facebook Page",
    author: "Elena Castillo",
    avatar: "E",
    rawText: "May vehicular accident dito tapat ng Banga Elementary School, dalawang motor nagbanggaan. May sugatan po sa ulo at nabalian ng binti, need ambulance ASAP!",
    barangay: "Banga",
    type: "Medical",
    urgency: "High",
    status: "New",
    timestamp: "10/16 8:48 PM",
    createdAt: "2026-10-16T20:48:00.000Z",
    confidence: 93,
    isIncident: true,
    nlpCategory: "Incident",
    nlpReason: "Severe trauma casualties requiring immediate ambulance dispatch and paramedic triage.",
    extractedEntities: {
      location: "Front of Banga Elementary School, Banga",
      peopleAffected: 2,
      needs: ["Ambulance", "Paramedics", "Trauma Kit"],
    },
  },
  {
    id: "sc-103",
    source: "Facebook Comment",
    author: "Barangay Leynes Community",
    avatar: "B",
    rawText: "Bumagsak po ang poste ng kuryente sa main road papuntang Sampaloc. Nakaharang at may live wire pa po na umuusok, delikado sa mga motorista.",
    barangay: "Leynes",
    type: "Infrastructure",
    urgency: "Moderate",
    status: "Verified",
    timestamp: "10/16 8:12 PM",
    createdAt: "2026-10-16T20:12:00.000Z",
    confidence: 89,
    isIncident: true,
    nlpCategory: "Incident",
    nlpReason: "Hazardous utility failure: live high-voltage electrical cable blocking roadway.",
    extractedEntities: {
      location: "Main Road boundary, Leynes",
      needs: ["BATELEC Emergency Team", "Road Closure", "Clearing Crew"],
    },
  },
  {
    id: "sc-104",
    source: "Facebook Comment",
    author: "Nanay Remedios",
    avatar: "N",
    rawText: "Nananawagan po kami sa evacuation center dito sa Quiling covered court, ubos na po ang malinis na inuming tubig at gatas ng mga sanggol. Tulong po.",
    barangay: "Quiling",
    type: "Food & Water",
    urgency: "Moderate",
    status: "New",
    timestamp: "10/16 7:30 PM",
    createdAt: "2026-10-16T19:30:00.000Z",
    confidence: 87,
    isIncident: true,
    nlpCategory: "Incident",
    nlpReason: "Critical resource shortage at official evacuation facility affecting infants and evacuees.",
    extractedEntities: {
      location: "Quiling Covered Court Evacuation Center",
      peopleAffected: 38,
      needs: ["Potable Drinking Water", "Infant Formula Milk", "Relief Food Packs"],
    },
  },
  {
    id: "sc-105",
    source: "Facebook Comment",
    author: "Grace Villamor",
    avatar: "G",
    rawText: "Ingat po sa ating lahat na taga Talisay! Malakas pa rin ang bugso ng hangin at ulan. Praying for everyone's safety. God bless us all! 🙏",
    barangay: "General",
    type: "Infrastructure",
    urgency: "Low",
    status: "Resolved",
    timestamp: "10/16 9:20 PM",
    createdAt: "2026-10-16T21:20:00.000Z",
    confidence: 12,
    isIncident: false,
    nlpCategory: "Non-Incident",
    nlpReason: "Filtered by NLP: Community well-wish / prayer with no incident or request for assistance.",
    extractedEntities: { location: "General" },
  },
  {
    id: "sc-106",
    source: "Facebook Comment",
    author: "Mark Anthony Tan",
    avatar: "M",
    rawText: "Maraming salamat po sa mabilis na pagdating ng rescue team kaninang hapon sa Tumaway. Safe na po ang pamilya ko.",
    barangay: "Tumaway",
    type: "Search & Rescue",
    urgency: "Low",
    status: "Resolved",
    timestamp: "10/16 8:55 PM",
    createdAt: "2026-10-16T20:55:00.000Z",
    confidence: 15,
    isIncident: false,
    nlpCategory: "Non-Incident",
    nlpReason: "Filtered by NLP: Post-event appreciation and gratitude message; no ongoing hazard.",
    extractedEntities: { location: "Tumaway" },
  },
  {
    id: "sc-107",
    source: "Facebook Comment",
    author: "Atty. Carlos Dizon",
    avatar: "A",
    rawText: "Bukas po ba ang Land Tax Office bukas ng umaga o suspended din po ang government operations sa Talisay?",
    barangay: "Poblacion Barangay 1",
    type: "Infrastructure",
    urgency: "Low",
    status: "Resolved",
    timestamp: "10/16 7:45 PM",
    createdAt: "2026-10-16T19:45:00.000Z",
    confidence: 18,
    isIncident: false,
    nlpCategory: "Non-Incident",
    nlpReason: "Filtered by NLP: Administrative inquiry regarding office hours and work suspension.",
    extractedEntities: { location: "Poblacion Barangay 1" },
  },
  {
    id: "sc-108",
    source: "Facebook Page",
    author: "Talisay Community Bulletin",
    avatar: "T",
    rawText: "Mag-antabay po sa official Facebook page ng Talisay LGU para sa pinakahuling rainfall advisory mula sa PAGASA.",
    barangay: "General",
    type: "Infrastructure",
    urgency: "Low",
    status: "Resolved",
    timestamp: "10/16 7:10 PM",
    createdAt: "2026-10-16T19:10:00.000Z",
    confidence: 22,
    isIncident: false,
    nlpCategory: "Non-Incident",
    nlpReason: "Filtered by NLP: Public advisory re-share; no specific emergency event.",
    extractedEntities: { location: "General" },
  },
];

// ── Format Supabase timestamp → Philippine Standard Time "M/D h:mm A" ──
function formatTimestamp(ts: string | null): string {
  return formatTimestampPHT(ts);
}

export default function ScraperFeed() {
  const [posts, setPosts] = useState<ScrapedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string>("");

  // Structured (NLP Incidents only) vs Unstructured (Raw Stream with Noise)
  const [viewMode, setViewMode] = useState<"structured" | "unstructured">(() => {
    try {
      return (localStorage.getItem("responde_scraper_view_mode") as any) || "structured";
    } catch {
      return "structured";
    }
  });

  const handleViewModeChange = (mode: "structured" | "unstructured") => {
    setViewMode(mode);
    try {
      localStorage.setItem("responde_scraper_view_mode", mode);
    } catch {}
  };

  // Track seen comments (persisted in localStorage)
  const [seenPostIds, setSeenPostIds] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem('responde_seen_scraper_posts');
      return raw ? new Set(JSON.parse(raw)) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  });

  const markPostSeen = (id: string) => {
    if (!id) return;
    setSeenPostIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      try {
        localStorage.setItem('responde_seen_scraper_posts', JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
  };

  // Mobile navigation & filter states
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Filter states
  const [filterBarangay, setFilterBarangay] = useState("All Barangays");
  const [filterType, setFilterType] = useState("All Types");
  const [filterUrgency, setFilterUrgency] = useState("All Urgency");
  const [filterStatus, setFilterStatus] = useState("All Status");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // -- Toast State --
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [toastIdCounter, setToastIdCounter] = useState(0);
  const showToast = (message: string, type: Toast["type"] = "info") => {
    const id = toastIdCounter + 1;
    setToastIdCounter(id);
    setToasts((prev) => [...prev, { id, message, type }]);
  };
  const dismissToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // -- Ref to prevent Strict Mode duplicate toasts --
  const hasShownInitialToast = useRef(false);

  // Operator manual override: promote/demote between incident and noise
  const togglePostIncidentOverride = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const nextVal = !p.isIncident;
        return {
          ...p,
          isIncident: nextVal,
          nlpCategory: nextVal ? "Incident" : "Non-Incident",
          nlpReason: nextVal
            ? "Manually marked by operator as an actionable emergency incident."
            : "Manually reclassified by operator as non-incident chatter / general noise.",
          confidence: nextVal ? Math.max(p.confidence, 90) : 15,
        };
      })
    );
    showToast("Classification updated", "success");
  };

  const processData = (data: any[] | null, tableName: string) => {
    const sorted = (data ?? []).sort((a, b) => {
      const timeA = new Date(a.created_at || a.timestamp || 0).getTime();
      const timeB = new Date(b.created_at || b.timestamp || 0).getTime();
      return timeB - timeA;
    });

    const mapped: ScrapedPost[] = sorted.map((row: any) => {
      const idVal = row.id || row.comment_id || row.post_id;
      const userName = row.user_name || row.username || row.author || "Unknown";
      const barangay = row.barangay || row.location || "Unknown";
      const text = row.comment_text || row.commentText || row.text || row.raw_text || row.rawText || "";
      const source = row.source || (tableName.toLowerCase().includes("comment") ? "Facebook Comment" : "Facebook Page");
      const confidence = typeof row.confidence === "number" ? row.confidence : 0;
      const status = row.status || "New";

      const extractedEntities = row.extracted_entities || row.extractedEntities || {
        location: barangay !== "Unknown" ? barangay : "Unknown",
        needs: row.needs ? (Array.isArray(row.needs) ? row.needs : [row.needs]) : []
      };

      const nlpInfo = inferIsIncident(row.incident_type || row.type, text, confidence);
      const isIncident = typeof row.is_incident === "boolean" ? row.is_incident : nlpInfo.isIncident;
      const nlpCategory = row.nlp_category || nlpInfo.nlpCategory;
      const nlpReason = row.nlp_reason || nlpInfo.nlpReason;

      return {
        id: String(idVal),
        source: source as ScrapedPost["source"],
        author: userName,
        avatar: userName.charAt(0).toUpperCase(),
        rawText: text,
        barangay,
        type: inferType(row.incident_type || row.type, text),
        urgency: inferUrgency(row.incident_type || row.type, text),
        status: status as ScrapedPost["status"],
        timestamp: formatTimestamp(row.created_at || row.timestamp),
        createdAt: row.created_at || row.timestamp || "",
        confidence: confidence > 0 ? confidence : (isIncident ? 88 : 15),
        isIncident,
        nlpCategory,
        nlpReason,
        extractedEntities: {
          location: extractedEntities.location || (barangay !== "Unknown" ? barangay : "Unknown"),
          contact: row.contact || row.contact_number || extractedEntities.contact,
          peopleAffected: row.people_affected || row.peopleAffected || extractedEntities.peopleAffected,
          needs: Array.isArray(extractedEntities.needs) ? extractedEntities.needs : [],
        },
      };
    });

    setPosts(mapped);
    if (mapped.length > 0) {
      setSelectedId(mapped[0].id);
      markPostSeen(mapped[0].id);
    }
    setLoading(false);

    if (!hasShownInitialToast.current) {
      hasShownInitialToast.current = true;
      showToast(`${mapped.length} scraped comments loaded`, "success");
    }
  };

  // -- Fetch from backend API (authenticated) with graceful mock fallback --
  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      setError(null);

      try {
        const API_BASE = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL ?? '');
        const storedToken = (() => { try { return localStorage.getItem('responde_session_token'); } catch { return null; } })();
        const hdrs: Record<string, string> = { 'Content-Type': 'application/json' };
        if (storedToken) hdrs['Authorization'] = `Bearer ${storedToken}`;

        const res = await fetch(`${API_BASE}/api/auth/data/fb-comments?limit=100`, {
          credentials: 'include',
          headers: hdrs,
        });

        if (!res.ok) {
          // Graceful fallback to mock seed dataset so frontend UI functions without backend dependency
          console.warn('[ScraperFeed] Backend not reachable, using sample seed dataset for UI demo');
          setPosts(SAMPLE_SCRAPED_POSTS);
          if (SAMPLE_SCRAPED_POSTS.length > 0) {
            setSelectedId(SAMPLE_SCRAPED_POSTS[0].id);
            markPostSeen(SAMPLE_SCRAPED_POSTS[0].id);
          }
          setLoading(false);
          return;
        }

        const json = await res.json();
        const data: any[] = json.data ?? [];
        if (data.length === 0) {
          // If database is empty, load rich sample dataset
          setPosts(SAMPLE_SCRAPED_POSTS);
          if (SAMPLE_SCRAPED_POSTS.length > 0) {
            setSelectedId(SAMPLE_SCRAPED_POSTS[0].id);
            markPostSeen(SAMPLE_SCRAPED_POSTS[0].id);
          }
          setLoading(false);
          return;
        }

        processData(data, 'fb_comments');
      } catch (err: any) {
        console.warn('[ScraperFeed] Fetch error, using mock seed dataset for UI demo:', err);
        setPosts(SAMPLE_SCRAPED_POSTS);
        if (SAMPLE_SCRAPED_POSTS.length > 0) {
          setSelectedId(SAMPLE_SCRAPED_POSTS[0].id);
          markPostSeen(SAMPLE_SCRAPED_POSTS[0].id);
        }
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const handleUpdateStatus = async (postId: string, newStatus: ScrapedPost["status"]) => {
    // Optimistically update status locally
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, status: newStatus } : p))
    );

    try {
      await authService.updateFbCommentStatus(postId, newStatus);
      showToast(`Comment marked as ${newStatus.toLowerCase()}`, "success");
    } catch (err: any) {
      console.error("[ScraperFeed] Status update error:", err);
      showToast(`Status updated locally (${newStatus.toLowerCase()})`, "success");
    }
  };

  const handleSelectPost = (id: string) => {
    setSelectedId(id);
    markPostSeen(id);
    setMobileView('detail');
  };

  const activeFilterCount =
    (filterBarangay !== "All Barangays" ? 1 : 0) +
    (filterType !== "All Types" ? 1 : 0) +
    (filterUrgency !== "All Urgency" ? 1 : 0) +
    (filterStatus !== "All Status" ? 1 : 0) +
    (fromDate ? 1 : 0) +
    (toDate ? 1 : 0);

  const hasActiveFilters = activeFilterCount > 0;

  const resetFilters = () => {
    setFilterBarangay("All Barangays");
    setFilterType("All Types");
    setFilterUrgency("All Urgency");
    setFilterStatus("All Status");
    setFromDate("");
    setToDate("");
  };

  const availableBarangays = useMemo(() => {
    const fromPosts = posts.map((p) => p.barangay).filter(Boolean);
    return ["All Barangays", ...Array.from(new Set([...TALISAY_BARANGAYS, ...fromPosts])).sort()];
  }, [posts]);

  const availableTypes = useMemo(() => {
    const base = ["Search & Rescue", "Medical", "Food & Water", "Infrastructure"];
    const fromPosts = posts.map((p) => p.type).filter(Boolean);
    return ["All Types", ...Array.from(new Set([...base, ...fromPosts])).sort()];
  }, [posts]);

  const getPostDateString = (p: ScrapedPost): string | null => {
    if (p.createdAt) {
      try {
        const d = new Date(p.createdAt);
        if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
      } catch {}
    }
    if (p.timestamp) {
      const parts = p.timestamp.split(' ')[0].split('/');
      if (parts.length === 2) {
        const mm = parts[0].padStart(2, '0');
        const dd = parts[1].padStart(2, '0');
        const yyyy = new Date().getFullYear();
        return `${yyyy}-${mm}-${dd}`;
      }
    }
    return null;
  };

  const incidentCount = useMemo(() => posts.filter((p) => p.isIncident).length, [posts]);
  const rawCount = posts.length;

  // Filter logic
  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      // In structured mode, only show verified incident reports
      if (viewMode === "structured" && !p.isIncident) return false;
      if (filterBarangay !== "All Barangays" && p.barangay?.toLowerCase() !== filterBarangay.toLowerCase()) return false;
      if (filterType !== "All Types" && p.type?.toLowerCase() !== filterType.toLowerCase()) return false;
      if (filterUrgency !== "All Urgency" && p.urgency?.toLowerCase() !== filterUrgency.toLowerCase()) return false;
      if (filterStatus !== "All Status" && p.status?.toLowerCase() !== filterStatus.toLowerCase()) return false;
      if (fromDate) {
        const dStr = getPostDateString(p);
        if (dStr && dStr < fromDate) return false;
      }
      if (toDate) {
        const dStr = getPostDateString(p);
        if (dStr && dStr > toDate) return false;
      }
      return true;
    });
  }, [posts, viewMode, filterBarangay, filterType, filterUrgency, filterStatus, fromDate, toDate]);

  const selectedPost = filteredPosts.find((p) => p.id === selectedId) || filteredPosts[0] || null;

  const markAllSeen = () => {
    const allIds = new Set(filteredPosts.map((p) => p.id));
    setSeenPostIds(allIds);
    try {
      localStorage.setItem('responde_seen_scraper_posts', JSON.stringify(Array.from(allIds)));
    } catch {}
  };

  const unseenCount = useMemo(() => {
    return filteredPosts.filter((p) => !seenPostIds.has(p.id) && p.status === 'New').length;
  }, [filteredPosts, seenPostIds]);

  useEffect(() => {
    if (filteredPosts.length > 0) {
      const exists = filteredPosts.some((p) => p.id === selectedId);
      if (!exists) {
        setSelectedId(filteredPosts[0].id);
        markPostSeen(filteredPosts[0].id);
      }
    } else {
      setSelectedId("");
    }
  }, [filteredPosts, selectedId]);

  const AVATAR_PALETTE = [
    "bg-[#1877F2]", // Blue
    "bg-[#E53935]", // Red
    "bg-[#00897B]", // Teal
    "bg-[#1E88E5]", // Sky
    "bg-[#43A047]", // Green
    "bg-[#5E35B1]", // Purple
    "bg-[#FB8C00]", // Orange
  ];

  const getAvatarColor = (name: string): string => {
    let hash = 0;
    for (let i = 0; i < (name || "").length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
  };

  const renderUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case "High":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            High
          </span>
        );
      case "Moderate":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Moderate
          </span>
        );
      case "Low":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700/50">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Low
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700/50">
            {urgency}
          </span>
        );
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "New":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-[#0071E3] dark:text-blue-400 border border-blue-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0071E3] animate-pulse" />
            New
          </span>
        );
      case "Verified":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Verified
          </span>
        );
      case "Flagged":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
            Flagged
          </span>
        );
      case "Resolved":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700/50">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Resolved
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700/50">
            {status}
          </span>
        );
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case "Facebook Page": return <ExternalLink className="w-3 h-3 text-blue-500" />;
      case "Facebook Comment": return <MessageCircle className="w-3 h-3 text-[#0071E3]" />;
      case "Group Post": return <Users className="w-3 h-3 text-emerald-500" />;
      default: return <Globe className="w-3 h-3 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col relative">
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

      {/* Skeleton — shown on first load, replaced by real content */}
      {loading && <PageLoader variant="scraper" />}

      {/* Error State */}
      {!loading && error && (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 max-w-md text-center">
            <AlertTriangle className="w-8 h-8" />
            <p className="font-semibold text-sm">Failed to load scraped comments</p>
            <p className="text-xs text-red-400 font-mono">{error}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Check your Supabase credentials and RLS policies.
            </p>
          </div>
        </div>
      )}

      {/* Main Content */}
      {!loading && !error && (
        <>

          {/* Filters Bar — Frosted Glass with Specular Edge, collapsible on mobile */}
          <div className={`${mobileView === 'detail' ? 'hidden md:block' : 'block'} relative z-30 backdrop-blur-xl bg-white/80 dark:bg-[#111827]/80 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-[0_4px_24px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.25)] border-t border-t-white/80 dark:border-t-white/10 p-3 sm:p-4 transition-all`}>
            {/* Mobile Header Bar with Toggle & Active Filter Count (< md) */}
            <div className="flex items-center justify-between md:hidden mb-2.5">
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
                className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer select-none active:scale-[0.98] transition-transform"
              >
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Filter className="w-3.5 h-3.5" />
                </div>
                <span>Filter Comments</span>
                {activeFilterCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#0071E3] text-white tabular-nums">
                    {activeFilterCount}
                  </span>
                )}
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${mobileFiltersOpen ? 'rotate-180' : ''}`} />
              </button>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#0071E3] dark:text-sky-400 hover:underline cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}
            </div>

            {/* Filter Controls Row — collapsible on mobile, always visible on tablet & desktop */}
            <div className={`${mobileFiltersOpen ? 'flex' : 'hidden'} md:flex flex-col md:flex-row md:flex-wrap items-stretch md:items-center justify-between gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-slate-200/60 dark:border-slate-800/60`}>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:flex md:flex-wrap items-center gap-2.5 sm:gap-3 w-full md:w-auto relative z-20">
                <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 text-xs font-semibold shrink-0 border border-slate-200/50 dark:border-slate-700/50">
                  <Filter className="w-3.5 h-3.5 text-[#0071E3]" />
                  <span>Filters</span>
                </div>

                <FilterDropdown
                  value={filterBarangay}
                  options={availableBarangays}
                  onChange={(val) => { setFilterBarangay(val); setSelectedId(""); }}
                />

                <FilterDropdown
                  value={filterType}
                  options={availableTypes}
                  onChange={(val) => { setFilterType(val); setSelectedId(""); }}
                />

                <FilterDropdown
                  value={filterUrgency}
                  options={["All Urgency", "High", "Moderate", "Low"]}
                  onChange={(val) => { setFilterUrgency(val); setSelectedId(""); }}
                />

                <FilterDropdown
                  value={filterStatus}
                  options={["All Status", "New", "Verified", "Flagged", "Resolved"]}
                  onChange={(val) => { setFilterStatus(val); setSelectedId(""); }}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:flex md:flex-wrap items-center gap-2.5 sm:gap-3 md:ml-auto w-full md:w-auto relative z-10">
                <div className="flex items-center gap-2 flex-1 sm:flex-initial min-w-[130px]">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 whitespace-nowrap">From:</span>
                  <div className="flex-1 sm:w-36">
                    <DatePicker value={fromDate} onChange={setFromDate} placeholder="Select Date" />
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-1 sm:flex-initial min-w-[130px]">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 whitespace-nowrap">To:</span>
                  <div className="flex-1 sm:w-36">
                    <DatePicker value={toDate} onChange={setToDate} placeholder="Select Date" />
                  </div>
                </div>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="col-span-1 sm:col-span-2 md:col-span-auto inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#0071E3] hover:text-blue-700 dark:text-sky-400 bg-blue-500/10 hover:bg-blue-500/15 transition-all duration-150 active:scale-[0.97] cursor-pointer shrink-0 ml-auto sm:ml-0"
                    title="Reset all filters"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Two Column Layout / Responsive Split-Pane */}
          <div className="flex-1 flex flex-col md:grid md:grid-cols-12 gap-3 md:gap-4 lg:gap-6 min-h-0 md:h-[calc(100vh-17.5rem)]">
            {/* LEFT: Post List — macOS Feed Sidebar Style */}
            <div
              className={`
                ${mobileView === 'detail' ? 'hidden md:flex' : 'flex'}
                md:col-span-5 lg:col-span-5 bg-white/85 dark:bg-[#111827]/85 backdrop-blur-xl rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] flex-col overflow-hidden
                h-[calc(100vh-17.5rem)] min-h-[440px] md:h-full md:min-h-0
              `}
            >
              {/* Apple Segmented Switcher Header */}
              <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-b border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between shrink-0 bg-white/70 dark:bg-[#111827]/70 backdrop-blur-md gap-2">
                <div
                  role="tablist"
                  aria-label="Feed View Mode"
                  className="inline-flex items-center p-1 bg-slate-100/90 dark:bg-slate-800/90 backdrop-blur-md rounded-xl border border-slate-200/60 dark:border-white/10 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)]"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={viewMode === "structured"}
                    onClick={() => handleViewModeChange("structured")}
                    className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-tight transition-colors duration-150 select-none cursor-pointer active:scale-[0.98] ${
                      viewMode === "structured"
                        ? "text-[#0071E3] dark:text-sky-300"
                        : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                    }`}
                  >
                    {viewMode === "structured" && (
                      <motion.div
                        layoutId="activeScraperSidebarTab"
                        transition={APPLE_SPRING}
                        className="absolute inset-0 bg-white dark:bg-slate-700/90 border border-slate-200/80 dark:border-white/10 rounded-lg shadow-xs"
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#0071E3] dark:text-sky-400" />
                      <span>Incidents</span>
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold tabular-nums ${
                        viewMode === "structured"
                          ? "bg-[#0071E3] text-white"
                          : "bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                      }`}>
                        {incidentCount}
                      </span>
                    </span>
                  </button>

                  <button
                    type="button"
                    role="tab"
                    aria-selected={viewMode === "unstructured"}
                    onClick={() => handleViewModeChange("unstructured")}
                    className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-tight transition-colors duration-150 select-none cursor-pointer active:scale-[0.98] ${
                      viewMode === "unstructured"
                        ? "text-slate-900 dark:text-white"
                        : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                    }`}
                  >
                    {viewMode === "unstructured" && (
                      <motion.div
                        layoutId="activeScraperSidebarTab"
                        transition={APPLE_SPRING}
                        className="absolute inset-0 bg-white dark:bg-slate-700/90 border border-slate-200/80 dark:border-white/10 rounded-lg shadow-xs"
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                      <span>All Posts</span>
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold tabular-nums ${
                        viewMode === "unstructured"
                          ? "bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900"
                          : "bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                      }`}>
                        {rawCount}
                      </span>
                    </span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {unseenCount > 0 && (
                    <button
                      type="button"
                      onClick={markAllSeen}
                      className="text-[11px] font-medium text-[#0071E3] dark:text-sky-400 hover:underline cursor-pointer"
                    >
                      Mark all read
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto min-h-0 p-2 pb-10 space-y-1">
                {filteredPosts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-4 text-slate-400 dark:text-slate-500 text-sm gap-3">
                    <Radio className="w-8 h-8 stroke-[1.5] text-slate-300 dark:text-slate-600" />
                    <span className="font-medium text-slate-600 dark:text-slate-400">
                      {viewMode === "structured" ? "No structured incidents match current filters." : "No raw comments found."}
                    </span>
                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={resetFilters}
                        className="text-xs font-semibold text-[#0071E3] dark:text-sky-400 hover:underline cursor-pointer"
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                ) : (
                  <StaggerContainer className="space-y-1">
                    {filteredPosts.map((post) => {
                      const isSelected = selectedId === post.id;
                      const isSeen = seenPostIds.has(post.id) || post.status !== 'New';

                      return (
                        <StaggerItem key={post.id} className="w-full">
                          <button
                            type="button"
                            onClick={() => handleSelectPost(post.id)}
                            className={`w-full text-left p-2.5 sm:p-3 rounded-xl transition-all duration-150 relative group active:scale-[0.98] cursor-pointer ${
                              isSelected
                                ? "bg-blue-500/10 dark:bg-blue-500/20 shadow-xs border border-blue-500/25 dark:border-blue-500/30 text-slate-900 dark:text-white"
                                : !isSeen
                                ? "bg-blue-50/40 dark:bg-blue-950/20 hover:bg-blue-50/70 dark:hover:bg-blue-950/30 border border-blue-200/50 dark:border-blue-900/40 text-slate-900 dark:text-white"
                                : "hover:bg-slate-100/70 dark:hover:bg-slate-800/60 border border-transparent text-slate-600 dark:text-slate-400 opacity-90"
                            }`}
                          >
                            {/* Sliding active indicator bar */}
                            {isSelected && (
                              <motion.div
                                layoutId="activePostIndicator"
                                className="absolute left-1 top-2.5 bottom-2.5 w-1 bg-[#0071E3] rounded-full"
                                transition={APPLE_SPRING}
                              />
                            )}

                            <div className="flex items-start gap-2.5 sm:gap-3 pl-1">
                              <div
                                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full ${getAvatarColor(
                                  post.author
                                )} flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-sm ring-2 ${
                                  !isSeen ? "ring-blue-400/80 dark:ring-blue-500/80" : "ring-white/80 dark:ring-slate-800 opacity-80"
                                }`}
                              >
                                {post.avatar || (post.author ? post.author.charAt(0).toUpperCase() : "U")}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-0.5">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    {!isSeen && (
                                      <span
                                        className="w-2 h-2 rounded-full bg-blue-500 shrink-0 shadow-[0_0_8px_rgba(59,130,246,0.6)] animate-pulse"
                                        title="New unread comment"
                                      />
                                    )}
                                    <span
                                      className={`text-xs sm:text-sm truncate transition-colors ${
                                        !isSeen
                                          ? "font-bold text-slate-900 dark:text-white"
                                          : "font-medium text-slate-500 dark:text-slate-400"
                                      }`}
                                    >
                                      {post.author}
                                    </span>
                                  </div>
                                  <span className="text-[10px] sm:text-[11px] font-medium text-slate-400 dark:text-slate-500 tabular-nums whitespace-nowrap ml-2">
                                    {post.timestamp}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 mb-1">
                                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100/80 dark:bg-slate-800/80 px-1.5 sm:px-2 py-0.5 rounded-md border border-slate-200/40 dark:border-slate-700/40 truncate max-w-[120px] sm:max-w-none">
                                    {getSourceIcon(post.source)}
                                    {post.source}
                                  </span>
                                  <span className="text-slate-300 dark:text-slate-600 text-[10px]">•</span>
                                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate">
                                    {post.barangay}
                                  </span>
                                </div>
                                <p
                                  className={`text-xs line-clamp-2 mb-2 leading-relaxed transition-colors ${
                                    !isSeen
                                      ? "font-semibold text-slate-900 dark:text-slate-100"
                                      : "font-normal text-slate-400 dark:text-slate-500"
                                  }`}
                                >
                                  {post.rawText}
                                </p>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {renderUrgencyBadge(post.urgency)}
                                  {renderStatusBadge(post.status)}
                                </div>
                              </div>
                            </div>
                          </button>
                        </StaggerItem>
                      );
                    })}
                  </StaggerContainer>
                )}
              </div>
            </div>

            {/* RIGHT: Post Detail — macOS Inspector Style */}
            <div
              className={`
                ${mobileView === 'list' ? 'hidden md:flex' : 'flex'}
                md:col-span-7 lg:col-span-7 bg-white/90 dark:bg-[#111827]/90 backdrop-blur-xl rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] flex-col overflow-hidden
                h-[calc(100vh-17.5rem)] min-h-[480px] md:h-full md:min-h-0
              `}
            >
              <AnimatePresence mode="wait">
                {selectedPost ? (
                  <motion.div
                    key={selectedPost.id}
                    variants={contentVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="flex flex-col h-full"
                  >
                    {/* Header */}
                    <div className="px-4 sm:px-6 py-3 sm:py-4.5 border-b border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between shrink-0 bg-white/70 dark:bg-[#111827]/70 backdrop-blur-md gap-2">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        {/* Mobile Back Button (Apple iOS style < md) */}
                        <button
                          type="button"
                          onClick={() => setMobileView('list')}
                          className="md:hidden flex items-center gap-0.5 text-[#0071E3] dark:text-blue-400 text-xs font-semibold px-2 py-1 -ml-1 rounded-lg hover:bg-blue-500/10 active:scale-95 transition-all shrink-0 cursor-pointer"
                          aria-label="Back to scraper feed list"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          <span>Feed</span>
                        </button>

                        <div
                          className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full ${getAvatarColor(
                            selectedPost.author
                          )} flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-sm ring-2 ring-white/80 dark:ring-slate-800`}
                        >
                          {selectedPost.avatar || (selectedPost.author ? selectedPost.author.charAt(0).toUpperCase() : "U")}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base tracking-tight truncate">
                            {selectedPost.author}
                          </h3>
                          <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                            <span className="inline-flex items-center gap-1 truncate max-w-[120px] sm:max-w-none">
                              {getSourceIcon(selectedPost.source)}
                              {selectedPost.source}
                            </span>
                            <span className="text-slate-300 dark:text-slate-600">•</span>
                            <span className="flex items-center gap-1 shrink-0">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span className="tabular-nums">{selectedPost.timestamp}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                        {renderUrgencyBadge(selectedPost.urgency)}
                        {renderStatusBadge(selectedPost.status)}
                      </div>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto min-h-0 p-4 sm:p-6 space-y-4 sm:space-y-5 bg-slate-50/40 dark:bg-[#0B0F17]/40">
                      <StaggerContainer className="space-y-4 sm:space-y-5">
                        {/* STRUCTURED VIEW: Highlight Extracted Entities First */}
                        {viewMode === "structured" ? (
                          <>
                            {/* Extracted Entities Grid */}
                            <StaggerItem>
                              <div>
                                <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                                  <Brain className="w-3.5 h-3.5 text-purple-500" />
                                  <span>Extracted Incident Details</span>
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div className="bg-white dark:bg-slate-800/80 rounded-xl p-3.5 border border-slate-200/70 dark:border-slate-700/70 shadow-2xs">
                                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                                      <MapPin className="w-3.5 h-3.5 text-blue-500" />
                                      <span>Extracted Location</span>
                                    </div>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white break-words">
                                      {selectedPost.extractedEntities.location}
                                    </p>
                                  </div>

                                  <div className="bg-white dark:bg-slate-800/80 rounded-xl p-3.5 border border-slate-200/70 dark:border-slate-700/70 shadow-2xs">
                                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                                      <span>Incident Category</span>
                                    </div>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white break-words">
                                      {selectedPost.type}
                                    </p>
                                  </div>

                                  {selectedPost.extractedEntities.contact && (
                                    <div className="bg-white dark:bg-slate-800/80 rounded-xl p-3.5 border border-slate-200/70 dark:border-slate-700/70 shadow-2xs">
                                      <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                                        <Users className="w-3.5 h-3.5 text-emerald-500" />
                                        <span>Emergency Contact</span>
                                      </div>
                                      <p className="text-sm font-bold text-slate-900 dark:text-white font-mono break-words">
                                        {selectedPost.extractedEntities.contact}
                                      </p>
                                    </div>
                                  )}

                                  {selectedPost.extractedEntities.peopleAffected ? (
                                    <div className="bg-white dark:bg-slate-800/80 rounded-xl p-3.5 border border-slate-200/70 dark:border-slate-700/70 shadow-2xs">
                                      <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                                        <Users className="w-3.5 h-3.5 text-red-500" />
                                        <span>Estimated Victims / Affected</span>
                                      </div>
                                      <p className="text-sm font-bold text-slate-900 dark:text-white break-words">
                                        {selectedPost.extractedEntities.peopleAffected} persons
                                      </p>
                                    </div>
                                  ) : null}
                                </div>
                              </div>
                            </StaggerItem>

                            {/* Extracted Needs Pills */}
                            {selectedPost.extractedEntities.needs && selectedPost.extractedEntities.needs.length > 0 && (
                              <StaggerItem>
                                <div>
                                  <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                                    Urgent Resources & Needs Detected
                                  </h4>
                                  <div className="flex flex-wrap gap-2">
                                    {selectedPost.extractedEntities.needs.map((need, idx) => (
                                      <span
                                        key={idx}
                                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                                      >
                                        <AlertTriangle className="w-3 h-3" />
                                        <span>{need}</span>
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </StaggerItem>
                            )}

                            {/* Original Source Quote */}
                            <StaggerItem>
                              <div>
                                <h4 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                                  Raw Post Source Reference
                                </h4>
                                <div className="bg-white dark:bg-slate-800/80 rounded-2xl p-4 border border-slate-200/70 dark:border-slate-700/70 shadow-2xs">
                                  <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed italic break-words">
                                    &ldquo;{selectedPost.rawText}&rdquo;
                                  </p>
                                </div>
                              </div>
                            </StaggerItem>
                          </>
                        ) : (
                          /* RAW UNSTRUCTURED VIEW: Raw stream audit & technical details */
                          <>
                            {/* Raw Stream Post Box */}
                            <StaggerItem>
                              <div>
                                <h4 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                                  Raw Unstructured Scraped Text
                                </h4>
                                <div className="bg-white dark:bg-slate-800/80 rounded-2xl p-4 sm:p-5 border border-slate-200/70 dark:border-slate-700/70 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                                  <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-sans break-words">
                                    {selectedPost.rawText}
                                  </p>
                                </div>
                              </div>
                            </StaggerItem>


                            {/* Raw Technical Payload Inspection */}
                            <StaggerItem>
                              <div>
                                <h4 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                                  Raw Ingestion Metadata
                                </h4>
                                <div className="bg-slate-100 dark:bg-slate-900/80 rounded-xl p-3.5 border border-slate-200/60 dark:border-slate-800 font-mono text-[11px] text-slate-700 dark:text-slate-300 space-y-1 overflow-x-auto">
                                  <div className="flex justify-between py-0.5 border-b border-slate-200/40 dark:border-slate-800">
                                    <span className="text-slate-400">entry_id:</span>
                                    <span>{selectedPost.id}</span>
                                  </div>
                                  <div className="flex justify-between py-0.5 border-b border-slate-200/40 dark:border-slate-800">
                                    <span className="text-slate-400">author:</span>
                                    <span>{selectedPost.author}</span>
                                  </div>
                                  <div className="flex justify-between py-0.5 border-b border-slate-200/40 dark:border-slate-800">
                                    <span className="text-slate-400">source_platform:</span>
                                    <span>{selectedPost.source}</span>
                                  </div>
                                  <div className="flex justify-between py-0.5 border-b border-slate-200/40 dark:border-slate-800">
                                    <span className="text-slate-400">barangay_parsed:</span>
                                    <span>{selectedPost.barangay}</span>
                                  </div>
                                  <div className="flex justify-between py-0.5">
                                    <span className="text-slate-400">status:</span>
                                    <span>{selectedPost.status}</span>
                                  </div>
                                </div>
                              </div>
                            </StaggerItem>
                          </>
                        )}
                      </StaggerContainer>
                    </div>

                    {/* Action Bar */}
                    <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-slate-200/60 dark:border-slate-800/60 bg-white/60 dark:bg-[#111827]/60 backdrop-blur-md shrink-0 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {viewMode === "structured" && (
                          <button
                            type="button"
                            onClick={() => togglePostIncidentOverride(selectedPost.id)}
                            className="px-3 py-2 bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold rounded-xl active:scale-[0.97] transition-all cursor-pointer"
                          >
                            Demote to Noise
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {selectedPost.status !== "Verified" && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(selectedPost.id, "Verified")}
                            className="px-3.5 sm:px-4 py-2 sm:py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-xs active:scale-[0.97] transition-all cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Verify Incident</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(selectedPost.id, "Resolved")}
                          className="px-3.5 sm:px-4 py-2 sm:py-2.5 bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60 text-xs font-semibold rounded-xl flex items-center gap-2 active:scale-[0.97] transition-all cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Dismiss / Resolve</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    variants={contentVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="flex-1 flex flex-col items-center justify-center p-8 text-center"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-3 shadow-inner">
                      <Radio className="w-8 h-8 stroke-[1.5]" />
                    </div>
                    <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-base">
                      No Comment Selected
                    </h4>
                    <p className="text-xs text-slate-400 dark:text-slate-500 max-w-[260px] mt-1">
                      Select a scraped comment from the feed stream to inspect NLP extraction and triage details.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </>
      )}
    </div>
  );
}