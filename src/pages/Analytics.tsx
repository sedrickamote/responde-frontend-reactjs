import { useState, useMemo, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
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
  CalendarDays,
  Bot,
  Globe2,
  Clock3,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { StaggerContainer, StaggerItem } from '../components/Stagger';
import { useReports } from '../context/ReportsContext';

// ── Types ───────────────────────────────────────────────────────────────────
type AnalyticsReport = {
  id: string;
  barangay: string;
  type: string;
  urgency: string;
  source: string;
  time: string;
  status: string;
  verifiedAt?: string | null;
};

// ── Design tokens ────────────────────────────────────────────────────────────
const RED = '#B71C1C';
const RED_LIGHT = '#EF5350';

const TYPE_CONFIG: Record<
  string,
  { icon: LucideIcon; iconClass: string; color: string }
> = {
  'Search & Rescue': { icon: Siren, iconClass: 'text-orange-500', color: '#f97316' },
  Medical: { icon: HeartPulse, iconClass: 'text-blue-500', color: '#3b82f6' },
  'Food & Water': { icon: Droplets, iconClass: 'text-emerald-500', color: '#10b981' },
  Infrastructure: { icon: HardHat, iconClass: 'text-purple-500', color: '#a855f7' },
};

const URGENCY_BAR_COLOR: Record<string, string> = {
  High: RED,
  Moderate: '#F59E0B',
  Low: '#10B981',
};

const URGENCY_CLASS: Record<string, string> = {
  High: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
  Moderate: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800',
  Low: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
};

const URGENCY_WEIGHT: Record<string, number> = { High: 3, Moderate: 2, Low: 1 };

// ── Helpers ──────────────────────────────────────────────────────────────────
function parseReportTime(value: string) {
  const m = String(value || '').match(/^(\d{1,2})\/(\d{1,2})\s+(\d{1,2}):(\d{2})$/);
  return m ? { month: +m[1], day: +m[2], hour: +m[3], minute: +m[4] } : null;
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

// ── Shared Card ──────────────────────────────────────────────────────────────
function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-[0_4px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.35)] ${className}`}>
      {children}
    </div>
  );
}

function SectionHeader({ icon: Icon, title, description }: {
  icon: LucideIcon; title: string; description?: string;
}) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${RED}18` }}>
        <Icon className="w-4 h-4" style={{ color: RED }} />
      </div>
      <div>
        <h3 className="font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
        {description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>}
      </div>
    </div>
  );
}

// ── Custom Tooltips ───────────────────────────────────────────────────────────
interface TooltipPayloadItem { value?: number | string; name?: string; color?: string; payload?: Record<string, unknown>; }
interface CTP { active?: boolean; payload?: TooltipPayloadItem[]; label?: string | number; }

function VolumeTooltip({ active, payload, label }: CTP) {
  if (!active || !payload?.length) return null;
  const val = Number(payload[0]?.value ?? 0);
  return (
    <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl shadow-xl text-xs">
      <p className="font-semibold text-slate-700 dark:text-slate-200">{label}</p>
      <p className="font-bold mt-0.5" style={{ color: RED_LIGHT }}>{val} {val === 1 ? 'incident' : 'incidents'}</p>
    </div>
  );
}

function BarangayTooltip({ active, payload }: CTP) {
  if (!active || !payload?.length) return null;
  const item = payload[0]?.payload as { name?: string; count?: number; dominantUrgency?: string } | undefined;
  if (!item) return null;
  return (
    <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl shadow-xl text-xs">
      <p className="font-semibold text-slate-700 dark:text-slate-200">{item.name}</p>
      <p className="font-bold mt-0.5" style={{ color: URGENCY_BAR_COLOR[item.dominantUrgency ?? ''] ?? RED }}>{item.count} {item.count === 1 ? 'report' : 'reports'}</p>
    </div>
  );
}

function PieTooltip({ active, payload }: CTP) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload as { name?: string; value?: number; color?: string } | undefined;
  if (!d) return null;
  return (
    <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl shadow-xl text-xs">
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
        <span className="font-semibold text-slate-700 dark:text-slate-200">{d.name}</span>
      </div>
      <p className="font-bold mt-1" style={{ color: d.color }}>{d.value} {d.value === 1 ? 'report' : 'reports'}</p>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function Analytics() {
  const { reports } = useReports();
  const data = reports as AnalyticsReport[];

  // ── Filter state ────────────────────────────────────────────────────────
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [barangayFilter, setBarangayFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [sourceFilter, setSourceFilter] = useState('All');
  const [volumeRange, setVolumeRange] = useState<'7d' | '30d' | '3m'>('7d');

  // Click-to-filter from charts
  const [activeBarangay, setActiveBarangay] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<string | null>(null);

  const allBarangays = useMemo(() => ['All', ...Array.from(new Set(data.map(r => r.barangay))).sort()], [data]);
  const allTypes = useMemo(() => ['All', 'Search & Rescue', 'Medical', 'Food & Water', 'Infrastructure'], []);
  const allSources = ['All', 'Bot', 'Scraper'];

  // Effective filters (header dropdowns override chart clicks)
  const effectiveBarangay = barangayFilter !== 'All' ? barangayFilter : activeBarangay;
  const effectiveType = typeFilter !== 'All' ? typeFilter : activeType;

  // ── Filtered data ────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return data.filter(r => {
      if (effectiveBarangay && r.barangay !== effectiveBarangay) return false;
      if (effectiveType && r.type !== effectiveType) return false;
      if (sourceFilter !== 'All' && !r.source?.toLowerCase().includes(sourceFilter.toLowerCase())) return false;
      if (fromDate) {
        const p = parseReportTime(r.time);
        if (p) { const d = new Date(new Date().getFullYear(), p.month - 1, p.day); if (d < new Date(fromDate)) return false; }
      }
      if (toDate) {
        const p = parseReportTime(r.time);
        if (p) { const d = new Date(new Date().getFullYear(), p.month - 1, p.day); if (d > new Date(toDate)) return false; }
      }
      return true;
    });
  }, [data, effectiveBarangay, effectiveType, sourceFilter, fromDate, toDate]);

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
      incomplete: filtered.filter(r => r.status === 'under_review' || r.status === 'pending').length,
      bot: filtered.filter(r => r.source?.toLowerCase().includes('bot')).length,
      scraper: filtered.filter(r => r.source?.toLowerCase().includes('scraper')).length,
      avgResponse: responseTimes.length
        ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
        : 0,
    };
  }, [filtered]);

  // ── Barangay bar chart ───────────────────────────────────────────────────
  const barangayChartData = useMemo(() => {
    const grouped: Record<string, { count: number; urgencyCounts: Record<string, number> }> = {};
    filtered.forEach(r => {
      const n = r.barangay || 'Unknown';
      if (!grouped[n]) grouped[n] = { count: 0, urgencyCounts: {} };
      grouped[n].count++;
      grouped[n].urgencyCounts[r.urgency] = (grouped[n].urgencyCounts[r.urgency] || 0) + 1;
    });
    return Object.entries(grouped)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 8)
      .map(([name, v]) => {
        const dominantUrgency = Object.entries(v.urgencyCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Low';
        return { name, count: v.count, dominantUrgency };
      });
  }, [filtered]);

  // ── Donut chart ──────────────────────────────────────────────────────────
  const typeChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered.forEach(r => { counts[r.type] = (counts[r.type] || 0) + 1; });
    return ['Search & Rescue', 'Medical', 'Food & Water', 'Infrastructure']
      .map(type => ({ name: type, value: counts[type] || 0, color: TYPE_CONFIG[type]?.color ?? '#64748b' }))
      .filter(d => d.value > 0);
  }, [filtered]);

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
        return { barangay, ...v, dominantType, priority: v.high > 0 ? 'High' : v.score >= 4 ? 'Moderate' : 'Low' };
      })
      .sort((a, b) => b.score - a.score || b.incidents - a.incidents)
      .slice(0, 6);
  }, [data]);

  const recommendations = useMemo(() => riskData.slice(0, 3).map(item => {
    const resource = item.dominantType === 'Medical' ? 'medical response teams and ambulance support'
      : item.dominantType === 'Search & Rescue' ? 'search and rescue teams and rescue equipment'
        : item.dominantType === 'Food & Water' ? 'food, water, and relief supplies'
          : 'clearing and infrastructure assessment teams';
    return { ...item, text: `Pre-position ${resource} in ${item.barangay} based on ${item.incidents} recorded incident${item.incidents === 1 ? '' : 's'} and its urgency pattern.` };
  }), [riskData]);

  // ── Actions ──────────────────────────────────────────────────────────────
  const exportCSV = useCallback(() => {
    const headers = ['Barangay', 'Incident Type', 'Urgency', 'Source', 'Status', 'Time'];
    const rows = filtered.map(r => [r.barangay, r.type, r.urgency, r.source, r.status, r.time]);
    const csv = [headers, ...rows].map(row => row.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'responde-analytics-report.csv';
    link.click();
    URL.revokeObjectURL(url);
  }, [filtered]);

  const downloadPDF = useCallback(() => {
    window.print();
  }, []);

  const resetFilters = () => {
    setBarangayFilter('All'); setTypeFilter('All'); setSourceFilter('All');
    setFromDate(''); setToDate(''); setActiveBarangay(null); setActiveType(null);
  };

  const hasActiveFilters = barangayFilter !== 'All' || typeFilter !== 'All' || sourceFilter !== 'All' || fromDate || toDate || activeBarangay || activeType;

  // ── Shared select className ───────────────────────────────────────────────
  const selectCls = "text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#B71C1C]/30 transition-all duration-150 cursor-pointer";
  const inputCls = "text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#B71C1C]/30 transition-all duration-150";

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <StaggerContainer className="w-full space-y-5 overflow-x-hidden pb-6">

      {/* ── PAGE HEADER ── */}
      <StaggerItem>
        <Card className="p-5">
          {/* Title row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${RED}18` }}>
                <BarChart3 className="w-5 h-5" style={{ color: RED }} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Analytics</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Incident trends, response patterns, and resource recommendations</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <button
                onClick={exportCSV}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-150 active:scale-[0.97]"
              >
                <Download className="w-4 h-4" /> Export CSV
              </button>
              <button
                onClick={downloadPDF}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-xl shadow-sm transition-all duration-150 active:scale-[0.97]"
                style={{ background: RED }}
                onMouseEnter={e => (e.currentTarget.style.background = '#c62828')}
                onMouseLeave={e => (e.currentTarget.style.background = RED)}
              >
                <FileText className="w-4 h-4" /> Download PDF
              </button>
            </div>
          </div>

          {/* Filter row */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">From</span>
              <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className={inputCls} />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500 dark:text-slate-400">To</span>
              <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className={inputCls} />
            </div>

            <select value={barangayFilter} onChange={e => { setBarangayFilter(e.target.value); setActiveBarangay(null); }} className={selectCls}>
              {allBarangays.map(b => <option key={b} value={b}>{b === 'All' ? 'All Barangays' : b}</option>)}
            </select>

            <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setActiveType(null); }} className={selectCls}>
              {allTypes.map(t => <option key={t} value={t}>{t === 'All' ? 'All Types' : t}</option>)}
            </select>

            <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)} className={selectCls}>
              {allSources.map(s => <option key={s} value={s}>{s === 'All' ? 'All Sources' : s}</option>)}
            </select>

            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 underline transition-colors duration-150"
              >
                Clear filters
              </button>
            )}
          </div>
        </Card>
      </StaggerItem>

      {/* ── 5-STAT BANNER ── */}
      <StaggerItem>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
          {[
            { icon: AlertTriangle, bg: 'bg-red-50 dark:bg-red-900/20', fg: 'text-red-600 dark:text-red-400', value: stats.total, label: 'Total Reports' },
            { icon: TrendingUp, bg: 'bg-orange-50 dark:bg-orange-900/20', fg: 'text-orange-600 dark:text-orange-400', value: stats.high, label: 'High Urgency' },
            { icon: CheckCircle2, bg: 'bg-emerald-50 dark:bg-emerald-900/20', fg: 'text-emerald-600 dark:text-emerald-400', value: stats.verified, label: 'Verified Reports' },
            { icon: Clock3, bg: 'bg-blue-50 dark:bg-blue-900/20', fg: 'text-blue-600 dark:text-blue-400', value: stats.resolvedToday, label: 'Resolved Today' },
            { icon: XCircle, bg: 'bg-slate-50 dark:bg-slate-800', fg: 'text-slate-600 dark:text-slate-400', value: stats.incomplete, label: 'Incomplete' },
          ].map(({ icon: Icon, bg, fg, value, label }) => (
            <Card key={label} className="p-5">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-5 h-5 ${fg}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 leading-none">{value}</p>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-1 leading-tight">{label}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </StaggerItem>

      {/* ── ROW: BARANGAY BAR + DONUT ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

        {/* Incident Frequency per Barangay — vertical bar chart */}
        <StaggerItem>
          <Card className="p-6 h-full flex flex-col">
            <SectionHeader icon={MapPin} title="Incident Frequency per Barangay" description="Click a bar to filter all charts by that barangay" />
            {activeBarangay && (
              <div className="mb-3 flex items-center gap-2">
                <span className="text-xs font-medium text-white px-2.5 py-1 rounded-lg" style={{ background: RED }}>
                  Filtered: {activeBarangay}
                </span>
                <button onClick={() => setActiveBarangay(null)} className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 underline transition-colors">Clear</button>
              </div>
            )}
            {barangayChartData.length ? (
              <div className="w-full flex-1" style={{ minHeight: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barangayChartData} margin={{ top: 5, right: 16, left: -10, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200/60 dark:text-slate-700/60" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10, fill: '#94a3b8' }}
                      axisLine={{ stroke: '#94a3b8', strokeOpacity: 0.3 }}
                      tickLine={false}
                      angle={-35}
                      textAnchor="end"
                      interval={0}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<BarangayTooltip />} cursor={{ fill: 'rgba(183,28,28,0.06)' }} />
                    <Bar
                      dataKey="count"
                      radius={[4, 4, 0, 0]}
                      barSize={28}
                      cursor="pointer"
                      onClick={(d: { name?: string }) => {
                        if (!d?.name) return;
                        setActiveBarangay(prev => prev === d.name ? null : (d.name ?? null));
                        setBarangayFilter('All');
                      }}
                    >
                      {barangayChartData.map(entry => (
                        <Cell
                          key={entry.name}
                          fill={URGENCY_BAR_COLOR[entry.dominantUrgency] ?? RED}
                          opacity={activeBarangay && activeBarangay !== entry.name ? 0.35 : 1}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-slate-400 py-12 text-center my-auto">No incident data available.</p>
            )}
            {/* Urgency color legend */}
            <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60">
              {Object.entries(URGENCY_BAR_COLOR).map(([level, color]) => (
                <div key={level} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ background: color }} />
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{level}</span>
                </div>
              ))}
            </div>
          </Card>
        </StaggerItem>

        {/* Breakdown by Incident Type — donut */}
        <StaggerItem>
          <Card className="p-6 h-full flex flex-col">
            <SectionHeader icon={BarChart3} title="Breakdown by Incident Type" description="Click a segment to filter all charts by that type" />
            {activeType && (
              <div className="mb-3 flex items-center gap-2">
                <span className="text-xs font-medium text-white px-2.5 py-1 rounded-lg" style={{ background: TYPE_CONFIG[activeType]?.color ?? RED }}>
                  Filtered: {activeType}
                </span>
                <button onClick={() => setActiveType(null)} className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 underline transition-colors">Clear</button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center flex-1">
              {/* Donut */}
              <div className="sm:col-span-5 relative flex items-center justify-center" style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip content={<PieTooltip />} />
                    <Pie
                      data={typeChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%" cy="50%"
                      innerRadius={52} outerRadius={76}
                      paddingAngle={3}
                      cursor="pointer"
                      onClick={(d: { name?: string }) => {
                        if (!d?.name) return;
                        setActiveType(prev => prev === d.name ? null : (d.name ?? null));
                        setTypeFilter('All');
                      }}
                    >
                      {typeChartData.map(entry => (
                        <Cell
                          key={entry.name}
                          fill={entry.color}
                          opacity={activeType && activeType !== entry.name ? 0.3 : 1}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">{stats.total}</span>
                  <span className="text-[9px] uppercase font-semibold text-slate-400 tracking-widest">Total</span>
                </div>
              </div>

              {/* Legend */}
              <div className="sm:col-span-7 space-y-2.5">
                {['Search & Rescue', 'Medical', 'Food & Water', 'Infrastructure'].map(type => {
                  const c = TYPE_CONFIG[type];
                  const Icon = c.icon;
                  const count = typeChartData.find(d => d.name === type)?.value ?? 0;
                  const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                  const isActive = activeType === type;
                  return (
                    <button
                      key={type}
                      onClick={() => { setActiveType(prev => prev === type ? null : type); setTypeFilter('All'); }}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all duration-150 text-left active:scale-[0.97] ${isActive ? 'ring-2' : 'ring-0 hover:bg-slate-50 dark:hover:bg-slate-800/40'}`}
                      style={{ '--tw-ring-color': c.color, background: isActive ? `${c.color}12` : undefined } as React.CSSProperties}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${c.color}18` }}>
                          <Icon className={`w-3.5 h-3.5 ${c.iconClass}`} />
                        </div>
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-200">{type}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{count}</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">({pct}%)</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </Card>
        </StaggerItem>
      </div>

      {/* ── VOLUME LINE CHART ── */}
      <StaggerItem>
        <Card className="p-6">
          <div className="flex items-start justify-between gap-4 mb-5">
            <SectionHeader icon={TrendingUp} title="Incident Volume Over Time" description="Daily incident submission count" />
            {/* Range toggle */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 shrink-0">
              {(['7d', '30d', '3m'] as const).map(r => (
                <button
                  key={r}
                  onClick={() => setVolumeRange(r)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 active:scale-[0.97] ${volumeRange === r ? 'text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                  style={volumeRange === r ? { background: RED } : {}}
                >
                  {r === '7d' ? 'Last 7 Days' : r === '30d' ? 'Last 30 Days' : 'Last 3 Months'}
                </button>
              ))}
            </div>
          </div>
          {volumeChartData.length ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={volumeChartData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="redGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={RED} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={RED} stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200/60 dark:text-slate-700/60" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={{ stroke: '#94a3b8', strokeOpacity: 0.3 }} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<VolumeTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke={RED}
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: RED, strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, fill: RED_LIGHT, stroke: '#fff', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-slate-400 py-10 text-center">No time-series data for the selected range.</p>
          )}
        </Card>
      </StaggerItem>

      {/* ── SOURCE BREAKDOWN ── */}
      <StaggerItem>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {[
            {
              icon: Bot,
              label: 'Bot Reports',
              count: stats.bot,
              desc: 'Submitted via Messenger chatbot',
              bg: 'bg-violet-50 dark:bg-violet-900/20',
              fg: 'text-violet-600 dark:text-violet-400',
              ring: '#7c3aed',
            },
            {
              icon: Globe2,
              label: 'Scraper Reports',
              count: stats.scraper,
              desc: 'Collected from social media feeds',
              bg: 'bg-sky-50 dark:bg-sky-900/20',
              fg: 'text-sky-600 dark:text-sky-400',
              ring: '#0284c7',
            },
          ].map(({ icon: Icon, label, count, desc, bg, fg, ring }) => {
            const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
            return (
              <Card key={label} className="p-6 flex items-center gap-5">
                <div className={`w-14 h-14 rounded-2xl ${bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-7 h-7 ${fg}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl font-bold text-slate-800 dark:text-slate-100">{count}</span>
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{pct}% of total</span>
                  </div>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{desc}</p>
                  {/* Progress bar */}
                  <div className="mt-3 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: ring }} />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </StaggerItem>

      {/* ── HIGH-RISK TABLE + RESPONSE TIME ── */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        <StaggerItem className="xl:col-span-2">
          <Card className="p-6 h-full">
            <SectionHeader icon={Clock3} title="Avg. Response Time per Barangay" description="Based on verified reports" />
            <div className="space-y-2.5">
              {riskData.map(item => {
                const times = data.filter(r => r.barangay === item.barangay).map(responseMinutes).filter((v): v is number => v !== null);
                const avg = times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : null;
                return (
                  <div key={item.barangay} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                    <div className="flex items-center gap-2 min-w-0">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{item.barangay}</span>
                    </div>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200 shrink-0 ml-2">{avg !== null ? `${avg}m` : '—'}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        </StaggerItem>

        <StaggerItem className="xl:col-span-3">
          <Card className="p-6 h-full">
            <SectionHeader icon={AlertTriangle} title="High-Risk Barangays" description="Priority ranking by volume and urgency" />
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px]">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700">
                    {['Barangay', 'Reports', 'High', 'Priority', 'Dominant Need'].map((h, i) => (
                      <th key={h} className={`${i === 0 || i === 4 ? 'text-left' : 'text-center'} py-2.5 px-2 text-[10px] uppercase tracking-wider font-semibold text-slate-400`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {riskData.map(item => (
                    <tr key={item.barangay} className="border-b last:border-0 border-slate-50 dark:border-slate-700/40 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors duration-150">
                      <td className="py-3 px-2 text-sm font-semibold text-slate-700 dark:text-slate-200">{item.barangay}</td>
                      <td className="py-3 px-2 text-center text-sm text-slate-600 dark:text-slate-300">{item.incidents}</td>
                      <td className="py-3 px-2 text-center text-sm font-semibold" style={{ color: RED }}>{item.high}</td>
                      <td className="py-3 px-2 text-center">
                        <span className={`inline-flex px-2.5 py-1 rounded-full border text-[10px] font-semibold ${URGENCY_CLASS[item.priority]}`}>{item.priority}</span>
                      </td>
                      <td className="py-3 px-2 text-xs text-slate-500 dark:text-slate-400">{item.dominantType}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </StaggerItem>
      </div>

      {/* ── PRESCRIPTIVE RECOMMENDATIONS ── */}
      <StaggerItem>
        <Card className="p-6">
          <SectionHeader icon={Lightbulb} title="Recommended Resources" description="Prescriptive recommendations based on incident severity, location, and type" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {recommendations.map(item => (
              <div key={item.barangay} className="rounded-xl border border-slate-200 dark:border-slate-700/60 p-4 bg-slate-50/60 dark:bg-slate-900/20">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <MapPin className="w-4 h-4 shrink-0" style={{ color: RED }} />
                    <span className="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate">{item.barangay}</span>
                  </div>
                  <span className={`shrink-0 inline-flex px-2 py-0.5 rounded-full border text-[10px] font-semibold ${URGENCY_CLASS[item.priority]}`}>{item.priority}</span>
                </div>
                <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">{item.text}</p>
              </div>
            ))}
            {!recommendations.length && (
              <div className="lg:col-span-3 text-center py-8 text-sm text-slate-400">Recommendations will appear when incident data is available.</div>
            )}
          </div>
        </Card>
      </StaggerItem>
    </StaggerContainer>
  );
}