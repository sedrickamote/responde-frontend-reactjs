import { useState, useEffect } from 'react';
import { Filter, X, Eye, EyeOff, Archive, ArchiveRestore, MapPin, Clock, User, Phone, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react';
import DatePicker from '../components/DatePicker';
import FilterDropdown from '../components/DropDown';

// ── Type Definition ──
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
  { id: '011', barangay: 'Leynes', type: 'Search & Rescue', urgency: 'Low', source: 'Scraper', time: '10/24 10:57', read: true, archived: false, description: 'Missing person reported near the riverbank. Last seen wearing a red shirt.', reporter: 'Juan Dela Cruz', contact: '0912-345-6789', coordinates: '14.0951, 121.0203' },
  { id: '012', barangay: 'Poblacion', type: 'Medical', urgency: 'High', source: 'Bot', time: '10/24 10:57', read: false, archived: false, description: 'Elderly resident collapsed at the market. Needs immediate medical attention.', reporter: 'Maria Santos', contact: '0918-234-5678', coordinates: '14.0923, 121.0187' },
  { id: '013', barangay: 'Leynes', type: 'Food & Water', urgency: 'Low', source: 'Scraper', time: '10/24 10:57', read: true, archived: false, description: 'Request for water supply delivery due to pipe maintenance.', reporter: 'Pedro Reyes', contact: '0917-876-5432', coordinates: '14.0945, 121.0210' },
  { id: '014', barangay: 'Cawit', type: 'Infrastructure', urgency: 'Moderate', source: 'Scraper', time: '10/24 10:57', read: true, archived: false, description: 'Road partially blocked by fallen tree after heavy rains.', reporter: 'Ana Lim', contact: '0919-123-4567', coordinates: '14.0987, 121.0156' },
  { id: '015', barangay: 'Leynes', type: 'Search & Rescue', urgency: 'Low', source: 'Scraper', time: '10/24 10:57', read: true, archived: false, description: 'Stranded dog on rooftop during flooding. Owner requesting assistance.', reporter: 'Carlos Tan', contact: '0915-987-6543', coordinates: '14.0934, 121.0221' },
  { id: '016', barangay: 'San Isidro', type: 'Medical', urgency: 'Low', source: 'Bot', time: '10/24 10:57', read: true, archived: false, description: 'Child with high fever, parents requesting transport to health center.', reporter: 'Elena Cruz', contact: '0916-456-7890', coordinates: '14.0912, 121.0254' },
  { id: '017', barangay: 'Leynes', type: 'Search & Rescue', urgency: 'Low', source: 'Scraper', time: '10/24 10:57', read: true, archived: false, description: 'Boat capsized near the shore. Two fishermen accounted for, one missing.', reporter: 'Ramon Garcia', contact: '0913-222-3333', coordinates: '14.0967, 121.0198' },
  { id: '018', barangay: 'Leynes', type: 'Food & Water', urgency: 'Low', source: 'Bot', time: '10/24 10:57', read: true, archived: false, description: 'Relief goods distribution needed for 15 families affected by flash flood.', reporter: 'Liza Mendoza', contact: '0914-555-6666', coordinates: '14.0941, 121.0234' },
  { id: '019', barangay: 'Banga', type: 'Medical', urgency: 'High', source: 'Bot', time: '10/24 11:15', read: false, archived: false, description: 'Pregnant woman in labor needing immediate transport to hospital.', reporter: 'Josefina Reyes', contact: '0920-111-2222', coordinates: '14.0891, 121.0284' },
  { id: '020', barangay: 'Banadero', type: 'Infrastructure', urgency: 'High', source: 'Scraper', time: '10/24 11:30', read: false, archived: false, description: 'Bridge collapsed due to heavy rainfall. Alternative route needed.', reporter: 'Miguel Santos', contact: '0921-333-4444', coordinates: '14.1012, 121.0123' },
  { id: '021', barangay: 'Sampaloc', type: 'Search & Rescue', urgency: 'Moderate', source: 'Bot', time: '10/24 11:45', read: true, archived: false, description: 'Family trapped on second floor due to flash flooding.', reporter: 'Carmen Villanueva', contact: '0922-555-6666', coordinates: '14.0876, 121.0312' },
  { id: '022', barangay: 'Poblacion', type: 'Food & Water', urgency: 'Moderate', source: 'Scraper', time: '10/24 12:00', read: true, archived: false, description: 'Evacuation center needs 50 food packs and clean drinking water.', reporter: 'Antonio dela Cruz', contact: '0923-777-8888', coordinates: '14.0925, 121.0190' },
  { id: '023', barangay: 'Banga', type: 'Search & Rescue', urgency: 'Moderate', source: 'Scraper', time: '10/24 12:15', read: false, archived: false, description: 'Trapped residents on rooftop after sudden rise in water level. Barangay rescue team requesting backup.', reporter: 'Rodelio Cruz', contact: '0924-888-9999', coordinates: '14.0885, 121.0295' },
  { id: '024', barangay: 'Banadero', type: 'Medical', urgency: 'Low', source: 'Bot', time: '10/24 12:30', read: true, archived: false, description: 'Senior citizen with hypertension needs maintenance medication. Barangay health worker on site.', reporter: 'Lourdes Reyes', contact: '0925-111-2223', coordinates: '14.1005, 121.0135' },
  { id: '025', barangay: 'Sampaloc', type: 'Infrastructure', urgency: 'High', source: 'Scraper', time: '10/24 12:45', read: false, archived: false, description: 'Power lines down near elementary school. Area needs immediate clearing before classes resume.', reporter: 'Fernando Lim', contact: '0926-444-5555', coordinates: '14.0865, 121.0325' },
  { id: '026', barangay: 'Poblacion', type: 'Search & Rescue', urgency: 'High', source: 'Bot', time: '10/24 13:00', read: false, archived: false, description: 'Vehicle swept away by flash flood near the bridge. Driver still inside, urgent extraction needed.', reporter: 'Gloria Santos', contact: '0927-666-7777', coordinates: '14.0915, 121.0205' },
  { id: '027', barangay: 'Cawit', type: 'Food & Water', urgency: 'Low', source: 'Scraper', time: '10/24 13:15', read: true, archived: false, description: 'Barangay hall requesting additional water containers for evacuation center residents.', reporter: 'Ricardo Tan', contact: '0928-888-9990', coordinates: '14.0995, 121.0145' },
  { id: '028', barangay: 'San Isidro', type: 'Infrastructure', urgency: 'Moderate', source: 'Bot', time: '10/24 13:30', read: true, archived: false, description: 'Barangay road eroded after continuous rain. Motorcycles can no longer pass through.', reporter: 'Marites Garcia', contact: '0929-000-1111', coordinates: '14.0905, 121.0265' },
  { id: '029', barangay: 'Leynes', type: 'Medical', urgency: 'High', source: 'Scraper', time: '10/24 13:45', read: false, archived: false, description: 'Multiple residents showing symptoms of leptospirosis after wading through floodwater. Health team dispatched.', reporter: 'Dr. Emmanuel Cruz', contact: '0930-222-3334', coordinates: '14.0955, 121.0215' },
  { id: '030', barangay: 'Banga', type: 'Food & Water', urgency: 'Moderate', source: 'Bot', time: '10/24 14:00', read: true, archived: false, description: '20 families in temporary shelter need hot meals and blankets for the night.', reporter: 'Helena Mendoza', contact: '0931-444-5556', coordinates: '14.0895, 121.0275' },
  { id: '031', barangay: 'Banadero', type: 'Search & Rescue', urgency: 'Low', source: 'Scraper', time: '10/24 14:15', read: true, archived: false, description: 'Livestock stranded in flooded pasture. Owner requesting assistance in moving animals to higher ground.', reporter: 'Domingo Reyes', contact: '0932-666-7778', coordinates: '14.1025, 121.0115' },
  { id: '032', barangay: 'Sampaloc', type: 'Medical', urgency: 'Moderate', source: 'Bot', time: '10/24 14:30', read: false, archived: false, description: 'Child with asthma attack, inhaler supply depleted. Parents requesting emergency transport.', reporter: 'Cecilia Villanueva', contact: '0933-888-9991', coordinates: '14.0875, 121.0305' },
  { id: '033', barangay: 'Poblacion', type: 'Infrastructure', urgency: 'Low', source: 'Scraper', time: '10/24 14:45', read: true, archived: false, description: 'Drainage system clogged with debris causing minor flooding on main street. Clearing team requested.', reporter: 'Alberto dela Cruz', contact: '0934-000-1112', coordinates: '14.0935, 121.0185' },
  { id: '034', barangay: 'Cawit', type: 'Search & Rescue', urgency: 'High', source: 'Bot', time: '10/24 15:00', read: false, archived: false, description: 'Landslide reported near hillside residences. Three houses affected, families evacuated to barangay hall.', reporter: 'Patricia Lim', contact: '0935-222-3335', coordinates: '14.0975, 121.0165' },
  { id: '035', barangay: 'San Isidro', type: 'Food & Water', urgency: 'Low', source: 'Scraper', time: '10/24 15:15', read: true, archived: false, description: 'Request for hygiene kits and potable water for 30 families staying in makeshift tents.', reporter: 'Roberto Garcia', contact: '0936-444-5557', coordinates: '14.0925, 121.0245' },
];

// ── Pagination Component ──
function Pagination({ currentPage, totalPages, onPageChange }: { currentPage: number; totalPages: number; onPageChange: (page: number) => void }) {
  const getPages = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages - 1, totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, 2, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 py-2 shrink-0">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors bg-white dark:bg-slate-800"
      >
        <ChevronLeft className="w-4 h-4" /> Previous
      </button>

      {getPages().map((page, i) =>
        page === '...' ? (
          <span key={`dots-${i}`} className="w-8 h-8 flex items-center justify-center text-sm text-slate-400 dark:text-slate-500">...</span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page as number)}
            className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
              currentPage === page
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 bg-white dark:bg-slate-800'
            }`}
          >
            {page}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors bg-white dark:bg-slate-800"
      >
        Next <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function IncidentReports() {
  const [reports, setReports] = useState<Report[]>(sampleReports);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'archived'>('all');
  const [viewingReport, setViewingReport] = useState<Report | null>(null);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // ── NEW: Filter states ──
  const [filterBarangay, setFilterBarangay] = useState('All Barangays');
  const [filterType, setFilterType] = useState('All Types');
  const [filterUrgency, setFilterUrgency] = useState('All Urgency');

  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, filterBarangay, filterType, filterUrgency]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    const visibleIds = paginatedReports.map(r => r.id);
    const allSelected = visibleIds.every(id => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      setSelectedIds(prev => [...new Set([...prev, ...visibleIds])]);
    }
  };

  const handleView = (report: Report) => {
    setViewingReport(report);
    if (!report.read) {
      setReports(prev => prev.map(r => r.id === report.id ? { ...r, read: true } : r));
    }
  };

  const handleToggleRead = (id: string) => {
    setReports(prev => prev.map(r => r.id === id ? { ...r, read: !r.read } : r));
  };

  const handleArchive = (id: string) => {
    setReports(prev => prev.map(r => r.id === id ? { ...r, archived: true } : r));
    setSelectedIds(prev => prev.filter(i => i !== id));
  };

  const handleUnarchive = (id: string) => {
    setReports(prev => prev.map(r => r.id === id ? { ...r, archived: false } : r));
    setSelectedIds(prev => prev.filter(i => i !== id));
  };

  const handleBulkArchive = () => {
    setReports(prev => prev.map(r => selectedIds.includes(r.id) ? { ...r, archived: true } : r));
    setSelectedIds([]);
  };

  const handleBulkUnarchive = () => {
    setReports(prev => prev.map(r => selectedIds.includes(r.id) ? { ...r, archived: false } : r));
    setSelectedIds([]);
  };

  const handleBulkRead = () => {
    setReports(prev => prev.map(r => selectedIds.includes(r.id) ? { ...r, read: true } : r));
  };

  const handleBulkUnread = () => {
    setReports(prev => prev.map(r => selectedIds.includes(r.id) ? { ...r, read: false } : r));
  };

  // ── UPDATED: Filter logic ──
  const filteredReports = reports.filter(r => {
    if (activeTab === 'unread') return !r.read && !r.archived;
    if (activeTab === 'archived') return r.archived;
    return !r.archived;
  }).filter(r => {
    if (filterBarangay !== 'All Barangays' && r.barangay !== filterBarangay) return false;
    if (filterType !== 'All Types' && r.type !== filterType) return false;
    if (filterUrgency !== 'All Urgency' && r.urgency !== filterUrgency) return false;
    return true;
  });

  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
  const paginatedReports = filteredReports.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-6">
      {/* Tabs */}
      <div className="flex items-center gap-2 shrink-0">
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

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 shrink-0">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm shrink-0">
            <Filter className="w-4 h-4" />
            <span className="font-medium">Filter</span>
          </div>

          <FilterDropdown
            value={filterBarangay}
            options={['All Barangays', 'Leynes', 'Poblacion', 'Cawit', 'San Isidro', 'Sampaloc', 'Banga', 'Banadero']}
            onChange={setFilterBarangay}
          />

          <FilterDropdown
            value={filterType}
            options={['All Types', 'Search & Rescue', 'Medical', 'Food & Water', 'Infrastructure']}
            onChange={setFilterType}
          />

          <FilterDropdown
            value={filterUrgency}
            options={['All Urgency', 'High', 'Moderate', 'Low']}
            onChange={setFilterUrgency}
          />

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

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-3 shrink-0">
          <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">
            {selectedIds.length} selected
          </span>
          <div className="ml-auto flex items-center gap-2">
            {activeTab !== 'archived' && (
              <>
                <button
                  onClick={handleBulkRead}
                  className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" /> Mark Read
                </button>
                <button
                  onClick={handleBulkUnread}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5"
                >
                  <EyeOff className="w-3.5 h-3.5" /> Mark Unread
                </button>
                <button
                  onClick={handleBulkArchive}
                  className="px-3 py-1.5 text-xs font-medium text-amber-700 bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-700 dark:text-amber-300 rounded-lg hover:bg-amber-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5"
                >
                  <Archive className="w-3.5 h-3.5" /> Archive
                </button>
              </>
            )}
            {activeTab === 'archived' && (
              <button
                onClick={handleBulkUnarchive}
                className="px-3 py-1.5 text-xs font-medium text-emerald-700 bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-700 dark:text-emerald-300 rounded-lg hover:bg-emerald-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5"
              >
                <ArchiveRestore className="w-3.5 h-3.5" /> Restore
              </button>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col flex-1 min-h-0">
        <div className="overflow-auto flex-1">
          <table className="w-full min-w-[700px] text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={paginatedReports.length > 0 && paginatedReports.every(r => selectedIds.includes(r.id))}
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
              {paginatedReports.length === 0 ? (
                <tr className="h-full">
                  <td colSpan={8} className="h-full px-4 text-center text-slate-400 dark:text-slate-500 align-middle">
                    <div className="flex flex-col items-center justify-center py-20">
                      <span className="text-sm">{activeTab === 'archived' ? 'No archived reports.' : activeTab === 'unread' ? 'No unread reports.' : 'No reports found.'}</span>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedReports.map((report) => (
                  <tr
                    key={report.id}
                    className={`hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors ${
                      !report.read && !report.archived ? 'bg-blue-50/40 dark:bg-blue-900/15' : ''
                    }`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(report.id)}
                        onChange={() => toggleSelect(report.id)}
                        className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {!report.read && !report.archived && (
                          <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" title="Unread" />
                        )}
                        <span className="font-mono text-slate-600 dark:text-slate-400">#{report.id}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-200 whitespace-nowrap">{report.barangay}</td>
                    <td className={`px-4 py-3 whitespace-nowrap font-medium ${getTypeColor(report.type)}`}>
                      {report.type}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${getUrgencyColor(report.urgency)}`}>
                        {report.urgency}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{report.source}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">{report.time}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleView(report)}
                          className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg transition-colors flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> View
                        </button>

                        {!report.archived && (
                          <button
                            onClick={() => handleToggleRead(report.id)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 ${
                              report.read
                                ? 'text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
                                : 'text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30'
                            }`}
                          >
                            {report.read ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            {report.read ? 'Unread' : 'Read'}
                          </button>
                        )}

                        {report.archived ? (
                          <button
                            onClick={() => handleUnarchive(report.id)}
                            className="px-3 py-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/30 rounded-lg transition-colors flex items-center gap-1"
                          >
                            <ArchiveRestore className="w-3.5 h-3.5" /> Restore
                          </button>
                        ) : (
                          <button
                            onClick={() => handleArchive(report.id)}
                            className="px-3 py-1.5 text-xs font-medium text-amber-600 bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:hover:bg-amber-900/30 rounded-lg transition-colors flex items-center gap-1"
                          >
                            <Archive className="w-3.5 h-3.5" /> Archive
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {/* View Modal */}
      {viewingReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setViewingReport(null)}>
          <div
            className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm text-slate-500 dark:text-slate-400">#{viewingReport.id}</span>
                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${getUrgencyColor(viewingReport.urgency)}`}>
                  {viewingReport.urgency}
                </span>
              </div>
              <button
                onClick={() => setViewingReport(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              <div>
                <h3 className={`text-lg font-bold ${getTypeColor(viewingReport.type)}`}>
                  {viewingReport.type}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">{viewingReport.barangay}, Talisay</p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
                <p className="text-slate-700 dark:text-slate-200 text-sm leading-relaxed">
                  {viewingReport.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-2.5">
                  <User className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider font-medium">Reporter</p>
                    <p className="text-sm text-slate-700 dark:text-slate-200 font-medium">{viewingReport.reporter}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Phone className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider font-medium">Contact</p>
                    <p className="text-sm text-slate-700 dark:text-slate-200 font-medium">{viewingReport.contact}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider font-medium">Coordinates</p>
                    <p className="text-sm text-slate-700 dark:text-slate-200 font-mono">{viewingReport.coordinates}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider font-medium">Reported</p>
                    <p className="text-sm text-slate-700 dark:text-slate-200">{viewingReport.time}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <MessageSquare className="w-4 h-4 text-slate-400" />
                <span className="text-xs text-slate-500 dark:text-slate-400">Source: <span className="font-medium text-slate-700 dark:text-slate-300">{viewingReport.source}</span></span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
              <button
                onClick={() => setViewingReport(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Close
              </button>
              {!viewingReport.archived && (
                <button
                  onClick={() => {
                    handleArchive(viewingReport.id);
                    setViewingReport(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:hover:bg-amber-900/30 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Archive className="w-4 h-4" /> Archive
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}