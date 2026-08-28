import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ArrowRight, ExternalLink, MapPin, Clock, User, AlertCircle, CheckCircle, HelpCircle } from 'lucide-react';

// ── Types ──
interface BotMessage {
  sender: 'bot' | 'user';
  text: string;
}

interface BotConversation {
  id: string;
  name: string;
  barangay: string;
  type: string;
  status: 'Unread' | 'Complete';
  time: string;
  messages: BotMessage[];
}

interface ScraperItem {
  id: string;
  text: string;
  barangay: string;
  type: string;
  urgency: 'High' | 'Moderate' | 'Low';
  source: string;      // e.g. "Facebook - Talisay Community Group"
  time: string;
  status: 'Pending Review' | 'Verified' | 'False Alarm';
  reporter: string;
  confidence: number;  // NLP confidence score
}

// ── Sample Data ──
const botConversations: BotConversation[] = [
  {
    id: 'A',
    name: 'Conversation A',
    barangay: 'Leynes',
    type: 'Medical',
    status: 'Unread',
    time: '10/24 10:30',
    messages: [
      { sender: 'bot', text: 'Magandang araw! Ako ang RESPONDE bot. Para ma-report ang inyong sitwasyon, pakisabi ang inyong barangay.' },
      { sender: 'user', text: 'Leynes po kami' },
      { sender: 'bot', text: 'Salamat. Ano po ang emergency? (Medical, Search & Rescue, Food/Water, Infrastructure)' },
      { sender: 'user', text: 'May matanda po dito hindi makahinga' },
      { sender: 'bot', text: 'Nakuha. Ilan po ang apektado at ano ang kasalukuyang sitwasyon?' },
    ],
  },
  {
    id: 'B',
    name: 'Conversation B',
    barangay: 'Poblacion',
    type: 'Medical',
    status: 'Complete',
    time: '10/24 09:15',
    messages: [
      { sender: 'bot', text: 'Magandang araw! Ako ang RESPONDE bot. Para ma-report ang inyong sitwasyon, pakisabi ang inyong barangay.' },
      { sender: 'user', text: 'Poblacion po' },
      { sender: 'bot', text: 'Salamat. Ano po ang emergency? (Medical, Search & Rescue, Food/Water, Infrastructure)' },
      { sender: 'user', text: 'May bata po na naaksidente sa kalsada' },
      { sender: 'bot', text: 'Nakuha. Ilan po ang apektado at ano ang kasalukuyang sitwasyon?' },
      { sender: 'user', text: 'Isa lang po, sugatan yung paa niya' },
    ],
  },
  {
    id: 'C',
    name: 'Conversation C',
    barangay: 'Cawit',
    type: 'Medical',
    status: 'Unread',
    time: '10/24 08:45',
    messages: [
      { sender: 'bot', text: 'Magandang araw! Ako ang RESPONDE bot. Para ma-report ang inyong sitwasyon, pakisabi ang inyong barangay.' },
      { sender: 'user', text: 'Cawit po kami' },
    ],
  },
  {
    id: 'D',
    name: 'Conversation D',
    barangay: 'San Isidro',
    type: 'Medical',
    status: 'Complete',
    time: '10/24 08:20',
    messages: [
      { sender: 'bot', text: 'Magandang araw! Ako ang RESPONDE bot. Para ma-report ang inyong sitwasyon, pakisabi ang inyong barangay.' },
      { sender: 'user', text: 'San Isidro po' },
      { sender: 'bot', text: 'Salamat. Ano po ang emergency?' },
      { sender: 'user', text: 'May bata po na nilalagnat' },
    ],
  },
  {
    id: 'E',
    name: 'Conversation E',
    barangay: 'Sampaloc',
    type: 'Medical',
    status: 'Complete',
    time: '10/24 07:55',
    messages: [
      { sender: 'bot', text: 'Magandang araw! Ako ang RESPONDE bot. Para ma-report ang inyong sitwasyon, pakisabi ang inyong barangay.' },
      { sender: 'user', text: 'Sampaloc po' },
      { sender: 'bot', text: 'Salamat. Ano po ang emergency?' },
      { sender: 'user', text: 'May matandang hinihingal po dito' },
    ],
  },
];

const scraperItems: ScraperItem[] = [
  {
    id: 'S001',
    text: 'Tulungan nyo po ako, hindi ko alam kung pano ko uubusin yung pera ko',
    barangay: 'Leynes',
    type: 'Food & Water',
    urgency: 'Low',
    source: 'Facebook - Talisay Community Group',
    time: '10/24 14:32',
    status: 'False Alarm',
    reporter: 'Juan Dela Cruz',
    confidence: 0.32,
  },
  {
    id: 'S002',
    text: 'Pa wash out po kay Juan Dela Cruz',
    barangay: 'Poblacion',
    type: 'Medical',
    urgency: 'Moderate',
    source: 'Facebook - Talisay Public Page',
    time: '10/24 13:45',
    status: 'Pending Review',
    reporter: 'Maria Santos',
    confidence: 0.67,
  },
  {
    id: 'S003',
    text: 'Baha na po dito sa amin sa Cawit, hanggang tuhod na po yung tubig. May matanda po kami na hindi makalabas.',
    barangay: 'Cawit',
    type: 'Search & Rescue',
    urgency: 'High',
    source: 'Facebook - Batangas Emergency Updates',
    time: '10/24 12:20',
    status: 'Verified',
    reporter: 'Pedro Reyes',
    confidence: 0.91,
  },
  {
    id: 'S004',
    text: 'Nawalan po kami ng kuryente sa San Isidro simula kaninang umaga. May bata po na nilalagnat, need po namin ng tulong.',
    barangay: 'San Isidro',
    type: 'Medical',
    urgency: 'High',
    source: 'Facebook - Talisay Community Group',
    time: '10/24 11:15',
    status: 'Verified',
    reporter: 'Ana Lim',
    confidence: 0.88,
  },
  {
    id: 'S005',
    text: 'May gumuho po na lupa dito sa may bangka sa Sampaloc, dalawang bahay po ang naapektuhan.',
    barangay: 'Sampaloc',
    type: 'Infrastructure',
    urgency: 'High',
    source: 'Facebook - Batangas Emergency Updates',
    time: '10/24 10:50',
    status: 'Verified',
    reporter: 'Carlos Tan',
    confidence: 0.94,
  },
  {
    id: 'S006',
    text: 'Pa wash out po kay Juan Dela Cruz',
    barangay: 'Poblacion',
    type: 'Medical',
    urgency: 'Low',
    source: 'Facebook - Talisay Public Page',
    time: '10/24 09:30',
    status: 'Pending Review',
    reporter: 'Elena Cruz',
    confidence: 0.45,
  },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [activeConv, setActiveConv] = useState<BotConversation | null>(null);
  const [selectedConvId, setSelectedConvId] = useState<string>('A');
  const [activeScraper, setActiveScraper] = useState<ScraperItem | null>(null);

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
    <div className="grid grid-cols-12 gap-6 h-full lg:grid-rows-[auto_1fr]">
      {/* Stats Row */}
      <div className="col-span-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-900/30 flex items-center justify-center text-xl">⚠️</div>
          <div>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">0</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Incidents</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-xl">💬</div>
          <div>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">0</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Bot Conversations</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center text-xl">🌐</div>
          <div>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">0</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Scraped Comments</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-50 dark:bg-green-900/30 flex items-center justify-center text-xl">⏱️</div>
          <div>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">0</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Avg Response Time</p>
          </div>
        </div>
      </div>

      {/* Left Column */}
      <div className="col-span-12 lg:col-span-6 flex flex-col gap-6 h-full lg:min-h-0">
        {/* Messenger Bot */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex-1 flex flex-col lg:min-h-0 overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-slate-700">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100">Messenger Bot Activities</h3>
          </div>
          <div className="p-2 overflow-y-auto flex-1 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
            {botConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => openConversation(conv)}
                className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700/30 rounded-lg transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 shrink-0">
                  {conv.id}
                </div>
                <span className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">
                  {conv.type}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded ${
                    conv.status === 'Unread'
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      : 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                  }`}
                >
                  {conv.status}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Scraper Activity */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex-1 flex flex-col lg:min-h-0 overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-slate-700">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100">Scraper Activities</h3>
          </div>
          <div className="p-4 space-y-3 overflow-y-auto flex-1 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
            {scraperItems.map((item) => (
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
                    {getStatusIcon(item.status)}
                    {item.status}
                  </span>
                  <span className={`text-[10px] font-medium ${getTypeColor(item.type)}`}>{item.type}</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 ml-auto">{item.time}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column: Heat Map */}
      <div className="col-span-12 lg:col-span-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col lg:min-h-0">
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
      </div>

      {/* ── Conversation Modal ── */}
      {activeConv && selectedConversation && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setActiveConv(null)}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-4xl h-[80vh] flex overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Left: Conversation List */}
            <div className="w-80 border-r border-slate-100 dark:border-slate-700 flex flex-col shrink-0">
              <div className="p-4 border-b border-slate-100 dark:border-slate-700">
                <h3 className="font-semibold text-slate-800 dark:text-slate-100">Recent Conversations</h3>
              </div>
              <div className="flex-1 overflow-y-auto">
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
                      {conv.id}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{conv.name}</p>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0 ml-2">{conv.time}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">{conv.type}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded ${
                            conv.status === 'Unread'
                              ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                              : 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                          }`}
                        >
                          {conv.status}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Chat View */}
            <div className="flex-1 flex flex-col min-w-0">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 text-sm">
                    {selectedConversation.id}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{selectedConversation.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {selectedConversation.barangay} • {selectedConversation.type}
                    </p>
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
              <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/50 dark:bg-slate-900/30">
                {selectedConversation.messages.map((msg, i) =>
                  msg.sender === 'bot' ? (
                    <div key={i} className="flex items-start gap-2.5 justify-end">
                      <div className="bg-blue-600 rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[75%]">
                        <p className="text-sm text-white leading-relaxed">{msg.text}</p>
                      </div>
                      <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-[10px] font-bold text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
                        B
                      </div>
                    </div>
                  ) : (
                    <div key={i} className="flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-[10px] font-bold text-slate-500 dark:text-slate-300 shrink-0 mt-0.5">
                        U
                      </div>
                      <div className="bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-[75%]">
                        <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">{msg.text}</p>
                      </div>
                    </div>
                  )
                )}
              </div>

              {/* Footer: Go to MessengerBot */}
              <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 flex justify-end">
                <button
                  onClick={() => {
                    setActiveConv(null);
                    navigate('/MessengerBotLogs');
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
                >
                  Go to MessengerBot
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Scraper Detail Modal ── */}
      {activeScraper && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setActiveScraper(null)}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm text-slate-500 dark:text-slate-400">#{activeScraper.id}</span>
                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${getUrgencyColor(activeScraper.urgency)}`}>
                  {activeScraper.urgency}
                </span>
              </div>
              <button
                onClick={() => setActiveScraper(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-5">
              <div>
                <h3 className={`text-lg font-bold ${getTypeColor(activeScraper.type)}`}>
                  {activeScraper.type}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">{activeScraper.barangay}, Talisay</p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
                <p className="text-slate-700 dark:text-slate-200 text-sm leading-relaxed">
                  "{activeScraper.text}"
                </p>
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
                    <p className="text-sm text-slate-700 dark:text-slate-200 font-mono">{(activeScraper.confidence * 100).toFixed(0)}%</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 dark:text-slate-400">Status:</span>
                <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded border ${getStatusColor(activeScraper.status)}`}>
                  {getStatusIcon(activeScraper.status)}
                  {activeScraper.status}
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
              <button
                onClick={() => setActiveScraper(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setActiveScraper(null);
                  navigate('/scraper-feed');
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
              >
                Go to Scraper Feed
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}