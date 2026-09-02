import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Filter, Globe, MessageCircle, AlertTriangle, MapPin, Clock,
  CheckCircle, XCircle, Brain, Users, ExternalLink, Loader2,
} from "lucide-react";
import DatePicker from "../components/DatePicker";
import FilterDropdown from "../components/DropDown";
import { StaggerContainer, StaggerItem } from "../components/Stagger";
import { supabase } from "../lib/supabaseClient";

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
  confidence: number;
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

// -- Animation presets --
const contentVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

const INACTIVITY_GAP_MS = 60 * 60 * 1000;

// -- Toast Item Component --
function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 3500);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const icon = toast.type === "success"
    ? <CheckCircle className="w-4 h-4 text-emerald-500" />
    : toast.type === "error"
      ? <AlertTriangle className="w-4 h-4 text-red-500" />
      : <Loader2 className="w-4 h-4 text-blue-500" />;

  const bgClass = toast.type === "success"
    ? "bg-white dark:bg-slate-800 border-emerald-200 dark:border-emerald-800"
    : toast.type === "error"
      ? "bg-white dark:bg-slate-800 border-red-200 dark:border-red-800"
      : "bg-white dark:bg-slate-800 border-blue-200 dark:border-blue-800";

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
        <XCircle className="w-4 h-4" />
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

// ── Format Supabase timestamp → "M/D HH:mm" ──
function formatTimestamp(ts: string | null): string {
  if (!ts) return "";
  const d = new Date(ts);
  if (isNaN(d.getTime())) return String(ts);
  return `${d.toLocaleDateString("en-US", { month: "numeric", day: "numeric" })} ${d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}`;
}

export default function ScraperFeed() {
  const [posts, setPosts] = useState<ScrapedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string>("");
  const [activeTable, setActiveTable] = useState<string>("fb_comments");
  const [discoveredTables, setDiscoveredTables] = useState<string[]>([]);

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
        confidence,
        extractedEntities: {
          location: extractedEntities.location || (barangay !== "Unknown" ? barangay : "Unknown"),
          contact: row.contact || row.contact_number || extractedEntities.contact,
          peopleAffected: row.people_affected || row.peopleAffected || extractedEntities.peopleAffected,
          needs: Array.isArray(extractedEntities.needs) ? extractedEntities.needs : [],
        },
      };
    });

    setPosts(mapped);
    if (mapped.length > 0) setSelectedId(mapped[0].id);
    setLoading(false);

    if (!hasShownInitialToast.current) {
      hasShownInitialToast.current = true;
      showToast(`${mapped.length} scraped posts loaded`, "success");
    }
  };

  // -- Fetch from Supabase with self-healing table detection --
  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      setError(null);

      try {
        let tableName = "fb_comments";
        let availableTables: string[] = [];

        try {
          const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/`, {
            headers: {
              "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY,
              "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
            }
          });
          if (res.ok) {
            const schema = await res.json();
            const paths = Object.keys(schema.paths || {});
            availableTables = paths
              .map(p => p.replace(/^\//, ""))
              .filter(name => name && name !== "rpc");

            setDiscoveredTables(availableTables);
            console.log("[ScraperFeed] Discovered Supabase tables:", availableTables);

            const candidates = ["fb_comments", "comments", "scraped_comments", "facebook_comments", "scraper_feed", "scraped_posts", "posts"];
            const found = candidates.find(c => availableTables.includes(c)) ||
              availableTables.find(t => t.includes("comment") || t.includes("scraper") || t.includes("scraped") || t.includes("fb"));

            if (found) {
              tableName = found;
              console.log("[ScraperFeed] Selected active table:", tableName);
            }
          }
        } catch (schemaErr) {
          console.warn("[ScraperFeed] Could not list database tables via OpenAPI:", schemaErr);
        }

        const { data, error: sbError } = await supabase
          .from(tableName)
          .select("*");

        if (sbError) {
          console.error(`[ScraperFeed] Failed to fetch from "${tableName}":`, sbError.message);
          showToast(`Failed to load: ${sbError.message}`, "error");

          let fallbackData: any[] | null = null;
          let fallbackError: string | null = sbError.message;

          if (availableTables.length === 0) {
            const fallbacks = ["comments", "facebook_comments", "scraped_posts", "posts"].filter(f => f !== tableName);
            for (const fbTable of fallbacks) {
              const { data: fbData, error: fbErr } = await supabase
                .from(fbTable)
                .select("*");

              if (!fbErr) {
                fallbackData = fbData;
                tableName = fbTable;
                fallbackError = null;
                break;
              }
            }
          }

          if (fallbackError) {
            setError(`${sbError.message} (Attempted table: "${tableName}"${availableTables.length > 0 ? `. Discovered tables: ${availableTables.join(", ")}` : ""})`);
            setLoading(false);
          } else {
            setActiveTable(tableName);
            processData(fallbackData, tableName);
          }
        } else {
          setActiveTable(tableName);
          processData(data, tableName);
        }
      } catch (err: any) {
        console.error("[ScraperFeed] Fetch error:", err);
        setError(err.message || "An unexpected error occurred");
        showToast(err.message || "An unexpected error occurred", "error");
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const handleUpdateStatus = async (postId: string, newStatus: ScrapedPost["status"]) => {
    const prevStatus = posts.find(p => p.id === postId)?.status;

    // Optimistically update status locally
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, status: newStatus } : p))
    );

    try {
      const { error: updateError } = await supabase
        .from(activeTable)
        .update({ status: newStatus })
        .eq("id", postId);

      if (updateError) {
        console.error(`[ScraperFeed] Failed to update status in Supabase table "${activeTable}":`, updateError.message);
        showToast(`Update failed: ${updateError.message}`, "error");
        // Revert on error
        setPosts((prev) =>
          prev.map((p) => (p.id === postId ? { ...p, status: prevStatus || p.status } : p))
        );
      } else {
        showToast(`Post marked as ${newStatus.toLowerCase()}`, "success");
      }
    } catch (err: any) {
      console.error("[ScraperFeed] Status update error:", err);
      showToast(`Update failed: ${err.message}`, "error");
      // Revert on error
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, status: prevStatus || p.status } : p))
      );
    }
  };

  // Filter logic
  const filteredPosts = posts.filter((p) => {
    if (filterBarangay !== "All Barangays" && p.barangay !== filterBarangay) return false;
    if (filterType !== "All Types" && p.type !== filterType) return false;
    if (filterUrgency !== "All Urgency" && p.urgency !== filterUrgency) return false;
    if (filterStatus !== "All Status" && p.status !== filterStatus) return false;
    return true;
  });

  const selectedPost = filteredPosts.find((p) => p.id === selectedId) || filteredPosts[0];

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "High": return "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800";
      case "Moderate": return "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800";
      case "Low": return "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600";
      default: return "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "New": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "Verified": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "Flagged": return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
      case "Resolved": return "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400";
      default: return "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400";
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case "Facebook Page": return <ExternalLink className="w-3.5 h-3.5" />;
      case "Facebook Comment": return <MessageCircle className="w-3.5 h-3.5" />;
      case "Group Post": return <Users className="w-3.5 h-3.5" />;
      default: return <Globe className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="space-y-5 h-full flex flex-col relative">
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

      {/* Loading State */}
      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-slate-400 dark:text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <span className="text-sm font-medium">Loading scraped posts from Supabase...</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 max-w-md text-center">
            <AlertTriangle className="w-8 h-8" />
            <p className="font-semibold text-sm">Failed to load scraped posts</p>
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
          {/* Filters Bar */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4">
            <div className="flex flex-col xl:flex-row xl:items-center gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm shrink-0">
                  <Filter className="w-4 h-4" />
                  <span className="font-medium">Filters:</span>
                </div>

                <FilterDropdown
                  value={filterBarangay}
                  options={[
                    "All Barangays", "Leynes", "Poblacion", "Sampaloc",
                    "Cawit", "Banga", "San Isidro", "Miranda", "Aya",
                    "Tranca", "Tumaway", "Caloocan", "Buco", "Balas",
                    "Quiling", "Laurel", "Sta. Maria", "Ayala",
                  ]}
                  onChange={(val) => { setFilterBarangay(val); setSelectedId(""); }}
                />

                <FilterDropdown
                  value={filterType}
                  options={["All Types", "Search & Rescue", "Medical", "Food & Water", "Infrastructure"]}
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

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 xl:ml-auto w-full xl:w-auto">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">From:</span>
                  <DatePicker value={fromDate} onChange={setFromDate} placeholder="Select Date" />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">To:</span>
                  <DatePicker value={toDate} onChange={setToDate} placeholder="Select Date" />
                </div>
              </div>
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="flex-1 flex flex-col lg:grid lg:grid-cols-12 gap-5 min-h-0">
            {/* LEFT: Post List — Staggered */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col overflow-hidden min-h-[300px] lg:min-h-0">
              <div className="p-4 border-b border-slate-100 dark:border-slate-700">
                <h3 className="font-semibold text-slate-800 dark:text-slate-100">Scraped Posts</h3>
              </div>
              <div className="flex-1 overflow-y-auto">
                {filteredPosts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-4 text-slate-400 dark:text-slate-500 text-sm gap-3">
                    <span className="font-medium text-slate-500 dark:text-slate-400">No scraped posts found.</span>
                    <div className="w-full text-xs bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-left font-mono mt-2 space-y-2">
                      <p className="font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-100 dark:border-slate-850 pb-1.5 mb-1.5 uppercase tracking-wider text-[10px]">
                        Database Query Diagnostics
                      </p>
                      <p>
                        <span className="text-slate-500">Queried Table:</span>{" "}
                        <span className="text-blue-500 font-semibold bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded">
                          "{activeTable}"
                        </span>
                      </p>
                      {discoveredTables.length > 0 ? (
                        <div>
                          <span className="text-slate-500">All Database Tables:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {discoveredTables.map(t => (
                              <span key={t} className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-400">
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-slate-400 italic">No schema tables discovered. Make sure your Supabase anon key permits reading the Postgrest API schema.</p>
                      )}
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal pt-2 border-t border-slate-100 dark:border-slate-800">
                        * Note: If the queried table exists but this screen is blank, the database table may have 0 rows.
                      </p>
                    </div>
                  </div>
                ) : (
                  <StaggerContainer>
                    {filteredPosts.map((post) => (
                      <StaggerItem key={post.id} className="w-full">
                        <button
                          onClick={() => setSelectedId(post.id)}
                          className={`w-full text-left p-4 border-b border-slate-50 dark:border-slate-700/50 transition-all ${selectedId === post.id
                            ? "bg-blue-50/50 dark:bg-blue-900/20 border-l-4 border-l-blue-500"
                            : "border-l-4 border-l-transparent hover:bg-slate-50 dark:hover:bg-slate-700/30"
                            }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-sm text-slate-600 dark:text-slate-300 shrink-0">
                              {post.avatar}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                                  {post.author}
                                </span>
                                <span className="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">
                                  {post.timestamp}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 mb-1.5">
                                <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                                  {getSourceIcon(post.source)}
                                  {post.source}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-2">
                                {post.rawText}
                              </p>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium border ${getUrgencyColor(post.urgency)}`}>
                                  {post.urgency}
                                </span>
                                <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${getStatusColor(post.status)}`}>
                                  {post.status}
                                </span>
                                {post.confidence > 0 && (
                                  <span className="inline-flex items-center gap-0.5 text-[10px] text-slate-400 dark:text-slate-500">
                                    <Brain className="w-3 h-3" />
                                    {post.confidence}%
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </button>
                      </StaggerItem>
                    ))}
                  </StaggerContainer>
                )}
              </div>
            </div>

            {/* RIGHT: Post Detail — Staggered */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col overflow-hidden min-h-[400px] lg:min-h-0">
              <AnimatePresence mode="wait">
                {selectedPost ? (
                  <motion.div
                    key={selectedPost.id}
                    variants={contentVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="flex flex-col h-full"
                  >
                    <div className="p-5 border-b border-slate-100 dark:border-slate-700 shrink-0">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300">
                            {selectedPost.avatar}
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-800 dark:text-slate-100">{selectedPost.author}</h3>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                                {getSourceIcon(selectedPost.source)}
                                {selectedPost.source}
                              </span>
                              <span className="text-slate-300 dark:text-slate-600">•</span>
                              <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {selectedPost.timestamp}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap justify-end">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${getUrgencyColor(selectedPost.urgency)}`}>
                            {selectedPost.urgency}
                          </span>
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedPost.status)}`}>
                            {selectedPost.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                      <StaggerContainer className="space-y-0">
                        {/* Original Post */}
                        <StaggerItem>
                          <div className="p-5 border-b border-slate-100 dark:border-slate-700">
                            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                              Original Post
                            </h4>
                            <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-100 dark:border-slate-700">
                              &ldquo;{selectedPost.rawText}&rdquo;
                            </p>
                          </div>
                        </StaggerItem>

                        {/* NLP Extraction */}
                        <StaggerItem>
                          <div className="p-5 border-b border-slate-100 dark:border-slate-700">
                            <div className="flex items-center gap-2 mb-3">
                              <Brain className="w-4 h-4 text-blue-500" />
                              <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                NLP Extraction
                              </h4>
                              {selectedPost.confidence > 0 && (
                                <span className="text-xs text-slate-400 dark:text-slate-500 ml-auto">
                                  Confidence: {selectedPost.confidence}%
                                </span>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3 border border-slate-100 dark:border-slate-700">
                                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
                                  <MapPin className="w-3.5 h-3.5" />
                                  Location
                                </div>
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                  {selectedPost.extractedEntities.location}
                                </p>
                              </div>
                              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3 border border-slate-100 dark:border-slate-700">
                                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                  Incident Type
                                </div>
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                  {selectedPost.type}
                                </p>
                              </div>
                            </div>
                          </div>
                        </StaggerItem>
                      </StaggerContainer>
                    </div>

                    <div className="p-5 shrink-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => handleUpdateStatus(selectedPost.id, "Verified")}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Verify
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(selectedPost.id, "Flagged")}
                          className="px-4 py-2 bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/20 dark:hover:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                        >
                          <AlertTriangle className="w-4 h-4" />
                          Flag
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(selectedPost.id, "Resolved")}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ml-auto"
                        >
                          <XCircle className="w-4 h-4" />
                          Dismiss
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
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="flex-1 flex items-center justify-center text-slate-400 dark:text-slate-500"
                  >
                    Select a post to view details
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