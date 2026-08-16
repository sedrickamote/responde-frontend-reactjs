import { useState } from 'react';
import { Filter } from 'lucide-react';

const sampleConversations = [
  {
    id: 'A',
    name: 'A',
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
    ]
  },
  {
    id: 'B',
    name: 'B',
    barangay: 'Poblacion',
    type: 'Medical',
    status: 'Complete',
    time: '10/24 09:15',
    messages: [
      { sender: 'bot', text: 'Magandang araw! Ako ang RESPONDE bot. Para ma-report ang inyong sitwasyon, pakisabi ang inyong barangay.' },
      { sender: 'user', text: 'Poblacion' },
      { sender: 'bot', text: 'Salamat. Ano po ang emergency?' },
      { sender: 'user', text: 'May sugatan po dito sa daan' },
    ]
  },
  {
    id: 'C',
    name: 'C',
    barangay: 'Sampaloc',
    type: 'Medical',
    status: 'Unread',
    time: '10/24 08:45',
    messages: [
      { sender: 'user', text: 'Tulungan nyo po ang aming lugar, hanggang ngayon wala pa rin kaming makain.' },
      { sender: 'bot', text: 'Nakuha po ang inyong mensahe. Pakikumpirma ang inyong barangay.' },
    ]
  },
  {
    id: 'D',
    name: 'D',
    barangay: 'Cawit',
    type: 'Medical',
    status: 'Complete',
    time: '10/24 08:20',
    messages: [
      { sender: 'bot', text: 'Magandang araw! Ako ang RESPONDE bot.' },
      { sender: 'user', text: 'Cawit po. May gumuhong lupa.' },
    ]
  },
  {
    id: 'E',
    name: 'E',
    barangay: 'Banga',
    type: 'Medical',
    status: 'Complete',
    time: '10/24 07:55',
    messages: [
      { sender: 'user', text: 'Kailangan namin ng tulong para makalikas.' },
      { sender: 'bot', text: 'Saan po ang inyong barangay?' },
      { sender: 'user', text: 'Banga po' },
    ]
  },
];

export default function MessengerBotLogs() {
  const [conversations] = useState(sampleConversations);
  const [selectedId, setSelectedId] = useState<string>('A');

  const selectedConversation = conversations.find(c => c.id === selectedId);

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Messenger Bot Logs</h2>
        <span className="text-sm text-slate-500">{conversations.length} conversations</span>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <Filter className="w-4 h-4" />
            <span className="font-medium">Filters:</span>
          </div>

          <select className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>All Barangays</option>
            <option>Leynes</option>
            <option>Poblacion</option>
            <option>Sampaloc</option>
            <option>Cawit</option>
            <option>Banga</option>
          </select>

          <select className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>All Types</option>
            <option>Medical</option>
            <option>Search & Rescue</option>
            <option>Food & Water</option>
            <option>Infrastructure</option>
          </select>

          <select className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>All Status</option>
            <option>Unread</option>
            <option>Complete</option>
          </select>

          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-slate-500">From:</span>
            <input type="date" className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <span className="text-sm text-slate-500">To:</span>
            <input type="date" className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
        
        {/* LEFT: Conversation List */}
        <div className="col-span-12 lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800">Recent Conversations</h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.map((convo) => (
              <button
                key={convo.id}
                onClick={() => setSelectedId(convo.id)}
                className={`w-full flex items-center gap-3 p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors text-left ${
                  selectedId === convo.id ? 'bg-blue-50/50 border-l-4 border-l-blue-500' : 'border-l-4 border-l-transparent'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 shrink-0">
                  {convo.name}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-sm font-medium text-slate-800">Conversation {convo.id}</span>
                    <span className="text-xs text-slate-400">{convo.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600">{convo.type}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      convo.status === 'Unread' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {convo.status}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT: Message Detail */}
        <div className="col-span-12 lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          {selectedConversation ? (
            <>
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">
                    {selectedConversation.name}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">Conversation {selectedConversation.id}</h3>
                    <p className="text-xs text-slate-500">{selectedConversation.barangay} • {selectedConversation.type}</p>
                  </div>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                  selectedConversation.status === 'Unread' 
                    ? 'bg-blue-50 text-blue-700 border-blue-200' 
                    : 'bg-green-50 text-green-700 border-green-200'
                }`}>
                  {selectedConversation.status}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {selectedConversation.messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                      msg.sender === 'user'
                        ? 'bg-blue-600 text-white rounded-br-md'
                        : 'bg-slate-100 text-slate-700 rounded-bl-md'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400">
              Select a conversation to view
            </div>
          )}
        </div>

      </div>
    </div>
  );
}