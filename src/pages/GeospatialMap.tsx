import { useState, useCallback, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Map as MapIcon, Eye, EyeOff, Search, X,
  ChevronLeft, ChevronRight, Filter, Navigation,
  Siren, HeartPulse, Droplets, HardHat, ShieldCheck,
  MapPinned, FileText, User, Phone, Clock, Layers,
} from 'lucide-react';
import { StaggerContainer, StaggerItem } from '../components/Stagger';
import { useTheme } from '../components/ThemeContent';
import MapContainer from '../components/MapContainer';
import { useReports } from '../context/ReportsContext';
import { talisayBarangays } from '../data/talisay-barangays';
import type { MapLayerState, SelectedFeature } from '../types/geospatial';
import type { Report } from '../data/sample-reports';

const INITIAL_LAYERS: MapLayerState = {
  choropleth: true,
  pins: true,
  boundaries: true,
};

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

// Type icons
const TYPE_ICONS: Record<string, React.ReactNode> = {
  'Search & Rescue': <Siren className="w-4 h-4" />,
  'Medical': <HeartPulse className="w-4 h-4" />,
  'Food & Water': <Droplets className="w-4 h-4" />,
  'Infrastructure': <HardHat className="w-4 h-4" />,
};

const URGENCY_COLORS: Record<string, string> = {
  'High': 'bg-red-500',
  'Moderate': 'bg-yellow-500',
  'Low': 'bg-green-500',
};

const URGENCY_TEXT: Record<string, string> = {
  'High': 'text-red-400',
  'Moderate': 'text-yellow-400',
  'Low': 'text-green-400',
};

// Parse "lat, lng" → [lng, lat] for MapLibre
function parseCoords(coords: string): [number, number] | null {
  const parts = coords.split(',').map((s) => parseFloat(s.trim()));
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return [parts[1], parts[0]];
  }
  return null;
}

// ── Sub-components ──

function IncidentListItem({ report, index, onClick }: { report: Report; index: number; onClick: () => void }) {
  return (
    <motion.button
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, ease: EASE_OUT, delay: index * 0.03 }}
      onClick={onClick}
      className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group active:scale-[0.98]"
      style={{ transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)' }}
    >
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full shrink-0 ${URGENCY_COLORS[report.urgency] || 'bg-slate-400'}`} />
        <span className="text-xs font-mono text-slate-500 dark:text-slate-400">#{report.id}</span>
        <span className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate flex-1">
          {report.barangay}
        </span>
      </div>
      <div className="flex items-center gap-2 mt-1 ml-4">
        <span className="text-slate-400 dark:text-slate-500 scale-75 origin-left">
          {TYPE_ICONS[report.type] || <Siren className="w-4 h-4" />}
        </span>
        <span className="text-[11px] text-slate-500 dark:text-slate-400">{report.type}</span>
        <span className="text-[10px] text-slate-400 dark:text-slate-500 ml-auto">{report.time}</span>
      </div>
    </motion.button>
  );
}

function BarangayDetailCard({ name, reports, onClose, onViewList }: {
  name: string;
  reports: Report[];
  onClose: () => void;
  onViewList: () => void;
}) {
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    reports.forEach((r) => { counts[r.type] = (counts[r.type] || 0) + 1; });
    return counts;
  }, [reports]);

  const urgencyCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    reports.forEach((r) => { counts[r.urgency] = (counts[r.urgency] || 0) + 1; });
    return counts;
  }, [reports]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: 8 }}
      transition={{ duration: 0.2, ease: EASE_OUT }}
      className="absolute top-4 right-4 z-30 w-[320px] max-h-[70vh] overflow-y-auto rounded-xl bg-white dark:bg-slate-800 shadow-lg border border-slate-200 dark:border-slate-700"
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <Navigation className="w-4 h-4 text-blue-500" />
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{name}</h3>
        </div>
        <button onClick={onClose} className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors active:scale-90">
          <X className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      <div className="px-5 py-4 space-y-4">
        <div>
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{reports.length}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Total Incidents</p>
        </div>

        <div>
          <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">By Type</p>
          <div className="space-y-1.5">
            {Object.entries(typeCounts).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <span className="text-slate-400 dark:text-slate-500 scale-90">{TYPE_ICONS[type]}</span>
                  {type}
                </span>
                <span className="font-medium text-slate-700 dark:text-slate-200">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">By Urgency</p>
          <div className="space-y-1.5">
            {Object.entries(urgencyCounts).map(([urgency, count]) => (
              <div key={urgency} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${URGENCY_COLORS[urgency]}`} />
                  <span className="text-slate-600 dark:text-slate-300">{urgency}</span>
                </span>
                <span className="font-medium text-slate-700 dark:text-slate-200">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={onViewList}
          className="w-full px-4 py-2 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/30 rounded-lg transition-colors flex items-center justify-center gap-1.5 active:scale-[0.97]"
        >
          <FileText className="w-3.5 h-3.5" /> View in Incident Reports
        </button>
      </div>
    </motion.div>
  );
}

function IncidentDetailCard({ report, onClose, onViewInReports }: {
  report: Report;
  onClose: () => void;
  onViewInReports: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: 8 }}
      transition={{ duration: 0.2, ease: EASE_OUT }}
      className="absolute top-4 right-4 z-30 w-[320px] max-h-[70vh] overflow-y-auto rounded-xl bg-white dark:bg-slate-800 shadow-lg border border-slate-200 dark:border-slate-700"
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 dark:text-slate-500 scale-90">{TYPE_ICONS[report.type]}</span>
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{report.type}</span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 ${URGENCY_TEXT[report.urgency]} border border-slate-200 dark:border-slate-600`}>
            {report.urgency}
          </span>
        </div>
        <button onClick={onClose} className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors active:scale-90">
          <X className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      <div className="px-5 py-4 space-y-4">
        <div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{report.barangay}</p>
          <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">{report.coordinates}</p>
        </div>

        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3 border border-slate-100 dark:border-slate-600">
          <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">&quot;{report.description}&quot;</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            — {report.reporter}, {report.time}
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <User className="w-3.5 h-3.5" />
            <span>{report.reporter}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Phone className="w-3.5 h-3.5" />
            <span>{report.contact}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Clock className="w-3.5 h-3.5" />
            <span>{report.time}</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
              {report.status === 'verified' ? '✓ Verified' : report.status}
            </span>
          </div>
        </div>

        <button
          onClick={onViewInReports}
          className="w-full px-3 py-2 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/30 rounded-lg transition-colors flex items-center justify-center gap-1.5 active:scale-[0.97]"
        >
          <FileText className="w-3.5 h-3.5" /> Open in Reports
        </button>
      </div>
    </motion.div>
  );
}

// ── Layer Toggle Button ──
function LayerToggle({ active, label, color, onClick }: {
  active: boolean;
  label: string;
  color: string;
  onClick: () => void;
}) {
  const activeClass = active
    ? `${color} shadow-sm`
    : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400';

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 active:scale-[0.97] border border-slate-200 dark:border-slate-600 ${activeClass}`}
      style={{ transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)' }}
    >
      {active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
      {label}
    </button>
  );
}

// ── Main Page ──

export default function GeospatialMap() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { reports, getReportsByBarangay } = useReports();
  const { theme } = useTheme();

  // Map theme follows the global app theme
  const mapTheme = theme;

  const [layers, setLayers] = useState<MapLayerState>(INITIAL_LAYERS);
  const [selected, setSelected] = useState<SelectedFeature>(null);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterUrgency, setFilterUrgency] = useState<string>('All');
  const [filterType, setFilterType] = useState<string>('All');

  // Compute barangay max urgency level (High=3, Moderate=2, Low=1) reflecting active filters
  const URGENCY_WEIGHTS: Record<string, number> = { High: 3, Moderate: 2, Low: 1 };
  const barangayCounts = useMemo(() => {
    const maxUrgency: Record<string, number> = {};
    reports
      .filter((r) => r.status === 'verified' || r.status === 'under_review')
      .filter((r) => filterUrgency === 'All' || r.urgency === filterUrgency)
      .filter((r) => filterType === 'All' || r.type === filterType)
      .forEach((r) => {
        const weight = URGENCY_WEIGHTS[r.urgency] || 1;
        maxUrgency[r.barangay] = Math.max(maxUrgency[r.barangay] || 0, weight);
      });
    return maxUrgency;
  }, [reports, filterUrgency, filterType]);

  // Reports with coords for pin layer (verified + under_review — matches drawer)
  const pinReports = useMemo(() => {
    return reports
      .filter((r) => (r.status === 'verified' || r.status === 'under_review') && parseCoords(r.coordinates))
      .filter((r) => filterUrgency === 'All' || r.urgency === filterUrgency)
      .filter((r) => filterType === 'All' || r.type === filterType);
  }, [reports, filterUrgency, filterType]);

  // Drawer list: verified + under_review with coords
  const drawerReports = useMemo(() => {
    return reports
      .filter((r) => (r.status === 'verified' || r.status === 'under_review') && parseCoords(r.coordinates))
      .filter((r) => filterUrgency === 'All' || r.urgency === filterUrgency)
      .filter((r) => filterType === 'All' || r.type === filterType)
      .sort((a, b) => {
        const u = { High: 3, Moderate: 2, Low: 1 };
        return (u[b.urgency as keyof typeof u] || 0) - (u[a.urgency as keyof typeof u] || 0);
      });
  }, [reports, filterUrgency, filterType]);

  // Search suggestions
  const searchSuggestions = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    const names = Array.from(new Set(talisayBarangays.features.map((f) => f.properties.name)));
    return names
      .filter((name) => name.toLowerCase().includes(q))
      .slice(0, 5);
  }, [searchQuery]);

  const toggleLayer = useCallback((key: keyof MapLayerState) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handleSelectFeature = useCallback((feature: SelectedFeature) => {
    setSelected(feature);
  }, []);

  const handleFlyToReport = useCallback((report: Report) => {
    const coords = parseCoords(report.coordinates);
    if (coords) {
      setSelected({ type: 'incident', id: report.id });
      window.dispatchEvent(new CustomEvent('map-fly-to', { detail: { center: coords, zoom: 16 } }));
    }
  }, []);

  const handleSearchSelect = useCallback((barangayName: string) => {
    const feature = talisayBarangays.features.find((f) => f.properties.name === barangayName);
    if (feature) {
      const [lng, lat] = feature.properties.centroid;
      window.dispatchEvent(new CustomEvent('map-fly-to', { detail: { center: [lng, lat], zoom: 15 } }));
      setSelected({ type: 'barangay', id: feature.properties.id, name: barangayName });
    }
    setSearchQuery('');
  }, []);

  // Handle URL ?focus= param
  useEffect(() => {
    const focusId = searchParams.get('focus');
    if (focusId) {
      const report = reports.find((r) => r.id === focusId);
      if (report) {
        const coords = parseCoords(report.coordinates);
        if (coords) {
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('map-fly-to', { detail: { center: coords, zoom: 16 } }));
            setSelected({ type: 'incident', id: report.id });
          }, 500);
        }
      }
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, reports, setSearchParams]);

  // Selected data
  const selectedReport = selected?.type === 'incident'
    ? reports.find((r) => r.id === selected.id)
    : null;

  const selectedBarangayReports = useMemo(() => {
    if (selected?.type !== 'barangay') return [];
    const all = getReportsByBarangay()[selected.name] || [];
    return all
      .filter((r) => filterUrgency === 'All' || r.urgency === filterUrgency)
      .filter((r) => filterType === 'All' || r.type === filterType);
  }, [selected, getReportsByBarangay, filterUrgency, filterType]);

  return (
    <StaggerContainer className="flex flex-col flex-1 min-h-0 gap-4">

      {/* ── Toolbar Row ── */}
      <StaggerItem>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm px-5 py-3">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Title */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                <MapIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-tight">
                  Geospatial Map
                </h2>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  Talisay, Batangas
                </p>
              </div>
            </div>

            <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 shrink-0 hidden sm:block" />

            {/* Search */}
            <div className="relative flex-1 max-w-xs min-w-[160px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search barangay..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-100/80 dark:bg-slate-700/50 border-0 rounded-lg text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
              {searchSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg overflow-hidden z-50">
                  {searchSuggestions.map((name) => (
                    <button
                      key={name}
                      onClick={() => handleSearchSelect(name)}
                      className="w-full text-left px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      <MapPinned className="w-3.5 h-3.5 inline mr-2 text-slate-400" />
                      {name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Filters */}
            <select
              value={filterUrgency}
              onChange={(e) => setFilterUrgency(e.target.value)}
              className="text-sm bg-slate-100/80 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500/40"
            >
              <option value="All">All Urgency</option>
              <option value="High">🔴 High</option>
              <option value="Moderate">🟡 Moderate</option>
              <option value="Low">🟢 Low</option>
            </select>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="text-sm bg-slate-100/80 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500/40"
            >
              <option value="All">All Types</option>
              <option value="Search & Rescue">🚨 Search & Rescue</option>
              <option value="Medical">🚑 Medical</option>
              <option value="Food & Water">💧 Food & Water</option>
              <option value="Infrastructure">🏗️ Infrastructure</option>
            </select>

            <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 shrink-0 hidden sm:block" />

            {/* Layer Toggles */}
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
              <LayerToggle
                active={layers.choropleth}
                label="Heatmap"
                color="bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"
                onClick={() => toggleLayer('choropleth')}
              />
              <LayerToggle
                active={layers.pins}
                label="Pins"
                color="bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300"
                onClick={() => toggleLayer('pins')}
              />
              <LayerToggle
                active={layers.boundaries}
                label="Borders"
                color="bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300"
                onClick={() => toggleLayer('boundaries')}
              />
            </div>
          </div>
        </div>
      </StaggerItem>

      {/* ── Map + Side Panel ── */}
      <StaggerItem className="flex-1 min-h-0">
        <div className="grid grid-cols-12 gap-4 h-full">

          {/* Left Incident List Panel */}
          <AnimatePresence mode="wait">
            {drawerOpen && (
              <motion.div
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2, ease: EASE_OUT }}
                className="col-span-12 lg:col-span-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col overflow-hidden min-h-0"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700 shrink-0">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Incidents</span>
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-medium">
                      {drawerReports.length}
                    </span>
                  </div>
                  <button
                    onClick={() => setDrawerOpen(false)}
                    className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors active:scale-90"
                  >
                    <ChevronLeft className="w-4 h-4 text-slate-400" />
                  </button>
                </div>

                {/* Legend */}
                <div className="flex items-center gap-3 px-4 py-2 border-b border-slate-50 dark:border-slate-700/50 shrink-0">
                  <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">Severity:</span>
                  <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-slate-300 dark:bg-slate-600" /><span className="text-[10px] text-slate-400">None</span></div>
                  <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-green-500" /><span className="text-[10px] text-slate-400">Low</span></div>
                  <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-yellow-500" /><span className="text-[10px] text-slate-400">Moderate</span></div>
                  <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-red-500" /><span className="text-[10px] text-slate-400">High</span></div>
                </div>

                <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
                  {drawerReports.length === 0 ? (
                    <div className="text-center py-12 text-xs text-slate-400 dark:text-slate-500">
                      No incidents match filters
                    </div>
                  ) : (
                    drawerReports.map((report, i) => (
                      <IncidentListItem
                        key={report.id}
                        report={report}
                        index={i}
                        onClick={() => handleFlyToReport(report)}
                      />
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Map Container */}
          <div className={`relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm ${drawerOpen ? 'col-span-12 lg:col-span-9' : 'col-span-12'}`}>

            {/* Drawer re-open button */}
            {!drawerOpen && (
              <motion.button
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.15, ease: EASE_OUT }}
                onClick={() => setDrawerOpen(true)}
                className="absolute left-3 top-3 z-20 p-2 rounded-lg bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors active:scale-[0.95]"
                title="Show incident list"
              >
                <ChevronRight className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              </motion.button>
            )}

            {/* Detail Cards (overlaid on map) */}
            <AnimatePresence>
              {selected?.type === 'barangay' && (
                <BarangayDetailCard
                  name={selected.name}
                  reports={selectedBarangayReports}
                  onClose={() => setSelected(null)}
                  onViewList={() => navigate(`/incident-reports?barangay=${selected.name}`)}
                />
              )}
              {selected?.type === 'incident' && selectedReport && (
                <IncidentDetailCard
                  report={selectedReport}
                  onClose={() => setSelected(null)}
                  onViewInReports={() => navigate(`/incident-reports?focus=${selectedReport.id}`)}
                />
              )}
            </AnimatePresence>

            {/* Map */}
            <MapContainer
              theme={mapTheme}
              layers={layers}
              barangayCounts={barangayCounts}
              pinReports={pinReports}
              onSelectFeature={handleSelectFeature}
            />
          </div>
        </div>
      </StaggerItem>
    </StaggerContainer>
  );
}