import { useState, useMemo, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  Download,
  FileText,
  TrendingUp,
  MapPin,
  AlertTriangle,
  Siren,
  HeartPulse,
  Droplets,
  HardHat,
  BarChart3,
  Lightbulb,
  CheckCircle2,
  XCircle,
  Bot,
  Globe2,
  Filter,
  X,
  RotateCcw,
  Layers,
  PieChart as PieChartIcon,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import DatePicker from '../components/DatePicker';
import FilterDropdown from '../components/DropDown';
import { useReports } from '../context/ReportsContext';
import PageLoader from '../components/PageLoader';
import { containerVariants, itemVariants } from '../components/Stagger';
import { BarangayBarChart, type BarangayBarChartProps } from '../components/BarangayBarChart';

export { BarangayBarChart, type BarangayBarChartProps };

// ── Types ───────────────────────────────────────────────────────────────────
export type AnalyticsReport = {
  id: string;
  barangay: string;
  type: string;
  urgency: string;
  source: string;
  time: string;
  status: string;
  createdAt?: string | null;
  verifiedAt?: string | null;
};

// ── Design Tokens & Config ───────────────────────────────────────────────────
const ACCENT_BLUE = '#2563EB';

const TYPE_CONFIG: Record<
  string,
  { icon: LucideIcon; iconClass: string; color: string; bg: string }
> = {
  'Search & Rescue': { icon: Siren, iconClass: 'text-amber-500', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  Medical: { icon: HeartPulse, iconClass: 'text-rose-500', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  'Food & Water': { icon: Droplets, iconClass: 'text-emerald-500', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  Infrastructure: { icon: HardHat, iconClass: 'text-indigo-500', color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
};

const URGENCY_WEIGHT: Record<string, number> = { High: 3, Moderate: 2, Low: 1 };

// ── Helpers ──────────────────────────────────────────────────────────────────
export function normalizeIncidentType(type?: string | null): string {
  const norm = (type || '').trim().toLowerCase();
  if (norm.includes('search') || norm.includes('rescue') || norm.includes('evacuat') || norm.includes('stranded')) {
    return 'Search & Rescue';
  }
  if (norm.includes('medic') || norm.includes('casualty') || norm.includes('sugat') || norm.includes('hospital')) {
    return 'Medical';
  }
  if (norm.includes('food') || norm.includes('water') || norm.includes('tubig') || norm.includes('relief')) {
    return 'Food & Water';
  }
  if (norm.includes('infra') || norm.includes('poste') || norm.includes('kuryente') || norm.includes('fire') || norm.includes('flood') || norm.includes('landslide') || norm.includes('earthquake')) {
    return 'Infrastructure';
  }
  return 'Infrastructure';
}

function parseReportTime(value: string) {
  const m = String(value || '').trim().match(/^(\d{1,2})\/(\d{1,2})\s+(\d{1,2}):(\d{2})(?:\s*([AP]M))?$/i);
  if (!m) return null;
  let hour = +m[3];
  const ampm = m[5]?.toUpperCase();
  if (ampm === 'PM' && hour < 12) hour += 12;
  if (ampm === 'AM' && hour === 12) hour = 0;
  return { month: +m[1], day: +m[2], hour, minute: +m[4] };
}

function responseMinutes(report: AnalyticsReport) {
  if (!report.verifiedAt) return null;
  const a = parseReportTime(report.time), b = parseReportTime(report.verifiedAt);
  if (!a || !b) return null;
  const diff = b.hour * 60 + b.minute - (a.hour * 60 + a.minute);
  return diff >= 0 ? diff : null;
}

function daysBefore(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

// ── Soft UI Evolution Card Component ─────────────────────────────────────────
function SoftCard({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border transition-all duration-300 ${className}`}
      style={{
        backgroundColor: 'var(--soft-surface)',
        borderColor: 'var(--soft-border)',
        boxShadow: 'var(--soft-shadow-card)',
      }}
    >
      {children}
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  description,
  badge,
  iconColor = ACCENT_BLUE,
  iconBg,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  badge?: ReactNode;
  iconColor?: string;
  iconBg?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 mb-5">
      <div className="flex items-start gap-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border"
          style={{
            background: iconBg ?? `${iconColor}12`,
            borderColor: `${iconColor}22`,
            color: iconColor,
          }}
        >
          <Icon className="w-4 h-4" strokeWidth={1.75} />
        </div>
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-white tracking-tight text-base">{title}</h3>
          {description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{description}</p>
          )}
        </div>
      </div>
      {badge && <div className="shrink-0">{badge}</div>}
    </div>
  );
}

// ── Custom Tooltips ──────────────────────────────────────────────────────────
interface TooltipPayloadItem {
  value?: number | string;
  name?: string;
  color?: string;
  payload?: Record<string, unknown>;
}

interface CTP {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string | number;
}

function VolumeTooltip({ active, payload, label }: CTP) {
  if (!active || !payload?.length) return null;
  const val = Number(payload[0]?.value ?? 0);
  return (
    <div className="bg-white/95 dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 px-3.5 py-2.5 rounded-xl shadow-lg text-xs backdrop-blur-xs">
      <p className="font-medium text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-wider">{label}</p>
      <div className="flex items-baseline gap-1.5 mt-0.5">
        <span className="text-base font-bold text-slate-900 dark:text-white tabular-nums">{val}</span>
        <span className="text-xs text-slate-500 dark:text-slate-400">{val === 1 ? 'incident' : 'incidents'}</span>
      </div>
    </div>
  );
}

function PieTooltip({ active, payload }: CTP) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload as { name?: string; value?: number; color?: string } | undefined;
  if (!d) return null;
  return (
    <div className="bg-white/95 dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800 px-3.5 py-2.5 rounded-xl shadow-lg text-xs backdrop-blur-xs">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
        <span className="font-semibold text-slate-800 dark:text-slate-100">{d.name}</span>
      </div>
      <p className="font-bold text-sm mt-1 text-slate-900 dark:text-white tabular-nums">
        {d.value} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">{d.value === 1 ? 'report' : 'reports'}</span>
      </p>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function Analytics() {
  const { reports } = useReports();
  // MANDATORY FLOW: Incident Report -> Geospatial -> Analytics
  // Analytics MUST ONLY compute from Geospatial verified data (verified by system users).
  const data = useMemo(
    () => (reports as AnalyticsReport[]).filter((r) => r.status === 'verified'),
    [reports]
  );

  // ── Filter state ────────────────────────────────────────────────────────
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [barangayFilter, setBarangayFilter] = useState('All Barangays');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [sourceFilter, setSourceFilter] = useState('All Sources');
  const [volumeRange, setVolumeRange] = useState<'7d' | '30d' | '3m'>('7d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 280);
    return () => clearTimeout(timer);
  }, []);

  // Click-to-filter from charts
  const [activeBarangay, setActiveBarangay] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<string | null>(null);
  const [typeViewMode, setTypeViewMode] = useState<'donut' | 'bar'>('donut');

  const allBarangays = useMemo(() => {
    const unique = Array.from(new Set(data.map(r => r.barangay).filter(Boolean))).sort();
    return ['All Barangays', ...unique];
  }, [data]);

  const allTypes = useMemo(() => {
    return ['All Types', 'Search & Rescue', 'Medical', 'Food & Water', 'Infrastructure'];
  }, []);

  const allSources = useMemo(() => ['All Sources', 'Bot', 'Scraper'], []);

  // Effective filters (header dropdowns override chart clicks)
  const effectiveBarangay = barangayFilter !== 'All Barangays' ? barangayFilter : activeBarangay;
  const effectiveType = typeFilter !== 'All Types' ? typeFilter : activeType;

  const getAnalyticsReportDate = (r: AnalyticsReport): string | null => {
    if (r.createdAt) {
      try {
        const d = new Date(r.createdAt);
        if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
      } catch {}
    }
    const p = parseReportTime(r.time);
    if (p) {
      const yyyy = new Date().getFullYear();
      const mm = String(p.month).padStart(2, '0');
      const dd = String(p.day).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }
    return null;
  };

  // ── Filtered data (used across KPI cards, volume chart, high-risk table, recommendations) ──
  const filtered = useMemo(() => {
    return data.filter(r => {
      if (effectiveBarangay && r.barangay?.toLowerCase() !== effectiveBarangay.toLowerCase()) return false;
      if (effectiveType && effectiveType !== 'All Types') {
        if (normalizeIncidentType(r.type) !== normalizeIncidentType(effectiveType)) return false;
      }
      if (sourceFilter !== 'All Sources' && !r.source?.toLowerCase().includes(sourceFilter.toLowerCase())) return false;
      if (fromDate) {
        const dStr = getAnalyticsReportDate(r);
        if (dStr && dStr < fromDate) return false;
      }
      if (toDate) {
        const dStr = getAnalyticsReportDate(r);
        if (dStr && dStr > toDate) return false;
      }
      return true;
    });
  }, [data, effectiveBarangay, effectiveType, sourceFilter, fromDate, toDate]);

  // Reports for Barangay Bar Chart: filtered by date, source, and incident type, but not self-filtered by effectiveBarangay
  const reportsForBarangayChart = useMemo(() => {
    return data.filter(r => {
      if (effectiveType && effectiveType !== 'All Types') {
        if (normalizeIncidentType(r.type) !== normalizeIncidentType(effectiveType)) return false;
      }
      if (sourceFilter !== 'All Sources' && !r.source?.toLowerCase().includes(sourceFilter.toLowerCase())) return false;
      if (fromDate) {
        const dStr = getAnalyticsReportDate(r);
        if (dStr && dStr < fromDate) return false;
      }
      if (toDate) {
        const dStr = getAnalyticsReportDate(r);
        if (dStr && dStr > toDate) return false;
      }
      return true;
    });
  }, [data, effectiveType, sourceFilter, fromDate, toDate]);

  // Reports for Incident Type Breakdown: filtered by date, source, and barangay, but not self-filtered by effectiveType
  const reportsForTypeChart = useMemo(() => {
    return data.filter(r => {
      if (effectiveBarangay && r.barangay?.toLowerCase() !== effectiveBarangay.toLowerCase()) return false;
      if (sourceFilter !== 'All Sources' && !r.source?.toLowerCase().includes(sourceFilter.toLowerCase())) return false;
      if (fromDate) {
        const dStr = getAnalyticsReportDate(r);
        if (dStr && dStr < fromDate) return false;
      }
      if (toDate) {
        const dStr = getAnalyticsReportDate(r);
        if (dStr && dStr > toDate) return false;
      }
      return true;
    });
  }, [data, effectiveBarangay, sourceFilter, fromDate, toDate]);

  // ── Stats ────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const today = new Date();
    const todayStr = `${today.getMonth() + 1}/${today.getDate()}`;
    const responseTimes = filtered.map(responseMinutes).filter((v): v is number => v !== null);
    return {
      total: filtered.length,
      high: filtered.filter(r => r.urgency === 'High').length,
      verified: filtered.filter(r => r.status === 'verified').length,
      resolvedToday: filtered.filter(r => {
        const p = parseReportTime(r.time);
        return p && `${p.month}/${p.day}` === todayStr && r.status === 'verified';
      }).length,
      incomplete: 0,
      bot: filtered.filter(r => r.source?.toLowerCase().includes('bot')).length,
      scraper: filtered.filter(r => r.source?.toLowerCase().includes('scraper')).length,
      avgResponse: responseTimes.length
        ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
        : 0,
    };
  }, [filtered]);

  // ── Donut & Bar chart data for Incident Types ──
  const typeChartData = useMemo(() => {
    const counts: Record<string, number> = {
      'Search & Rescue': 0,
      'Medical': 0,
      'Food & Water': 0,
      'Infrastructure': 0,
    };
    reportsForTypeChart.forEach(r => {
      const canonical = normalizeIncidentType(r.type);
      counts[canonical] = (counts[canonical] || 0) + 1;
    });
    return ['Search & Rescue', 'Medical', 'Food & Water', 'Infrastructure']
      .map(type => ({
        name: type,
        value: counts[type] || 0,
        color: TYPE_CONFIG[type]?.color ?? '#64748b',
      }));
  }, [reportsForTypeChart]);

  // ── Volume line chart ────────────────────────────────────────────────────
  const volumeChartData = useMemo(() => {
    const days = volumeRange === '7d' ? 7 : volumeRange === '30d' ? 30 : 90;
    const cutoff = daysBefore(days);
    const counts: Record<string, number> = {};
    const year = new Date().getFullYear();
    filtered.forEach(r => {
      const p = parseReportTime(r.time);
      if (p) {
        const d = new Date(year, p.month - 1, p.day);
        if (d >= cutoff) {
          const k = `${p.month}/${p.day}`;
          counts[k] = (counts[k] || 0) + 1;
        }
      }
    });
    return Object.entries(counts)
      .sort((a, b) => {
        const [am, ad] = a[0].split('/').map(Number);
        const [bm, bd] = b[0].split('/').map(Number);
        return am - bm || ad - bd;
      })
      .map(([date, count]) => ({ date, count }));
  }, [filtered, volumeRange]);

  // ── Risk table ───────────────────────────────────────────────────────────
  const riskData = useMemo(() => {
    const grouped: Record<string, { incidents: number; score: number; high: number; types: Record<string, number> }> = {};
    data.forEach(r => {
      const n = r.barangay || 'Unknown';
      if (!grouped[n]) grouped[n] = { incidents: 0, score: 0, high: 0, types: {} };
      grouped[n].incidents++;
      grouped[n].score += URGENCY_WEIGHT[r.urgency] || 1;
      if (r.urgency === 'High') grouped[n].high++;
      grouped[n].types[r.type] = (grouped[n].types[r.type] || 0) + 1;
    });
    return Object.entries(grouped)
      .map(([barangay, v]) => {
        const dominantType = Object.entries(v.types).sort((a, b) => b[1] - a[1])[0]?.[0] || 'General';
        return {
          barangay,
          ...v,
          dominantType,
          priority: v.high > 0 ? 'High' : v.score >= 4 ? 'Moderate' : 'Low',
        };
      })
      .sort((a, b) => b.score - a.score || b.incidents - a.incidents)
      .slice(0, 6);
  }, [data]);

  const recommendations = useMemo(() => riskData.slice(0, 3).map(item => {
    const resource = item.dominantType === 'Medical' ? 'medical response teams and ambulance support'
      : item.dominantType === 'Search & Rescue' ? 'search and rescue units with extraction equipment'
        : item.dominantType === 'Food & Water' ? 'relief food packs and potable water containers'
          : 'road-clearing crews and structural assessment engineers';
    return {
      ...item,
      text: `Pre-position ${resource} in ${item.barangay} based on ${item.incidents} recorded incident${item.incidents === 1 ? '' : 's'} and elevated urgency pattern.`,
    };
  }), [riskData]);

  // ── Actions ──────────────────────────────────────────────────────────────
  const exportCSV = useCallback(() => {
    const headers = ['Barangay', 'Incident Type', 'Urgency', 'Source', 'Status', 'Time'];
    const rows = filtered.map(r => [r.barangay, r.type, r.urgency, r.source, r.status, r.time]);
    const csv = [headers, ...rows].map(row => row.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `responde-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [filtered]);

  const downloadPDF = useCallback(() => {
    window.print();
  }, []);

  const resetFilters = () => {
    setBarangayFilter('All Barangays');
    setTypeFilter('All Types');
    setSourceFilter('All Sources');
    setFromDate('');
    setToDate('');
    setActiveBarangay(null);
    setActiveType(null);
  };

  const hasActiveFilters =
    barangayFilter !== 'All Barangays' ||
    typeFilter !== 'All Types' ||
    sourceFilter !== 'All Sources' ||
    Boolean(fromDate) ||
    Boolean(toDate) ||
    Boolean(activeBarangay) ||
    Boolean(activeType);

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) return <PageLoader variant="analytics" />;

  return (
    <div className="analytics-soft w-full">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full space-y-6 pb-0"
      >
          {/* ── 1. PAGE HEADER & FILTER BAR ── */}
          <motion.div variants={itemVariants} className="relative z-50">
            <SoftCard className="p-5 md:p-6 space-y-5 relative z-50">
              {/* Title and Primary Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-sky-400 border border-blue-500/20 flex items-center justify-center shrink-0">
                    <BarChart3 className="w-5 h-5" strokeWidth={1.75} />
                  </div>
                  <div>
                    <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                      Analytics
                    </h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Incident trends, response patterns, and prescriptive resource recommendations
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                  <button
                    type="button"
                    onClick={exportCSV}
                    className="inline-flex items-center gap-2 px-3.5 py-2 min-h-[40px] text-xs font-medium border border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 rounded-xl shadow-xs transition-all duration-150 active:scale-[0.98] cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" strokeWidth={1.75} />
                    <span>Export CSV</span>
                  </button>
                  <button
                    type="button"
                    onClick={downloadPDF}
                    className="inline-flex items-center gap-2 px-4 py-2 min-h-[40px] text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 rounded-xl shadow-xs transition-all duration-150 active:scale-[0.98] cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" strokeWidth={1.75} />
                    <span>Download PDF</span>
                  </button>
                </div>
              </div>

              {/* Filter Bar with DatePicker and FilterDropdown */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:flex-wrap lg:flex-nowrap items-stretch md:items-center justify-between gap-2.5 sm:gap-3 relative z-50">
                <div className="flex flex-wrap items-center gap-2.5 relative z-50">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium shrink-0 border border-slate-200/60 dark:border-slate-700/60">
                    <Filter className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400" strokeWidth={1.75} />
                    <span>Filters</span>
                  </div>

                  {/* Barangay DropDown */}
                  <FilterDropdown
                    value={barangayFilter}
                    options={allBarangays}
                    onChange={(val) => {
                      setBarangayFilter(val);
                      setActiveBarangay(null);
                    }}
                  />

                  {/* Type DropDown */}
                  <FilterDropdown
                    value={typeFilter}
                    options={allTypes}
                    onChange={(val) => {
                      setTypeFilter(val);
                      setActiveType(null);
                    }}
                  />

                  {/* Source DropDown */}
                  <FilterDropdown
                    value={sourceFilter}
                    options={allSources}
                    onChange={setSourceFilter}
                  />
                </div>

                {/* Date Pickers & Reset */}
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 sm:gap-3 md:ml-auto w-full md:w-auto relative z-40">
                  <div className="flex items-center gap-2 flex-1 sm:flex-initial min-w-[130px]">
                    <span className="text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 whitespace-nowrap">
                      From:
                    </span>
                    <DatePicker value={fromDate} onChange={setFromDate} placeholder="Select Date" />
                  </div>
                  <div className="flex items-center gap-2 flex-1 sm:flex-initial min-w-[130px]">
                    <span className="text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 whitespace-nowrap">
                      To:
                    </span>
                    <DatePicker value={toDate} onChange={setToDate} placeholder="Select Date" />
                  </div>

                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700/80 rounded-xl transition-all duration-150 active:scale-[0.98] cursor-pointer shrink-0 ml-auto sm:ml-0 border border-slate-200/60 dark:border-slate-700/60"
                      title="Reset all filters"
                    >
                      <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.75} />
                      <span>Reset</span>
                    </button>
                  )}
                </div>
              </div>
            </SoftCard>
          </motion.div>

          {data.length === 0 && (
            <motion.div variants={itemVariants} className="relative z-10">
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs font-medium flex items-center gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" strokeWidth={1.75} />
                <span>
                  Geospatial has 0 verified reports. Analytics is currently showing empty states (0). Incoming citizen reports in the Incident Reports triage queue will appear here dynamically once verified by an officer.
                </span>
              </div>
            </motion.div>
          )}

          {/* ── 2. 4-STAT SOFT METRIC CARDS ── */}
          <motion.div variants={itemVariants} className="relative z-10">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
              {[
                {
                  icon: Layers,
                  iconColor: '#2563EB',
                  iconBg: 'rgba(37,99,235,0.1)',
                  value: stats.total,
                  label: 'Total Reports',
                  desc: 'Across all streams',
                },
                {
                  icon: AlertTriangle,
                  iconColor: '#EF4444',
                  iconBg: 'rgba(239,68,68,0.1)',
                  value: stats.high,
                  label: 'High Urgency',
                  desc: 'Immediate dispatch',
                },
                {
                  icon: CheckCircle2,
                  iconColor: '#10B981',
                  iconBg: 'rgba(16,185,129,0.1)',
                  value: stats.verified,
                  label: 'Verified Reports',
                  desc: 'Confirmed on field',
                },
                {
                  icon: XCircle,
                  iconColor: '#F59E0B',
                  iconBg: 'rgba(245,158,11,0.1)',
                  value: stats.incomplete,
                  label: 'Pending Review',
                  desc: 'Under triage',
                },
              ].map(({ icon: Icon, iconColor, iconBg, value, label, desc }) => (
                <SoftCard
                  key={label}
                  className="p-3.5 sm:p-5 flex flex-col justify-between hover:-translate-y-0.5 transition-all duration-300"
                >
                  <div className="flex items-center justify-between gap-2 mb-2 sm:mb-3">
                    <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
                      {label}
                    </p>
                    <div
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl border flex items-center justify-center shrink-0"
                      style={{ background: iconBg, borderColor: `${iconColor}25`, color: iconColor }}
                    >
                      <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" strokeWidth={1.75} />
                    </div>
                  </div>
                  <div>
                    <p className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums leading-none">
                      {value}
                    </p>
                    <p className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 mt-1.5 sm:mt-2 font-medium truncate">
                      {desc}
                    </p>
                  </div>
                </SoftCard>
              ))}
            </div>
          </motion.div>

          {/* ── 3. ROW: BARANGAY BAR + DONUT ── */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 relative z-10">
            {/* Incident Frequency per Barangay */}
            <motion.div variants={itemVariants} className="h-full">
              <BarangayBarChart
                interactive={true}
                activeBarangay={activeBarangay}
                onSelectBarangay={(b) => {
                  setActiveBarangay(b);
                  setBarangayFilter('All Barangays');
                }}
                reports={reportsForBarangayChart}
                className="h-full"
              />
            </motion.div>

            {/* Breakdown by Incident Type */}
            <motion.div variants={itemVariants} className="h-full">
              <SoftCard className="p-6 h-full flex flex-col">
                <SectionHeader
                  icon={PieChartIcon}
                  title="Breakdown by Incident Type"
                  description="Click any category to filter the entire view by disaster type"
                  iconColor="#8B5CF6"
                  badge={
                    <div className="flex items-center gap-2">
                      {activeType && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 text-xs font-semibold">
                          <span>Filtered: {activeType}</span>
                          <button
                            type="button"
                            onClick={() => setActiveType(null)}
                            className="hover:opacity-75 transition-opacity cursor-pointer p-0.5"
                          >
                            <X className="w-3 h-3" strokeWidth={2} />
                          </button>
                        </div>
                      )}
                      <div className="inline-flex items-center p-0.5 bg-slate-100 dark:bg-slate-800/90 rounded-lg border border-slate-200/60 dark:border-white/5">
                        <button
                          type="button"
                          onClick={() => setTypeViewMode('donut')}
                          className={`p-1 rounded-md transition-all cursor-pointer ${
                            typeViewMode === 'donut'
                              ? 'bg-white dark:bg-slate-700 text-[#8B5CF6] dark:text-purple-400 shadow-2xs'
                              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                          }`}
                          title="Donut chart view"
                        >
                          <PieChartIcon className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setTypeViewMode('bar')}
                          className={`p-1 rounded-md transition-all cursor-pointer ${
                            typeViewMode === 'bar'
                              ? 'bg-white dark:bg-slate-700 text-[#8B5CF6] dark:text-purple-400 shadow-2xs'
                              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                          }`}
                          title="Bar chart view"
                        >
                          <BarChart3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  }
                />

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center flex-1">
                  {/* Chart Graphic (Donut or Bar view) */}
                  <div className="sm:col-span-5 relative flex items-center justify-center" style={{ height: 220 }}>
                    {typeChartData.some(d => d.value > 0) ? (
                      typeViewMode === 'bar' ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={typeChartData}
                            margin={{ top: 12, right: 8, left: -24, bottom: 20 }}
                            onClick={(state: any) => {
                              if (state && state.activePayload && state.activePayload.length > 0) {
                                const clicked = state.activePayload[0].payload.name;
                                setActiveType(prev => (prev === clicked ? null : clicked));
                                setTypeFilter('All Types');
                              }
                            }}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              vertical={false}
                              stroke="currentColor"
                              className="text-slate-200/50 dark:text-slate-800/60"
                            />
                            <XAxis
                              dataKey="name"
                              tick={{ fontSize: 9.5, fill: '#94a3b8' }}
                              axisLine={{ stroke: '#94a3b8', strokeOpacity: 0.2 }}
                              tickLine={false}
                              interval={0}
                              angle={-15}
                              textAnchor="end"
                              tickFormatter={(val) =>
                                val === 'Search & Rescue'
                                  ? 'S&R'
                                  : val === 'Food & Water'
                                  ? 'F&W'
                                  : val === 'Infrastructure'
                                  ? 'Infra'
                                  : val
                              }
                            />
                            <YAxis
                              allowDecimals={false}
                              tick={{ fontSize: 9.5, fill: '#94a3b8' }}
                              axisLine={false}
                              tickLine={false}
                              width={28}
                            />
                            <Tooltip content={<PieTooltip />} cursor={{ fill: 'rgba(139,92,246,0.06)' }} />
                            <Bar dataKey="value" radius={[5, 5, 0, 0]} cursor="pointer">
                              {typeChartData.map((entry) => (
                                <Cell
                                  key={entry.name}
                                  fill={entry.color}
                                  opacity={activeType && activeType !== entry.name ? 0.3 : 1}
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Tooltip content={<PieTooltip />} />
                            <Pie
                              data={typeChartData.filter(d => d.value > 0)}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              innerRadius={54}
                              outerRadius={78}
                              paddingAngle={4}
                              cornerRadius={4}
                              cursor="pointer"
                              onClick={(d: { name?: string }) => {
                                if (!d?.name) return;
                                setActiveType(prev => (prev === d.name ? null : (d.name ?? null)));
                                setTypeFilter('All Types');
                              }}
                            >
                              {typeChartData.filter(d => d.value > 0).map((entry) => (
                                <Cell
                                  key={entry.name}
                                  fill={entry.color}
                                  opacity={activeType && activeType !== entry.name ? 0.3 : 1}
                                />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                      )
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 text-xs">
                        <PieChartIcon className="w-8 h-8 stroke-[1.5] text-slate-300 dark:text-slate-600 mb-1" />
                        <span className="text-[11px]">No verified incidents</span>
                      </div>
                    )}
                    {typeViewMode === 'donut' && typeChartData.some(d => d.value > 0) && (
                      <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
                          {activeType ? (typeChartData.find(d => d.name === activeType)?.value ?? 0) : reportsForTypeChart.length}
                        </span>
                        <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-widest mt-0.5 max-w-[90px] truncate text-center">
                          {activeType ? activeType : 'Total'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Legend with interactive buttons */}
                  <div className="sm:col-span-7 space-y-2">
                    {['Search & Rescue', 'Medical', 'Food & Water', 'Infrastructure'].map(type => {
                      const c = TYPE_CONFIG[type];
                      const Icon = c.icon;
                      const count = typeChartData.find(d => d.name === type)?.value ?? 0;
                      const totalTypeReports = reportsForTypeChart.length;
                      const pct = totalTypeReports > 0 ? Math.round((count / totalTypeReports) * 100) : 0;
                      const isActive = activeType === type;
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => {
                            setActiveType(prev => (prev === type ? null : type));
                            setTypeFilter('All Types');
                          }}
                          className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-150 text-left active:scale-[0.98] border cursor-pointer ${
                            isActive
                              ? 'bg-slate-100/90 dark:bg-slate-800/90 border-slate-300 dark:border-slate-600 ring-2'
                              : 'bg-white/60 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-800/80'
                          }`}
                          style={isActive ? ({ '--tw-ring-color': c.color } as React.CSSProperties) : {}}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border"
                              style={{ background: c.bg, borderColor: `${c.color}25` }}
                            >
                              <Icon className={`w-4 h-4 ${c.iconClass}`} strokeWidth={1.75} />
                            </div>
                            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                              {type}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">
                              {count}
                            </span>
                            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                              ({pct}%)
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </SoftCard>
            </motion.div>
          </div>

          {/* ── 4. INCIDENT VOLUME TIME-SERIES ── */}
          <motion.div variants={itemVariants} className="relative z-10">
            <SoftCard className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <SectionHeader
                  icon={TrendingUp}
                  title="Incident Volume Over Time"
                  description="Daily incident intake volume and rate of submissions"
                  iconColor="#2563EB"
                />

                {/* Soft Segmented Control */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl shrink-0 border border-slate-200/60 dark:border-slate-700/60 self-start sm:self-auto">
                  {(['7d', '30d', '3m'] as const).map((r) => {
                    const isActive = volumeRange === r;
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setVolumeRange(r)}
                        className={`relative px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 cursor-pointer active:scale-[0.98] ${
                          isActive
                            ? 'bg-white text-slate-900 dark:bg-slate-700 dark:text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <span>
                          {r === '7d' ? 'Last 7 Days' : r === '30d' ? 'Last 30 Days' : 'Last 3 Months'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {volumeChartData.length ? (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={volumeChartData} margin={{ top: 12, right: 12, left: -24, bottom: 0 }}>
                      <defs>
                        <linearGradient id="softBlueGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="currentColor"
                        className="text-slate-200/50 dark:text-slate-800/60"
                      />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11, fill: '#94a3b8' }}
                        axisLine={{ stroke: '#94a3b8', strokeOpacity: 0.2 }}
                        tickLine={false}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 11, fill: '#94a3b8' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip content={<VolumeTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="count"
                        stroke="#2563EB"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#softBlueGradient)"
                        dot={{ r: 3, fill: '#2563EB', strokeWidth: 1.5, stroke: '#fff' }}
                        activeDot={{ r: 5, fill: '#2563EB', stroke: '#fff', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-500 text-xs gap-2">
                  <TrendingUp className="w-8 h-8 stroke-[1.5] text-slate-300 dark:text-slate-600" />
                  <span>No time-series reports recorded for the chosen timeframe.</span>
                </div>
              )}
            </SoftCard>
          </motion.div>

          {/* ── 5. SOURCE CHANNELS BREAKDOWN ── */}
          <motion.div variants={itemVariants} className="relative z-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                {
                  icon: Bot,
                  label: 'Messenger Chatbot',
                  count: stats.bot,
                  desc: 'Direct citizen conversational submissions',
                  bg: 'bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
                  barColor: 'bg-indigo-600',
                },
                {
                  icon: Globe2,
                  label: 'Social Media Scraper',
                  count: stats.scraper,
                  desc: 'AI-mined community social feeds and groups',
                  bg: 'bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 border-sky-500/20',
                  barColor: 'bg-sky-500',
                },
              ].map(({ icon: Icon, label, count, desc, bg, barColor }) => {
                const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                return (
                  <SoftCard key={label} className="p-6 flex items-center gap-5">
                    <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center shrink-0 ${bg}`}>
                      <Icon className="w-7 h-7" strokeWidth={1.75} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        {label}
                      </p>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
                          {count}
                        </span>
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                          {pct}% of total intake
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">{desc}</p>
                      {/* Recessed Progress Track */}
                      <div className="mt-3.5 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200/40 dark:border-slate-700/40">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                          className={`h-full rounded-full ${barColor}`}
                        />
                      </div>
                    </div>
                  </SoftCard>
                );
              })}
            </div>
          </motion.div>

          {/* ── 6. HIGH-RISK BARANGAYS RANKING (Calm, Non-Glaring Table) ── */}
          <motion.div variants={itemVariants} className="relative z-10">
            <SoftCard className="p-6 h-full flex flex-col">
              <SectionHeader
                icon={AlertTriangle}
                title="High-Risk Barangays"
                description="Priority ranking determined by cumulative volume & urgency score"
                iconColor="#EF4444"
              />
              <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/40">
                <table className="w-full min-w-[500px] text-xs sm:text-sm text-left border-collapse">
                  <thead className="bg-slate-50/75 dark:bg-slate-800/40 border-b border-slate-200/70 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-4 text-[11px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        Barangay
                      </th>
                      <th className="py-3 px-3 text-center text-[11px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        Reports
                      </th>
                      <th className="py-3 px-3 text-center text-[11px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        High Urgency
                      </th>
                      <th className="py-3 px-3 text-center text-[11px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        Priority
                      </th>
                      <th className="py-3 px-4 text-[11px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        Dominant Need
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {riskData.length > 0 ? (
                      riskData.map((item) => (
                        <tr
                          key={item.barangay}
                          className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors duration-150"
                        >
                          <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                            {item.barangay}
                          </td>
                          <td className="py-3 px-3 text-center text-slate-600 dark:text-slate-300 font-mono tabular-nums whitespace-nowrap">
                            {item.incidents}
                          </td>
                          <td className="py-3 px-3 text-center font-bold text-rose-600 dark:text-rose-400 font-mono tabular-nums whitespace-nowrap">
                            {item.high}
                          </td>
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
                              <span
                                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                  item.priority === 'High'
                                    ? 'bg-rose-500'
                                    : item.priority === 'Moderate'
                                    ? 'bg-amber-500'
                                    : 'bg-emerald-500'
                                }`}
                              />
                              <span>{item.priority}</span>
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-400 font-medium whitespace-nowrap">
                            {item.dominantType}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
                          No verified geospatial risk data recorded yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </SoftCard>
          </motion.div>

          {/* ── 7. PRESCRIPTIVE RECOMMENDATIONS ── */}
          <motion.div variants={itemVariants} className="relative z-10">
            <SoftCard className="p-6">
              <SectionHeader
                icon={Lightbulb}
                title="Prescriptive Action Recommendations"
                description="Automated resource pre-positioning intelligence based on real-time incident density"
                iconColor="#F59E0B"
              />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {recommendations.map((item) => (
                  <div
                    key={item.barangay}
                    className="rounded-xl border border-slate-200/80 dark:border-slate-800 p-5 bg-white/50 dark:bg-slate-900/40 hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <MapPin className="w-4 h-4 text-blue-600 dark:text-sky-400 shrink-0" strokeWidth={1.75} />
                          <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                            {item.barangay}
                          </span>
                        </div>
                        <span className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-slate-200/60 dark:border-slate-700/60 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-medium">
                          <span
                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                              item.priority === 'High'
                                ? 'bg-rose-500'
                                : item.priority === 'Moderate'
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                          />
                          <span>{item.priority} Urgency</span>
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                        {item.text}
                      </p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="font-medium text-slate-500 dark:text-slate-400">
                        Dominant: {item.dominantType}
                      </span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300 font-mono">
                        {item.incidents} {item.incidents === 1 ? 'event' : 'events'}
                      </span>
                    </div>
                  </div>
                ))}
                {!recommendations.length && (
                  <div className="lg:col-span-3 text-center py-10 text-xs text-slate-400">
                    Prescriptive dispatch recommendations will populate dynamically as reports are verified.
                  </div>
                )}
              </div>
            </SoftCard>
          </motion.div>
        </motion.div>
      </div>
  );
}
