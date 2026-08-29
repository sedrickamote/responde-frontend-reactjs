import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Filter, Loader2, AlertCircle } from "lucide-react";
import DatePicker from "../components/DatePicker";
import FilterDropdown from "../components/DropDown";
import { supabase } from "../lib/supabaseClient";

// -- Types --
interface BotMessage { sender: "bot" | "user"; text: string; }
interface Conversation {
  id: string;
  name: string;
  barangay: string;
  type: string;
  status: "Unread" | "Complete";
  time: string;
  messages: BotMessage[];
}

// -- Animation presets --
const contentVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

// ── Session gap threshold: messages from the same PSID within this window
//    are treated as one conversation. Adjust as needed (e.g. 2 hours, 24 hours).
const INACTIVITY_GAP_MS = 60 * 60 * 1000; // 1 hour

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

  // -- Fetch & group conversations from Supabase --
  useEffect(() => {
    const fetchConversations = async () => {
      setLoading(true);
      setError(null);

      if (import.meta.env.DEV) {
        console.log("[MessengerBotLogs] Fetching conversations from Supabase...");
      }

      const { data, error: sbError } = await supabase
        .from("conversations")
        .select("*")
        .order("timestamp", { ascending: true }); // oldest first so we build chronology

      if (sbError) {
        console.error("[MessengerBotLogs] Supabase error:", sbError.message);
        setError(sbError.message);
        setLoading(false);
        return;
      }

      if (import.meta.env.DEV) {
        console.log("[MessengerBotLogs] Fetched", data?.length ?? 0, "rows");
      }

      // ── GROUP rows into sessions by PSID + time gap ──
      type Session = {
        id: string;
        psid: string;
        lastTime: number;
        messages: BotMessage[];
      };

      const sessions: Session[] = [];
      const psidToLastSessionIdx = new Map<string, number>();

      for (const row of data ?? []) {
        const psid = String(row.sender_psid || row.id || "unknown");
        const rowTime = new Date(row.timestamp).getTime();
        const lastIdx = psidToLastSessionIdx.get(psid);

        let session: Session;

        // Start a new session if:
        // 1. First time seeing this PSID, OR
        // 2. Time gap from last message > INACTIVITY_GAP_MS
        if (
          lastIdx === undefined ||
          rowTime - sessions[lastIdx].lastTime > INACTIVITY_GAP_MS
        ) {
          session = {
            id: `${psid}_${rowTime}`,
            psid,
            lastTime: rowTime,
            messages: [],
          };
          sessions.push(session);
          psidToLastSessionIdx.set(psid, sessions.length - 1);
        } else {
          // Continue existing session
          session = sessions[lastIdx];
          session.lastTime = rowTime;
        }

        // Push messages in order: user first, then bot reply
        if (row.user_message) {
          session.messages.push({ sender: "user", text: row.user_message });
        }
        if (row.ai_reply) {
          session.messages.push({ sender: "bot", text: row.ai_reply });
        }
      }

      // Map sessions to UI model — newest session first
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
            name: `PSID: ${session.psid.slice(-6)}`,
            barangay: "General",
            type: "Emergency",
            status: "Complete",
            time: timeFormatted,
            messages: session.messages,
          };
        });

      setConversations(mapped);
      if (mapped.length > 0) setSelectedId(mapped[0].id);
      setLoading(false);
    };

    fetchConversations();
  }, []);
  // ----------------------------------------------------

  const filteredConversations = conversations.filter((c) => {
    if (filterBarangay !== "All Barangays" && c.barangay !== filterBarangay) return false;
    if (filterType !== "All Types" && c.type !== filterType) return false;
    if (filterStatus !== "All Status" && c.status !== filterStatus) return false;
    return true;
  });

  const selectedConversation =
    filteredConversations.find((c) => c.id === selectedId) || filteredConversations[0];

  return (
    <div className="space-y-6 h-full flex flex-col">

      {/* Loading State */}
      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-slate-400 dark:text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <span className="text-sm font-medium">Loading conversations from Supabase...</span>
          </div>
        </div>
      )}

      {/* Error State */}
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

      {/* Main Content */}
      {!loading && !error && (
        <>
          {/* Filters Bar */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4">
            <div className="flex flex-col xl:flex-row xl:items-center gap-3">

              {/* Filter label + dropdowns */}
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

              {/* Date pickers */}
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
          <div className="flex-1 flex flex-col lg:grid lg:grid-cols-12 gap-6 min-h-0">

            {/* LEFT: Conversation List */}
            <div className="lg:col-span-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col overflow-hidden min-h-[300px] lg:min-h-0">
              <div className="p-4 border-b border-slate-100 dark:border-slate-700">
                <h3 className="font-semibold text-slate-800 dark:text-slate-100">Recent Conversations</h3>
              </div>
              <div className="flex-1 overflow-y-auto">
                {filteredConversations.length === 0 ? (
                  <div className="flex items-center justify-center py-20 text-slate-400 dark:text-slate-500 text-sm">
                    No conversations found.
                  </div>
                ) : (
                  filteredConversations.map((convo) => (
                    <button
                      key={convo.id}
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
                  ))
                )}
              </div>
            </div>

            {/* RIGHT: Message Detail */}
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
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {(selectedConversation.messages ?? []).map((msg, idx) => (
                        <div
                          key={idx}
                          className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"
                            }`}
                        >
                          <div
                            className={`max-w-[85%] sm:max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${msg.sender === "user"
                              ? "bg-blue-600 text-white rounded-br-md"
                              : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-bl-md"
                              }`}
                          >
                            {msg.text}
                          </div>
                        </div>
                      ))}
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