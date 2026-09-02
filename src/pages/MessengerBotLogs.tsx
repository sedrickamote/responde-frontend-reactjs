import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Filter, Loader2, AlertCircle, X, CheckCircle2, RefreshCw } from "lucide-react";
import DatePicker from "../components/DatePicker";
import FilterDropdown from "../components/DropDown";
import { StaggerContainer, StaggerItem } from "../components/Stagger";
import { supabase } from "../lib/supabaseClient";

// -- Types --
interface BotMessage { sender: "bot" | "user"; text: string; }
interface Conversation {
  id: string;
  psid: string;
  name: string;
  barangay: string;
  type: string;
  status: "Unread" | "Complete";
  time: string;
  messages: BotMessage[];
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
    ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
    : toast.type === "error"
      ? <AlertCircle className="w-4 h-4 text-red-500" />
      : <RefreshCw className="w-4 h-4 text-blue-500" />;

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
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

export default function MessengerBotLogs() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string>("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [filterBarangay, setFilterBarangay] = useState("All Barangays");
  const [filterType, setFilterType] = useState("All Types");
  const [filterStatus, setFilterStatus] = useState("All Status");

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

  // -- Refs to prevent Strict Mode duplicates & stale closures --
  const hasShownInitialToast = useRef(false);
  const prevCountRef = useRef(0);

  const POLL_INTERVAL_MS = 30_000;

  useEffect(() => {
    let isFirstLoad = true;

    const fetchConversations = async () => {
      console.log(`[MessengerBotLogs] Fetching conversations... (${new Date().toLocaleTimeString()})${isFirstLoad ? " [initial]" : " [poll]"}`);
      if (isFirstLoad) {
        setLoading(true);
      }
      setError(null);

      const { data, error: sbError } = await supabase
        .from("conversations")
        .select("*")
        .order("timestamp", { ascending: true });

      if (sbError) {
        console.error("[MessengerBotLogs] Supabase error:", sbError.message);
        setError(sbError.message);
        showToast(`Failed to load: ${sbError.message}`, "error");
        if (isFirstLoad) setLoading(false);
        isFirstLoad = false;
        return;
      }

      type Session = {
        id: string;
        psid: string;
        senderName: string;
        lastTime: number;
        messages: BotMessage[];
      };

      const psidNameMap = new Map<string, string>();
      for (const row of data ?? []) {
        const psid = String(row.sender_psid || row.id || "unknown");
        const name = row.sender_name;
        if (name && name !== "Unknown User" && !psidNameMap.has(psid)) {
          psidNameMap.set(psid, name);
        }
      }

      const sessions: Session[] = [];
      const psidToLastSessionIdx = new Map<string, number>();

      for (const row of data ?? []) {
        const psid = String(row.sender_psid || row.id || "unknown");
        const rowTime = new Date(row.timestamp).getTime();
        const lastIdx = psidToLastSessionIdx.get(psid);
        const resolvedName = psidNameMap.get(psid) ?? "Unknown User";

        let session: Session;

        if (
          lastIdx === undefined ||
          rowTime - sessions[lastIdx].lastTime > INACTIVITY_GAP_MS
        ) {
          session = {
            id: `${psid}_${rowTime}`,
            psid,
            senderName: resolvedName,
            lastTime: rowTime,
            messages: [],
          };
          sessions.push(session);
          psidToLastSessionIdx.set(psid, sessions.length - 1);
        } else {
          session = sessions[lastIdx];
          session.lastTime = rowTime;
          if (session.senderName === "Unknown User" && resolvedName !== "Unknown User") {
            session.senderName = resolvedName;
          }
        }

        if (row.user_message) {
          session.messages.push({ sender: "user", text: row.user_message });
        }
        if (row.ai_reply) {
          session.messages.push({ sender: "bot", text: row.ai_reply });
        }
      }

      const mapped: Conversation[] = sessions
        .sort((a, b) => b.lastTime - a.lastTime)
        .map((session) => {
          const lastDate = new Date(session.lastTime);
          const timeFormatted = `${lastDate.toLocaleDateString("en-US", {
            month: "numeric",
            day: "numeric",
          })} ${lastDate.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          })}`;

          return {
            id: session.id,
            psid: session.psid,
            name:
              session.senderName !== "Unknown User"
                ? session.senderName
                : `PSID: ${session.psid.slice(-6)}`,
            barangay: "General",
            type: "Emergency",
            status: "Complete",
            time: timeFormatted,
            messages: session.messages,
          };
        });

      setConversations(mapped);

      if (isFirstLoad && mapped.length > 0) {
        setSelectedId(mapped[0].id);
        // Guard against Strict Mode double-mount toast duplication
        if (!hasShownInitialToast.current) {
          hasShownInitialToast.current = true;
          showToast(`${mapped.length} conversations loaded`, "success");
        }
      } else if (!isFirstLoad) {
        const newCount = mapped.length - prevCountRef.current;
        if (newCount > 0) {
          showToast(`${newCount} new conversation${newCount > 1 ? "s" : ""} received`, "info");
        }
      }

      prevCountRef.current = mapped.length;

      if (isFirstLoad) setLoading(false);
      isFirstLoad = false;
    };

    fetchConversations();
    const intervalId = setInterval(fetchConversations, POLL_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, []);

  const filteredConversations = conversations.filter((c) => {
    if (filterBarangay !== "All Barangays" && c.barangay !== filterBarangay) return false;
    if (filterType !== "All Types" && c.type !== filterType) return false;
    if (filterStatus !== "All Status" && c.status !== filterStatus) return false;
    return true;
  });

  const selectedConversation =
    filteredConversations.find((c) => c.id === selectedId) || filteredConversations[0];

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

      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-slate-400 dark:text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <span className="text-sm font-medium">Loading conversations from Supabase...</span>
          </div>
        </div>
      )}

      {!loading && error && (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 max-w-md text-center">
            <AlertCircle className="w-8 h-8" />
            <p className="font-semibold text-sm">Failed to load conversations</p>
            <p className="text-xs text-red-400 font-mono">{error}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Check your browser console and verify your Supabase credentials in <code>.env</code>.
            </p>
          </div>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4">
            <div className="flex flex-col xl:flex-row xl:items-center gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm shrink-0">
                  <Filter className="w-4 h-4" />
                  <span className="font-medium">Filters:</span>
                </div>
                <FilterDropdown
                  value={filterBarangay}
                  options={["All Barangays", "Leynes", "Poblacion", "Sampaloc", "Cawit", "Banga"]}
                  onChange={(val) => { setFilterBarangay(val); setSelectedId(""); }}
                />
                <FilterDropdown
                  value={filterType}
                  options={["All Types", "Medical", "Search & Rescue", "Food & Water", "Infrastructure"]}
                  onChange={(val) => { setFilterType(val); setSelectedId(""); }}
                />
                <FilterDropdown
                  value={filterStatus}
                  options={["All Status", "Unread", "Complete"]}
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

          <div className="flex-1 flex flex-col lg:grid lg:grid-cols-12 gap-6 min-h-0">
            {/* LEFT: Conversation List — Staggered */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col overflow-hidden min-h-[300px] lg:min-h-0">
              <div className="p-4 border-b border-slate-100 dark:border-slate-700 shrink-0">
                <h3 className="font-semibold text-slate-800 dark:text-slate-100">Recent Conversations</h3>
              </div>
              <div className="flex-1 overflow-y-auto min-h-0">
                {filteredConversations.length === 0 ? (
                  <div className="flex items-center justify-center py-20 text-slate-400 dark:text-slate-500 text-sm">
                    No conversations found.
                  </div>
                ) : (
                  <StaggerContainer>
                    {filteredConversations.map((convo) => (
                      <StaggerItem key={convo.id} className="w-full">
                        <button
                          onClick={() => setSelectedId(convo.id)}
                          className={`w-full flex items-center gap-3 p-4 border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors text-left ${selectedId === convo.id
                            ? "bg-blue-50/50 dark:bg-blue-900/20 border-l-4 border-l-blue-500"
                            : "border-l-4 border-l-transparent"
                            }`}
                        >
                          <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 shrink-0">
                            {convo.name?.charAt(0) ?? "?"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                                {convo.name}
                              </span>
                              <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0 ml-2">
                                {convo.time}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">
                                {convo.type}
                              </span>
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full font-medium ${convo.status === "Unread"
                                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                  : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                  }`}
                              >
                                {convo.status}
                              </span>
                            </div>
                          </div>
                        </button>
                      </StaggerItem>
                    ))}
                  </StaggerContainer>
                )}
              </div>
            </div>

            {/* RIGHT: Message Detail — Staggered */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col overflow-hidden min-h-[400px] lg:min-h-0">
              <AnimatePresence mode="wait">
                {selectedConversation ? (
                  <motion.div
                    key={selectedConversation.id}
                    variants={contentVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="flex flex-col h-full"
                  >
                    <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between shrink-0">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300">
                          {selectedConversation.name?.charAt(0) ?? "?"}
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-800 dark:text-slate-100">
                            {selectedConversation.name}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {selectedConversation.barangay} • {selectedConversation.type}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${selectedConversation.status === "Unread"
                          ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800"
                          : "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
                          }`}
                      >
                        {selectedConversation.status}
                      </span>
                    </div>

                    {/* Messages — Staggered Dashboard style */}
                    <div className="flex-1 overflow-y-auto min-h-0 p-5 bg-slate-50/50 dark:bg-slate-900/30">
                      <StaggerContainer className="space-y-4">
                        {(selectedConversation.messages ?? []).map((msg, idx) =>
                          msg.sender === "bot" ? (
                            <StaggerItem key={idx}>
                              <div className="flex items-start gap-2.5 justify-end">
                                <div className="bg-blue-600 rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[75%]">
                                  <p className="text-sm text-white leading-relaxed">{msg.text}</p>
                                </div>
                                <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-[10px] font-bold text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
                                  B
                                </div>
                              </div>
                            </StaggerItem>
                          ) : (
                            <StaggerItem key={idx}>
                              <div className="flex items-start gap-2.5">
                                <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-[10px] font-bold text-slate-500 dark:text-slate-300 shrink-0 mt-0.5">
                                  U
                                </div>
                                <div className="bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[75%]">
                                  <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">{msg.text}</p>
                                </div>
                              </div>
                            </StaggerItem>
                          )
                        )}
                      </StaggerContainer>
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
                    className="h-full flex-1 flex items-center justify-center text-slate-400 dark:text-slate-500"
                  >
                    Select a conversation to view
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