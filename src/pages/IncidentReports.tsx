import { useState } from 'react';
import { Filter } from 'lucide-react';
import DatePicker from '../components/DatePicker';

interface Report {
    id: string;
    barangay: string;
    type: string;
    urgency: string;
    source: string; 
    time: string;
    read: boolean;
    archived: boolean;
    description: string;
    reporter: string;
    contact: string;
    coordinates: string;
  }

const sampleReports: Report[] = [
  { 
    id: '011', 
    barangay: 'Leynes', 
    type: 'Search & Rescue', 
    urgency: 'Low', 
    source: 'Scraper', 
    time: '10/24 10:57', 
    read: true, 
    archived: false, 
    description: 'Missing person reported near the riverbank. Last seen wearing a red shirt.', 
    reporter: 'Juan Dela Cruz', 
    contact: '0912-345-6789', 
    coordinates: '14.0951, 121.0203' 
  },
  { 
    id: '012', 
    barangay: 'Poblacion', 
    type: 'Medical', 
    urgency: 'High', 
    source: 'Bot', 
    time: '10/24 10:57', 
    read: false, 
    archived: false, 
    description: 'Elderly resident collapsed at the market. Needs immediate medical attention.', 
    reporter: 'Maria Santos', 
    contact: '0918-234-5678', 
    coordinates: '14.0923, 121.0187' 
  },
  { 
    id: '013', 
    barangay: 'Leynes', 
    type: 'Food & Water', 
    urgency: 'Low', 
    source: 'Scraper', 
    time: '10/24 10:57', 
    read: true, 
    archived: false, 
    description: 'Request for water supply delivery due to pipe maintenance.', 
    reporter: 'Pedro Reyes', 
    contact: '0917-876-5432', 
    coordinates: '14.0945, 121.0210' 
  },
  { 
    id: '014', 
    barangay: 'Cawit', 
    type: 'Infrastructure', 
    urgency: 'Moderate', 
    source: 'Scraper', 
    time: '10/24 10:57', 
    read: true, 
    archived: false, 
    description: 'Road partially blocked by fallen tree after heavy rains.', 
    reporter: 'Ana Lim', 
    contact: '0919-123-4567', 
    coordinates: '14.0987, 121.0156' 
  },
  { 
    id: '015', 
    barangay: 'Leynes', 
    type: 'Search & Rescue', 
    urgency: 'Low', 
    source: 'Scraper', 
    time: '10/24 10:57', 
    read: true, 
    archived: false, 
    description: 'Stranded dog on rooftop during flooding. Owner requesting assistance.', 
    reporter: 'Carlos Tan', 
    contact: '0915-987-6543', 
    coordinates: '14.0934, 121.0221' 
  },
  { 
    id: '016', 
    barangay: 'San Isidro', 
    type: 'Medical', 
    urgency: 'Low', 
    source: 'Bot', 
    time: '10/24 10:57', 
    read: true, 
    archived: false, 
    description: 'Child with high fever, parents requesting transport to health center.', 
    reporter: 'Elena Cruz', 
    contact: '0916-456-7890', 
    coordinates: '14.0912, 121.0254' 
  },
  { 
    id: '017', 
    barangay: 'Leynes', 
    type: 'Search & Rescue', 
    urgency: 'Low', 
    source: 'Scraper', 
    time: '10/24 10:57', 
    read: true, 
    archived: false, 
    description: 'Boat capsized near the shore. Two fishermen accounted for, one missing.', 
    reporter: 'Ramon Garcia', 
    contact: '0913-222-3333', 
    coordinates: '14.0967, 121.0198' 
  },
  { 
    id: '018', 
    barangay: 'Leynes', 
    type: 'Food & Water', 
    urgency: 'Low', 
    source: 'Bot', 
    time: '10/24 10:57', 
    read: true, 
    archived: false, 
    description: 'Relief goods distribution needed for 15 families affected by flash flood.', 
    reporter: 'Liza Mendoza', 
    contact: '0914-555-6666', 
    coordinates: '14.0941, 121.0234' 
  },
];


export default function IncidentReports() {
const [reports, setReports] = useState<Report[]>(sampleReports);
const [selectedIds, setSelectedIds] = useState<string[]>([]);
const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'archived'>('all');
const [viewingReport, setViewingReport] = useState<Report | null>(null);
const [fromDate, setFromDate] = useState('');
const [toDate, setToDate] = useState('');

 const filteredReports = reports.filter (r => {
  if (activeTab === 'unread') return !r.read && !r.archived;
  if (activeTab === 'archived') return r.archived;
  return !r.archived; 

 });

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === reports.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(reports.map(r => r.id));
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'High': return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
      case 'Moderate': return 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800';
      case 'Low': return 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600';
      default: return 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600';
    }
  };


  return (
    <div className="space-y-6">
       {/* Tabs */}
      <div className="flex items-center gap-2">
{/* Tabs */}
<div className="flex items-center gap-2">
  {[
    { key: 'all' as const, label: 'All Reports', count: reports.filter(r => !r.archived).length },
    { key: 'unread' as const, label: 'Unread', count: reports.filter(r => !r.read && !r.archived).length },
    { key: 'archived' as const, label: 'Archived', count: reports.filter(r => r.archived).length },
  ].map(tab => (
    <button
      key={tab.key}
      onClick={() => { setActiveTab(tab.key); setSelectedIds([]); }}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        activeTab === tab.key
          ? 'bg-blue-600 text-white shadow-sm'
          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
      }`}
    >
      {tab.label}
      <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
        activeTab === tab.key ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
      }`}>
        {tab.count}
      </span>
    </button>
  ))}
</div>

      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
            <Filter className="w-4 h-4" />
            <span className="font-medium">Filter</span>
          </div>

          <select className="px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>All Barangays</option>
            <option>Leynes</option>
            <option>Poblacion</option>
            <option>Cawit</option>
            <option>San Isidro</option>
            <option>Sampaloc</option>
            <option>Banga</option>
            <option>Banadero</option>
          </select>

          <select className="px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>All Types</option>
            <option>Search & Rescue</option>
            <option>Medical</option>
            <option>Food & Water</option>
            <option>Infrastructure</option>
          </select>

          <select className="px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>All Urgency</option>
            <option>High</option>
            <option>Moderate</option>
            <option>Low</option>
          </select>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 lg:ml-auto w-full lg:w-auto">
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

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === reports.length && reports.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">ID</th>
                <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">Barangay</th>
                <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">Type</th>
                <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">Urgency</th>
                <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">Source</th>
                <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">Time</th>
                <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {reports.map((report) => (
                <tr
                  key={report.id}
                  className={`hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors ${!report.read ? 'bg-blue-50/30 dark:bg-blue-900/20' : ''}`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(report.id)}
                      onChange={() => toggleSelect(report.id)}
                      className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400">{report.id}</td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-200 whitespace-nowrap">{report.barangay}</td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-200 whitespace-nowrap">{report.type}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${getUrgencyColor(report.urgency)}`}>
                      {report.urgency}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{report.source}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">{report.time}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg transition-colors">
                        View
                      </button>
                      <button className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 rounded-lg transition-colors">
                        Unread
                      </button>
                      <button className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 rounded-lg transition-colors">
                        Archive
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}