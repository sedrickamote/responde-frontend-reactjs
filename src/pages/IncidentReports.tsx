import { useState } from 'react';
import { Filter } from 'lucide-react';
import DatePicker from '../components/DatePicker';

const sampleReports = [
  { id: '011', barangay: 'Leynes', type: 'Search & Rescue', urgency: 'Low', source: 'Scraper', time: '10/24 10:57', read: true },
  { id: '012', barangay: 'Poblacion', type: 'Search & Rescue', urgency: 'High', source: 'Bot', time: '10/24 10:57', read: false },
  { id: '013', barangay: 'Leynes', type: 'Search & Rescue', urgency: 'Low', source: 'Scraper', time: '10/24 10:57', read: true },
  { id: '014', barangay: 'Cawit', type: 'Search & Rescue', urgency: 'Low', source: 'Scraper', time: '10/24 10:57', read: true },
  { id: '015', barangay: 'Leynes', type: 'Search & Rescue', urgency: 'Low', source: 'Scraper', time: '10/24 10:57', read: true },
  { id: '016', barangay: 'San Isidro', type: 'Search & Rescue', urgency: 'Low', source: 'Bot', time: '10/24 10:57', read: true },
  { id: '017', barangay: 'Leynes', type: 'Search & Rescue', urgency: 'Low', source: 'Scraper', time: '10/24 10:57', read: true },
  { id: '018', barangay: 'Leynes', type: 'Search & Rescue', urgency: 'Low', source: 'Bot', time: '10/24 10:57', read: true },
];

export default function IncidentReports() {
  const [reports, setReports] = useState(sampleReports);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

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