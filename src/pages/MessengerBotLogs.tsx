import { useState } from 'react';
import { Filter } from 'lucide-react';
import DatePicker from '../components/DatePicker';
import FilterDropdown from '../components/DropDown';

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
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');


  const [filterBarangay, setFilterBarangay] = useState('All Barangays');
  const [filterType, setFilterType] = useState('All Types');
  const [filterStatus, setFilterStatus] = useState('All Status');

 
  const filteredConversations = conversations.filter(c => {
    if (filterBarangay !== 'All Barangays' && c.barangay !== filterBarangay) return false;
    if (filterType !== 'All Types' && c.type !== filterType) return false;
    if (filterStatus !== 'All Status' && c.status !== filterStatus) return false;
    return true;
  });

  const selectedConversation = filteredConversations.find(c => c.id === selectedId) || filteredConversations[0];

return (
  <div className="space-y-6 h-full flex flex-col">

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
            options={['All Barangays', 'Leynes', 'Poblacion', 'Sampaloc', 'Cawit', 'Banga']}
            onChange={(val) => { setFilterBarangay(val); setSelectedId('A'); }}
          />

          <FilterDropdown
            value={filterType}
            options={['All Types', 'Medical', 'Search & Rescue', 'Food & Water', 'Infrastructure']}
            onChange={(val) => { setFilterType(val); setSelectedId('A'); }}
          />

          <FilterDropdown
            value={filterStatus}
            options={['All Status', 'Unread', 'Complete']}
            onChange={(val) => { setFilterStatus(val); setSelectedId('A'); }}
          />
        </div>

        {/* Date pickers - push right on xl, full width on mobile */}
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

    {/* Two Column Layout - stacks on mobile */}
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
                className={`w-full flex items-center gap-3 p-4 border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors text-left ${
                  selectedId === convo.id ? 'bg-blue-50/50 dark:bg-blue-900/20 border-l-4 border-l-blue-500' : 'border-l-4 border-l-transparent'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 shrink-0">
                  {convo.name}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200">Conversation {convo.id}</span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">{convo.time}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">{convo.type}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      convo.status === 'Unread'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    }`}>
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
        {selectedConversation ? (
          <>
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300">
                  {selectedConversation.name}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 dark:text-slate-100">Conversation {selectedConversation.id}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{selectedConversation.barangay} • {selectedConversation.type}</p>
                </div>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                selectedConversation.status === 'Unread'
                  ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800'
                  : 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
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
                  <div className={`max-w-[85%] sm:max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-br-md'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-bl-md'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400 dark:text-slate-500">
            Select a conversation to view
          </div>
        )}
      </div>

    </div>
  </div>
);
}