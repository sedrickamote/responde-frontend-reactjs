import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
} from 'recharts';
import {
  AlertTriangle, Brain,
  ArrowRight, X,
  MapPin, Clock, BarChart3, ListFilter, CheckCircle2, ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useReports } from '../context/ReportsContext';
import { formatReportCode } from '../services/incidentService';
import PageLoader from '../components/PageLoader';
import { StaggerContainer, StaggerItem } from '../components/Stagger';

const APPLE_SPRING = { type: 'spring', stiffness: 340, damping: 34, mass: 0.8 } as const;

function formatDashboardTime(timeStr?: string, createdAt?: string): string {
  if (createdAt) {
    try {
      const d = new Date(createdAt);
      if (!isNaN(d.getTime())) {
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${month}/${day} ${hours}:${minutes}`;
      }
    } catch {}
  }
  return timeStr || '—';
}

function getTypeHexColor(type: string): string {
  const norm = (type || '').toLowerCase();
  if (norm.includes('flood')) return '#0071E3';
  if (norm.includes('volcanic')) return '#EA580C';
  if (norm.includes('typhoon')) return '#6366F1';
  if (norm.includes('landslide')) return '#EAB308';
  if (norm.includes('fire')) return '#F43F5E';
  if (norm.includes('earthquake')) return '#F97316';
  if (norm.includes('medic')) return '#10B981';
  if (norm.includes('search') || norm.includes('rescue')) return '#F97316';
  if (norm.includes('food') || norm.includes('water')) return '#0071E3';
  if (norm.includes('infrastructure')) return '#A855F7';
  return '#64748B';
}

function getTypeProgressColor(type: string): string {
  const norm = (type || '').toLowerCase();
  if (norm.includes('medic')) return 'bg-emerald-500';
  if (norm.includes('search') || norm.includes('rescue')) return 'bg-orange-500';
  if (norm.includes('food') || norm.includes('water')) return 'bg-[#0071E3]';
  if (norm.includes('fire')) return 'bg-rose-500';
  if (norm.includes('landslide')) return 'bg-yellow-500';
  if (norm.includes('earthquake')) return 'bg-amber-500';
  if (norm.includes('infrastructure')) return 'bg-purple-500';
  return 'bg-slate-400 dark:bg-slate-500';
}

interface TooltipPayloadItem {
  name: string;
  count: number;
  percentage: number;
  high: number;
  mod: number;
  low: number;
  topBrgy: string;
  color: string;
}

interface TypeTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: TooltipPayloadItem }>;
}

function TypeTooltip({ active, payload }: TypeTooltipProps) {
  if (!active || !payload?.length) return null;
  const item = payload[0]?.payload;
  if (!item) return null;

  return (
    <div className="backdrop-blur-xl bg-white/95 dark:bg-[#111827]/95 border border-slate-200/80 dark:border-white/15 px-3.5 py-2.5 rounded-xl shadow-xl text-xs space-y-1.5 z-50">
      <div className="flex items-center justify-between gap-3">
        <span className="font-bold text-slate-900 dark:text-white text-sm">{item.name}</span>
        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 tabular-nums">{item.percentage}%</span>
      </div>
      <div className="pt-1 border-t border-slate-100 dark:border-slate-800 space-y-1">
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-500 dark:text-slate-400">Total reports:</span>
          <span className="font-bold text-slate-900 dark:text-white tabular-nums">{item.count}</span>
        </div>
        <div className="flex items-center justify-between gap-4 text-[11px]">
          <span className="text-slate-500 dark:text-slate-400">Urgency:</span>
          <span className="font-semibold tabular-nums text-slate-700 dark:text-slate-300">
            <span className="text-rose-500">{item.high} High</span> · <span className="text-amber-500">{item.mod} Mod</span> · <span className="text-blue-500">{item.low} Low</span>
          </span>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { reports, loading: reportsLoading } = useReports();
  const [filterUrgency, setFilterUrgency] = useState<'All' | 'High' | 'Mod' | 'Low'>('All');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'chart' | 'bars'>('chart');

  const userGreeting = useMemo(() => {
    const fullName = user?.full_name?.trim();
    if (fullName) {
      const firstName = fullName.split(/\s+/)[0];
      return `Hello, ${firstName}`;
    }
    const username = user?.username?.trim();
    if (username) {
      return `Hello, ${username}`;
    }
    return 'Welcome back';
  }, [user]);

  // ── Stat metrics derived directly from reports (0 extra network calls) ──
  const totalIncidents = reports.length;

  const underReviewCount = useMemo(() => {
    return reports.filter((r) => {
      const s = (r.status || '').toLowerCase();
      return s === 'under_review' || s === 'pending';
    }).length;
  }, [reports]);

  const verifiedCount = useMemo(() => {
    return reports.filter((r) => (r.status || '').toLowerCase() === 'verified').length;
  }, [reports]);

  const highUrgencyCount = useMemo(() => {
    return reports.filter((r) => (r.urgency || '').toLowerCase() === 'high').length;
  }, [reports]);

  // Reports by Type Breakdown with Detailed Metrics
  const typeSummary = useMemo(() => {
    if (reports.length === 0) return [];
    const counts: Record<string, { count: number; high: number; mod: number; low: number; brgys: Record<string, number> }> = {};

    reports.forEach((r) => {
      const raw = (r.type || 'General').trim();
      const norm =
        !raw || raw.toLowerCase() === 'none' || raw.toLowerCase() === 'unclassified'
          ? 'General'
          : raw;

      if (!counts[norm]) {
        counts[norm] = { count: 0, high: 0, mod: 0, low: 0, brgys: {} };
      }
      counts[norm].count += 1;
      if (r.urgency === 'High') counts[norm].high += 1;
      else if (r.urgency === 'Moderate') counts[norm].mod += 1;
      else counts[norm].low += 1;

      const brgy = r.barangay || 'Unknown';
      counts[norm].brgys[brgy] = (counts[norm].brgys[brgy] || 0) + 1;
    });

    const total = reports.length;
    return Object.entries(counts)
      .map(([type, data]) => {
        const topBrgy = Object.entries(data.brgys).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown';
        return {
          name: type,
          type,
          count: data.count,
          percentage: Math.round((data.count / total) * 100),
          high: data.high,
          mod: data.mod,
          low: data.low,
          topBrgy,
          color: getTypeHexColor(type),
        };
      })
      .sort((a, b) => b.count - a.count);
  }, [reports]);

  // Selected Incident Type Details for Interactive Inspection
  const selectedTypeDetails = useMemo(() => {
    if (!selectedType) return null;
    const matching = reports.filter((r) => {
      const raw = (r.type || 'General').trim();
      const norm = !raw || raw.toLowerCase() === 'none' || raw.toLowerCase() === 'unclassified' ? 'General' : raw;
      return norm.toLowerCase() === selectedType.toLowerCase();
    });

    const total = matching.length;
    const high = matching.filter((r) => r.urgency === 'High').length;
    const mod = matching.filter((r) => r.urgency === 'Moderate').length;
    const low = matching.filter((r) => r.urgency === 'Low').length;

    const verified = matching.filter((r) => r.status === 'verified').length;
    const underReview = matching.filter((r) => r.status === 'under_review' || r.status === 'pending').length;
    const resolved = matching.filter((r) => r.status === 'resolved').length;

    // Top barangay
    const brgyCounts: Record<string, number> = {};
    matching.forEach((r) => {
      const b = r.barangay || 'Unknown';
      brgyCounts[b] = (brgyCounts[b] || 0) + 1;
    });
    const topBarangay = Object.entries(brgyCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown';

    // Latest report time
    const sortedTime = [...matching].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    const latestReport = sortedTime[0];

    return {
      type: selectedType,
      total,
      percentage: reports.length ? Math.round((total / reports.length) * 100) : 0,
      high,
      mod,
      low,
      verified,
      underReview,
      resolved,
      topBarangay,
      latestTime: latestReport ? formatDashboardTime(latestReport.time, latestReport.createdAt) : '—',
      color: getTypeHexColor(selectedType),
    };
  }, [reports, selectedType]);

  // Filtered Latest Reports for Table
  const displayReports = useMemo(() => {
    let list = [...reports];
    list.sort((a, b) => {
      const tA = new Date(a.createdAt || 0).getTime();
      const tB = new Date(b.createdAt || 0).getTime();
      return tB - tA;
    });

    if (filterUrgency === 'High') {
      list = list.filter((r) => r.urgency === 'High');
    } else if (filterUrgency === 'Mod') {
      list = list.filter((r) => r.urgency === 'Moderate');
    } else if (filterUrgency === 'Low') {
      list = list.filter((r) => r.urgency === 'Low');
    }

    if (selectedType) {
      list = list.filter((r) => {
        const raw = (r.type || 'General').trim();
        const norm = !raw || raw.toLowerCase() === 'none' || raw.toLowerCase() === 'unclassified' ? 'General' : raw;
        return norm.toLowerCase() === selectedType.toLowerCase();
      });
    }

    return list.slice(0, 8);
  }, [reports, filterUrgency, selectedType]);

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'High':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
            <span>High</span>
          </span>
        );
      case 'Moderate':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
            <span>Moderate</span>
          </span>
        );
      case 'Low':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
            <span>Low</span>
          </span>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'under_review':
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 animate-pulse" />
            <span>Under review</span>
          </span>
        );
      case 'verified':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span>Verified</span>
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
            <span>Resolved</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
            <span>Rejected</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-600 dark:text-slate-300 border border-slate-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
            <span>{status}</span>
          </span>
        );
    }
  };

  if (reportsLoading && reports.length === 0) {
    return <PageLoader variant="dashboard" />;
  }

  return (
    <div className="dashboard-soft flex flex-col flex-1 w-full lg:h-full lg:min-h-0 relative">
      <StaggerContainer className="flex flex-col flex-1 space-y-4 sm:space-y-5 w-full lg:h-full lg:min-h-0">
        {/* ── Top Header Bar ── */}
        <StaggerItem>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {userGreeting}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Command center overview <span className="mx-1.5 text-slate-300 dark:text-slate-600">·</span> Real-time metrics & incident triage
              </p>
            </div>
          </div>
        </StaggerItem>

        {/* ── 1. Row 1: 4 Raised Stat Cards (Derived directly from reports) ── */}
        <StaggerItem>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3 md:gap-4 shrink-0">
        {/* Total Incidents */}
        <div className="bg-white/80 dark:bg-[#111827]/80 backdrop-blur-xl rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)] p-3 sm:p-4 md:p-5 flex items-center justify-between group transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md min-w-0">
          <div className="space-y-1 min-w-0">
            <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 truncate">
              Total Incidents
            </p>
            <p className="text-lg sm:text-2xl md:text-3xl font-semibold tracking-tight tabular-nums text-slate-900 dark:text-white">
              {totalIncidents}
            </p>
            <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shrink-0" />
              <span className="truncate">Active pipeline</span>
            </div>
          </div>
          <div className="w-8.5 h-8.5 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-xl sm:rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 shadow-[0_0_16px_rgba(244,63,94,0.15)] flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" strokeWidth={1.75} />
          </div>
        </div>

        {/* Under Review */}
        <div className="bg-white/80 dark:bg-[#111827]/80 backdrop-blur-xl rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)] p-3 sm:p-4 md:p-5 flex items-center justify-between group transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md min-w-0">
          <div className="space-y-1 min-w-0">
            <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 truncate">
              Under Review
            </p>
            <p className="text-lg sm:text-2xl md:text-3xl font-semibold tracking-tight tabular-nums text-slate-900 dark:text-white">
              {underReviewCount}
            </p>
            <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-medium truncate">
              {underReviewCount > 0 ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                  <span className="text-amber-600 dark:text-amber-400 font-semibold truncate">
                    Needs triage
                  </span>
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span className="text-emerald-600 dark:text-emerald-400 truncate">
                    All caught up
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="w-8.5 h-8.5 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-xl sm:rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shadow-[0_0_16px_rgba(245,158,11,0.15)] flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" strokeWidth={1.75} />
          </div>
        </div>

        {/* Verified Incidents */}
        <div className="bg-white/80 dark:bg-[#111827]/80 backdrop-blur-xl rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)] p-3 sm:p-4 md:p-5 flex items-center justify-between group transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md min-w-0">
          <div className="space-y-1 min-w-0">
            <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 truncate">
              Verified Incidents
            </p>
            <p className="text-lg sm:text-2xl md:text-3xl font-semibold tracking-tight tabular-nums text-slate-900 dark:text-white">
              {verifiedCount}
            </p>
            <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-emerald-600 dark:text-emerald-400 font-medium truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              <span className="truncate">Confirmed on site</span>
            </div>
          </div>
          <div className="w-8.5 h-8.5 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-xl sm:rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-[0_0_16px_rgba(168,85,247,0.15)] flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" strokeWidth={1.75} />
          </div>
        </div>

        {/* High Urgency */}
        <div className="bg-white/80 dark:bg-[#111827]/80 backdrop-blur-xl rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)] p-3 sm:p-4 md:p-5 flex items-center justify-between group transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md min-w-0">
          <div className="space-y-1 min-w-0">
            <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 truncate">
              High Urgency
            </p>
            <p className="text-lg sm:text-2xl md:text-3xl font-semibold tracking-tight tabular-nums text-slate-900 dark:text-white">
              {highUrgencyCount}
            </p>
            <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-purple-600 dark:text-purple-400 font-medium truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
              <span className="truncate">Critical priority</span>
            </div>
          </div>
          <div className="w-8.5 h-8.5 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-xl sm:rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 shadow-[0_0_16px_rgba(168,85,247,0.15)] flex items-center justify-center shrink-0">
            <Brain className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" strokeWidth={1.75} />
          </div>
        </div>
          </div>
        </StaggerItem>

        {/* ── 2. Main 2-Column Section: Latest Reports Table (Left) & Reports by Type with Interactive Bar Chart (Right) ── */}
        <StaggerItem className="w-full flex flex-col flex-1 lg:min-h-0">
          <div className="grid grid-cols-12 gap-4 sm:gap-5 lg:gap-6 flex-1 lg:min-h-0 w-full items-stretch">
        {/* Left Column: Latest Reports Table (Col 8) */}
        <div className="col-span-12 lg:col-span-8 bg-white/90 dark:bg-[#111827]/90 backdrop-blur-xl rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.04)] flex flex-col overflow-hidden lg:h-full">
          {/* Header Row */}
          <div className="p-4 sm:p-5 border-b border-slate-200/70 dark:border-white/10 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Latest reports
              </h2>
              {selectedType && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-[#0071E3]/10 text-[#0071E3] dark:text-sky-400 border border-[#0071E3]/20">
                  <span>Type: {selectedType}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedType(null)}
                    className="hover:opacity-75 transition-opacity cursor-pointer p-0.5"
                    title="Clear type filter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>

            {/* Segmented Urgency Filter: [All] [High] [Low] */}
            <div className="inline-flex items-center p-1 bg-slate-100 dark:bg-slate-800/90 rounded-xl border border-slate-200/60 dark:border-white/5 gap-1 shadow-inner">
              {(['All', 'High', 'Mod', 'Low'] as const).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setFilterUrgency(opt)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    filterUrgency === opt
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Mobile Card List (< sm) */}
          <div className="sm:hidden divide-y divide-slate-100 dark:divide-white/5">
            {displayReports.length === 0 ? (
              <div className="p-6 text-center text-slate-400 dark:text-slate-500 text-xs">
                No reports found for the selected filter.
              </div>
            ) : (
              displayReports.map((report) => {
                const isTypeMatch = selectedType && report.type?.toLowerCase() === selectedType.toLowerCase();
                return (
                  <div
                    key={report.id}
                    onClick={() => {
                      const rType = report.type || 'General';
                      setSelectedType((prev) => (prev === rType ? null : rType));
                    }}
                    className={`p-3.5 space-y-2.5 transition-colors cursor-pointer ${
                      isTypeMatch ? 'bg-blue-50/50 dark:bg-blue-900/15' : 'active:bg-slate-50 dark:active:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-white/5 truncate">
                          {formatReportCode(report.id, report.source)}
                        </span>
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                          {report.barangay || 'Unknown'}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono tabular-nums shrink-0">
                        {formatDashboardTime(report.time, report.createdAt)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {getUrgencyBadge(report.urgency)}
                        {getStatusBadge(report.status)}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/incident-reports?focus=${report.id}`);
                        }}
                        className="px-3 py-1.5 min-h-[36px] text-xs font-semibold text-[#0071E3] dark:text-sky-400 bg-blue-500/10 hover:bg-blue-500/15 border border-blue-500/20 rounded-xl transition-all active:scale-[0.96] shadow-2xs cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Review</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Desktop/Tablet Table (>= sm) */}
          <div className="hidden sm:block overflow-x-auto overflow-y-auto w-full flex-1 min-h-0 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-200/60 dark:border-white/5">
                <tr>
                  <th className="px-4 py-3 text-[11px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500 whitespace-nowrap">ID</th>
                  <th className="px-4 py-3 text-[11px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500">Barangay</th>
                  <th className="px-4 py-3 text-[11px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500">Urgency</th>
                  <th className="px-4 py-3 text-[11px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500">Status</th>
                  <th className="px-4 py-3 text-[11px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500">Time</th>
                  <th className="px-4 py-3 text-[11px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {displayReports.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-slate-400 dark:text-slate-500 text-xs">
                      No reports found for the selected filter.
                    </td>
                  </tr>
                ) : (
                  displayReports.map((report) => {
                    const isTypeMatch = selectedType && report.type?.toLowerCase() === selectedType.toLowerCase();
                    return (
                      <tr
                        key={report.id}
                        onClick={() => {
                          const rType = report.type || 'General';
                          setSelectedType((prev) => (prev === rType ? null : rType));
                        }}
                        className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors group cursor-pointer ${
                          isTypeMatch ? 'bg-blue-50/50 dark:bg-blue-900/15' : ''
                        }`}
                      >
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span
                            className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-white/5 truncate inline-block"
                            title={`ID: ${report.id}`}
                          >
                            {formatReportCode(report.id, report.source)}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap font-medium text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
                          {report.barangay || 'Unknown'}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {getUrgencyBadge(report.urgency)}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {getStatusBadge(report.status)}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                          {formatDashboardTime(report.time, report.createdAt)}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => navigate(`/incident-reports?focus=${report.id}`)}
                            className="px-3 py-1.5 text-xs font-semibold text-[#0071E3] dark:text-sky-400 bg-blue-500/10 hover:bg-blue-500/15 border border-blue-500/20 rounded-xl transition-all active:scale-[0.96] shadow-2xs cursor-pointer inline-flex items-center gap-1.5"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Review</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer with View All Link */}
          <div className="p-3.5 sm:p-4 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 shrink-0">
            <span>
              Showing {displayReports.length} of {reports.length} reports
            </span>
            <button
              type="button"
              onClick={() => navigate('/incident-reports')}
              className="inline-flex items-center gap-1 font-semibold text-[#0071E3] hover:text-[#0077ED] dark:text-sky-400 dark:hover:text-sky-300 transition-colors cursor-pointer"
            >
              <span>View all incident reports</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Column: Reports by Type with Interactive Bar Chart (Col 4) */}
        <div className="col-span-12 lg:col-span-4 bg-white/90 dark:bg-[#111827]/90 backdrop-blur-xl rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.04)] p-4 sm:p-5 flex flex-col lg:h-full">
          {/* Header Row with View Mode Switcher and Clear Filter Pill */}
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-200/70 dark:border-white/10 shrink-0 gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight truncate">
                Reports by type
              </h2>
              {selectedType && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#0071E3]/10 text-[#0071E3] dark:text-sky-400 border border-[#0071E3]/20 text-xs font-semibold shrink-0">
                  <span className="truncate max-w-[90px]">{selectedType}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedType(null)}
                    className="hover:opacity-75 transition-opacity cursor-pointer p-0.5"
                    title="Clear filter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {/* Chart vs List view mode toggle */}
              <div className="inline-flex items-center p-0.5 bg-slate-100 dark:bg-slate-800/90 rounded-lg border border-slate-200/60 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setViewMode('chart')}
                  className={`p-1 rounded-md transition-all cursor-pointer ${
                    viewMode === 'chart'
                      ? 'bg-white dark:bg-slate-700 text-[#0071E3] dark:text-sky-400 shadow-2xs'
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                  }`}
                  title="Bar chart view"
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('bars')}
                  className={`p-1 rounded-md transition-all cursor-pointer ${
                    viewMode === 'bars'
                      ? 'bg-white dark:bg-slate-700 text-[#0071E3] dark:text-sky-400 shadow-2xs'
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                  }`}
                  title="Progress bars view"
                >
                  <ListFilter className="w-3.5 h-3.5" />
                </button>
              </div>

              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 tabular-nums">
                {reports.length} total
              </span>
            </div>
          </div>

          {/* Interactive Chart or Progress Bars */}
          {typeSummary.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-slate-500 py-12 text-center">
              No incident types reported yet.
            </p>
          ) : viewMode === 'chart' ? (
            /* ── Recharts Bar Chart (Same functionality as Analytics page) ── */
            <div className="w-full flex-1 flex flex-col min-h-0 pt-2">
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                Click any bar to highlight incident and inspect details
              </p>
              <div className="w-full flex-1 min-h-[190px] relative mt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={typeSummary}
                    margin={{ top: 12, right: 8, left: -24, bottom: 24 }}
                    onClick={(state: any) => {
                      if (state && state.activePayload && state.activePayload.length > 0) {
                        const clickedType = state.activePayload[0].payload.name;
                        setSelectedType((prev) => (prev === clickedType ? null : clickedType));
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
                      angle={-25}
                      textAnchor="end"
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 9.5, fill: '#94a3b8' }}
                      axisLine={false}
                      tickLine={false}
                      width={28}
                    />
                    <Tooltip content={<TypeTooltip />} cursor={{ fill: 'rgba(0,113,227,0.06)' }} />
                    <Bar
                      dataKey="count"
                      radius={[5, 5, 0, 0]}
                      cursor="pointer"
                    >
                      {typeSummary.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={entry.color}
                          opacity={selectedType && selectedType.toLowerCase() !== entry.name.toLowerCase() ? 0.35 : 1}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            /* ── Progress Bars List View ── */
            <div className="mt-4 space-y-3.5">
              {typeSummary.map((item) => {
                const isSelected = selectedType && selectedType.toLowerCase() === item.type.toLowerCase();
                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => setSelectedType((prev) => (prev === item.type ? null : item.type))}
                    className={`w-full text-left p-2.5 rounded-xl transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-blue-50/70 dark:bg-blue-900/20 border-blue-500/30 shadow-2xs'
                        : 'border-transparent hover:bg-slate-50/70 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        {item.type}
                      </span>
                      <span className="font-bold text-slate-600 dark:text-slate-400 tabular-nums text-xs">
                        {item.percentage}% ({item.count})
                      </span>
                    </div>

                    {/* Horizontal Bar */}
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mt-1.5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${item.percentage}%` }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        className={`h-full rounded-full ${getTypeProgressColor(item.type)}`}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* ── Highlighted Incident Information Panel or Default Footer ── */}
          <div className="shrink-0 mt-auto">
            <AnimatePresence mode="wait">
              {selectedTypeDetails ? (
                <motion.div
                  key={selectedTypeDetails.type}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={APPLE_SPRING}
                  className="mt-3 p-3.5 rounded-xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/70 dark:border-white/10 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: selectedTypeDetails.color }}
                      />
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                        {selectedTypeDetails.type} Overview
                      </h3>
                    </div>
                    <span className="text-[11px] font-semibold text-[#0071E3] dark:text-sky-400 tabular-nums">
                      {selectedTypeDetails.total} incident{selectedTypeDetails.total > 1 ? 's' : ''} ({selectedTypeDetails.percentage}%)
                    </span>
                  </div>

                  {/* Urgency & Status Metrics Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded-lg bg-white/80 dark:bg-slate-900/60 border border-slate-200/50 dark:border-white/5 space-y-1">
                      <span className="text-[10px] font-semibold uppercase text-slate-400 dark:text-slate-500 tracking-wider block">
                        Urgency Levels
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap text-[11px] font-medium">
                        <span className="text-rose-600 dark:text-rose-400 font-semibold">{selectedTypeDetails.high} High</span>
                        <span className="text-slate-300 dark:text-slate-600">·</span>
                        <span className="text-amber-600 dark:text-amber-400">{selectedTypeDetails.mod} Mod</span>
                        <span className="text-slate-300 dark:text-slate-600">·</span>
                        <span className="text-blue-600 dark:text-blue-400">{selectedTypeDetails.low} Low</span>
                      </div>
                    </div>

                    <div className="p-2 rounded-lg bg-white/80 dark:bg-slate-900/60 border border-slate-200/50 dark:border-white/5 space-y-1">
                      <span className="text-[10px] font-semibold uppercase text-slate-400 dark:text-slate-500 tracking-wider block">
                        Status Flow
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap text-[11px] font-medium">
                        <span className="text-amber-600 dark:text-amber-400 font-semibold">{selectedTypeDetails.underReview} Review</span>
                        <span className="text-slate-300 dark:text-slate-600">·</span>
                        <span className="text-emerald-600 dark:text-emerald-400">{selectedTypeDetails.verified} Ver</span>
                        <span className="text-slate-300 dark:text-slate-600">·</span>
                        <span className="text-blue-600 dark:text-blue-400">{selectedTypeDetails.resolved} Res</span>
                      </div>
                    </div>
                  </div>

                  {/* Location and Latest Timestamp */}
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/50 dark:border-white/5">
                    <div className="flex items-center gap-1.5 truncate max-w-[170px]" title={`Top location: ${selectedTypeDetails.topBarangay}`}>
                      <MapPin className="w-3.5 h-3.5 text-[#0071E3] shrink-0" />
                      <span className="truncate">Top: <strong className="text-slate-800 dark:text-slate-200 font-semibold">{selectedTypeDetails.topBarangay}</strong></span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="tabular-nums font-mono text-[11px]">{selectedTypeDetails.latestTime}</span>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
                  <span>Select an incident type to inspect distribution</span>
                  <span className="font-medium text-slate-500 dark:text-slate-400">{typeSummary.length} categories</span>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
        </StaggerItem>
      </StaggerContainer>
    </div>
  );
}
