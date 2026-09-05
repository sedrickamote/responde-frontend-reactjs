import { useMemo } from 'react';
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Download,
  TrendingUp,
  Clock3,
  MapPin,
  AlertTriangle,
  Siren,
  HeartPulse,
  Droplets,
  HardHat,
  BarChart3,
  Lightbulb,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
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

const TYPE_CONFIG: Record<
  string,
  { icon: LucideIcon; iconClass: string; barClass: string; color: string }
> = {
  'Search & Rescue': {
    icon: Siren,
    iconClass: 'text-orange-600 dark:text-orange-400',
    barClass: 'bg-orange-500',
    color: '#f97316',
  },
  Medical: {
    icon: HeartPulse,
    iconClass: 'text-emerald-600 dark:text-emerald-400',
    barClass: 'bg-emerald-500',
    color: '#10b981',
  },
  'Food & Water': {
    icon: Droplets,
    iconClass: 'text-blue-600 dark:text-blue-400',
    barClass: 'bg-blue-500',
    color: '#3b82f6',
  },
  Infrastructure: {
    icon: HardHat,
    iconClass: 'text-purple-600 dark:text-purple-400',
    barClass: 'bg-purple-500',
    color: '#a855f7',
  },
};

const URGENCY_CLASS: Record<string, string> = {
  High: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
  Moderate:
    'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800',
  Low: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
};

const URGENCY_WEIGHT: Record<string, number> = { High: 3, Moderate: 2, Low: 1 };

function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
      </div>
      <div>
        <h3 className="font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
        {description && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>
        )}
      </div>
    </div>
  );
}

function parseReportTime(value: string) {
  const m = String(value || '').match(/^(\d{1,2})\/(\d{1,2})\s+(\d{1,2}):(\d{2})$/);
  return m ? { month: +m[1], day: +m[2], hour: +m[3], minute: +m[4] } : null;
}

function responseMinutes(report: AnalyticsReport) {
  if (!report.verifiedAt) return null;
  const a = parseReportTime(report.time),
    b = parseReportTime(report.verifiedAt);
  if (!a || !b) return null;
  const diff = b.hour * 60 + b.minute - (a.hour * 60 + a.minute);
  return diff >= 0 ? diff : null;
}

interface TooltipPayloadItem {
  value?: number | string;
  name?: string;
  color?: string;
  payload?: Record<string, unknown>;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string | number;
}

function CustomVolumeTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const val = Number(payload[0]?.value ?? 0);
    return (
      <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg shadow-lg text-xs">
        <p className="font-semibold text-slate-700 dark:text-slate-200">Date: {label}</p>
        <p className="text-blue-600 dark:text-blue-400 font-bold mt-0.5">
          {val} {val === 1 ? 'incident' : 'incidents'}
        </p>
      </div>
    );
  }
  return null;
}

function CustomBarangayTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const item = payload[0]?.payload as { name?: string; count?: number } | undefined;
    if (!item) return null;
    return (
      <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg shadow-lg text-xs">
        <p className="font-semibold text-slate-700 dark:text-slate-200">{item.name}</p>
        <p className="text-blue-600 dark:text-blue-400 font-bold mt-0.5">
          {item.count} {item.count === 1 ? 'incident report' : 'incident reports'}
        </p>
      </div>
    );
  }
  return null;
}

function CustomPieTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const item = payload[0];
    const dataObj = item?.payload as { name?: string; value?: number; color?: string } | undefined;
    if (!dataObj) return null;
    return (
      <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-lg shadow-lg text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: dataObj.color }} />
          <span className="font-semibold text-slate-700 dark:text-slate-200">{dataObj.name}</span>
        </div>
        <p className="font-bold mt-1" style={{ color: dataObj.color }}>
          {dataObj.value} {dataObj.value === 1 ? 'report' : 'reports'}
        </p>
      </div>
    );
  }
  return null;
}

export default function Analytics() {
  const { reports } = useReports();
  const data = reports as AnalyticsReport[];

  const stats = useMemo(() => {
    const responseTimes = data.map(responseMinutes).filter((v): v is number => v !== null);
    return {
      total: data.length,
      high: data.filter((r) => r.urgency === 'High').length,
      avgResponse: responseTimes.length
        ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
        : 0,
    };
  }, [data]);

  const barangayData = useMemo(() => {
    const counts: Record<string, number> = {};
    data.forEach((r) => {
      const n = r.barangay || 'Unknown';
      counts[n] = (counts[n] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
  }, [data]);

  // For horizontal bar chart, reverse so largest bar is at the top
  const barangayChartData = useMemo(() => {
    return [...barangayData].reverse().map(([name, count]) => ({ name, count }));
  }, [barangayData]);

  const typeData = useMemo(() => {
    const order = ['Search & Rescue', 'Medical', 'Food & Water', 'Infrastructure'];
    const counts: Record<string, number> = {};
    data.forEach((r) => {
      counts[r.type] = (counts[r.type] || 0) + 1;
    });
    return order.map((type) => ({ type, count: counts[type] || 0 }));
  }, [data]);

  const typeChartData = useMemo(() => {
    return typeData
      .filter((item) => item.count > 0)
      .map((item) => ({
        name: item.type,
        value: item.count,
        color: TYPE_CONFIG[item.type]?.color || '#64748b',
      }));
  }, [typeData]);

  const urgencyData = useMemo(
    () =>
      ['High', 'Moderate', 'Low'].map((level) => ({
        level,
        count: data.filter((r) => r.urgency === level).length,
      })),
    [data]
  );

  const volumeData = useMemo(() => {
    const counts: Record<string, number> = {};
    data.forEach((r) => {
      const p = parseReportTime(r.time);
      if (p) {
        const k = `${p.month}/${p.day}`;
        counts[k] = (counts[k] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .sort((a, b) => {
        const [am, ad] = a[0].split('/').map(Number);
        const [bm, bd] = b[0].split('/').map(Number);
        return am - bm || ad - bd;
      })
      .slice(-10);
  }, [data]);

  const volumeChartData = useMemo(() => {
    return volumeData.map(([date, count]) => ({ date, count }));
  }, [volumeData]);

  const riskData = useMemo(() => {
    const grouped: Record<
      string,
      { incidents: number; score: number; high: number; types: Record<string, number> }
    > = {};
    data.forEach((r) => {
      const n = r.barangay || 'Unknown';
      if (!grouped[n]) grouped[n] = { incidents: 0, score: 0, high: 0, types: {} };
      grouped[n].incidents++;
      grouped[n].score += URGENCY_WEIGHT[r.urgency] || 1;
      if (r.urgency === 'High') grouped[n].high++;
      grouped[n].types[r.type] = (grouped[n].types[r.type] || 0) + 1;
    });
    return Object.entries(grouped)
      .map(([barangay, v]) => {
        const dominantType =
          Object.entries(v.types).sort((a, b) => b[1] - a[1])[0]?.[0] || 'General';
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

  const recommendations = useMemo(
    () =>
      riskData.slice(0, 3).map((item) => {
        const resource =
          item.dominantType === 'Medical'
            ? 'medical response teams and ambulance support'
            : item.dominantType === 'Search & Rescue'
            ? 'search and rescue teams and rescue equipment'
            : item.dominantType === 'Food & Water'
            ? 'food, water, and relief supplies'
            : 'clearing and infrastructure assessment teams';
        return {
          ...item,
          text: `Pre-position ${resource} in ${item.barangay} based on ${item.incidents} recorded incident${
            item.incidents === 1 ? '' : 's'
          } and its urgency pattern.`,
        };
      }),
    [riskData]
  );

  const downloadReport = () => {
    const headers = ['Barangay', 'Incident Type', 'Urgency', 'Source', 'Status', 'Time'];
    const rows = data.map((r) => [r.barangay, r.type, r.urgency, r.source, r.status, r.time]);
    const csv = [headers, ...rows]
      .map((row) => row.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'responde-analytics-report.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <StaggerContainer className="w-full space-y-6 overflow-x-hidden pb-6">
      {/* Page Header */}
      <StaggerItem>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Analytics</h1>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Incident trends, response patterns, and resource recommendations
            </p>
          </div>
          <button
            onClick={downloadReport}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors active:scale-[0.98]"
          >
            <Download className="w-4 h-4" />
            Download Report
          </button>
        </div>
      </StaggerItem>

      {/* KPI Cards */}
      <StaggerItem>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {(() => {
            const kpis: Array<{
              icon: LucideIcon;
              bg: string;
              fg: string;
              value: string | number;
              label: string;
            }> = [
              {
                icon: AlertTriangle,
                bg: 'bg-red-50 dark:bg-red-900/20',
                fg: 'text-red-600 dark:text-red-400',
                value: stats.total,
                label: 'Total Incidents',
              },
              {
                icon: TrendingUp,
                bg: 'bg-orange-50 dark:bg-orange-900/20',
                fg: 'text-orange-600 dark:text-orange-400',
                value: stats.high,
                label: 'High-Urgency Incidents',
              },
              {
                icon: Clock3,
                bg: 'bg-green-50 dark:bg-green-900/20',
                fg: 'text-green-600 dark:text-green-400',
                value: stats.avgResponse ? `${stats.avgResponse}m` : '—',
                label: 'Avg. Verification Time',
              },
              {
                icon: MapPin,
                bg: 'bg-blue-50 dark:bg-blue-900/20',
                fg: 'text-blue-600 dark:text-blue-400',
                value: riskData.length,
                label: 'Barangays with Reports',
              },
            ];

            return kpis.map(({ icon: Icon, bg, fg, value, label }) => (
              <Card key={label} className="p-5">
                <div className="flex items-center gap-4">
                  <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${fg}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
                  </div>
                </div>
              </Card>
            ));
          })()}
        </div>
      </StaggerItem>

      {/* Row: Barangay BarChart & Incident Type Breakdown (Donut + Bars) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Frequency per Barangay Horizontal Bar Chart */}
        <StaggerItem>
          <Card className="p-6 h-full flex flex-col">
            <SectionHeader
              icon={MapPin}
              title="Incident Frequency per Barangay"
              description="Top recorded reporting barangays"
            />
            {barangayChartData.length ? (
              <div className="w-full h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={barangayChartData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      horizontal={false}
                      stroke="currentColor"
                      className="text-slate-200/60 dark:text-slate-700/60"
                    />
                    <XAxis
                      type="number"
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: '#94a3b8' }}
                      axisLine={{ stroke: '#94a3b8', strokeOpacity: 0.3 }}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={110}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<CustomBarangayTooltip />} cursor={{ fill: 'rgba(59, 130, 246, 0.06)' }} />
                    <Bar
                      dataKey="count"
                      fill="#2563eb"
                      radius={[0, 4, 4, 0]}
                      barSize={16}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-slate-400 py-8 text-center my-auto">No incident data available.</p>
            )}
          </Card>
        </StaggerItem>

        {/* Breakdown by Incident Type: Donut Chart + Sector List */}
        <StaggerItem>
          <Card className="p-6 h-full flex flex-col justify-between">
            <div>
              <SectionHeader
                icon={BarChart3}
                title="Breakdown by Incident Type"
                description="Distribution across the four response sectors"
              />

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                {/* Donut Chart */}
                <div className="sm:col-span-5 h-48 relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip content={<CustomPieTooltip />} />
                      <Pie
                        data={typeChartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={72}
                        paddingAngle={3}
                      >
                        {typeChartData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center Text inside Donut */}
                  <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xl font-bold text-slate-800 dark:text-slate-100">{stats.total}</span>
                    <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Reports</span>
                  </div>
                </div>

                {/* Sector Badges & Counts */}
                <div className="sm:col-span-7 space-y-2.5">
                  {typeData.map((item) => {
                    const c = TYPE_CONFIG[item.type];
                    const Icon = c.icon;
                    const pct = stats.total > 0 ? Math.round((item.count / stats.total) * 100) : 0;
                    return (
                      <div
                        key={item.type}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900/40"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon className={`w-4 h-4 shrink-0 ${c.iconClass}`} />
                          <span className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate">
                            {item.type}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-100">{item.count}</span>
                          <span className="text-[10px] text-slate-400">({pct}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Urgency distribution pill row */}
            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-700 grid grid-cols-3 gap-3">
              {urgencyData.map((x) => (
                <div key={x.level} className="text-center">
                  <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{x.count}</p>
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full border text-[10px] font-semibold ${
                      URGENCY_CLASS[x.level]
                    }`}
                  >
                    {x.level}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </StaggerItem>
      </div>

      {/* Incident Volume Over Time: AreaChart with Gradient */}
      <StaggerItem>
        <Card className="p-6">
          <SectionHeader
            icon={TrendingUp}
            title="Incident Volume Over Time"
            description="Daily incident submissions timeline"
          />
          {volumeChartData.length ? (
            <div className="h-60 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={volumeChartData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="currentColor"
                    className="text-slate-200/60 dark:text-slate-700/60"
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={{ stroke: '#94a3b8', strokeOpacity: 0.3 }}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomVolumeTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#2563eb"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#volumeGradient)"
                    dot={{ r: 3.5, fill: '#2563eb', strokeWidth: 1.5, stroke: '#fff' }}
                    activeDot={{ r: 6, fill: '#1d4ed8' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-slate-400 py-10 text-center">No time-series data available.</p>
          )}
        </Card>
      </StaggerItem>

      {/* Response Times & High Risk Table */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <StaggerItem className="xl:col-span-2">
          <Card className="p-6 h-full">
            <SectionHeader
              icon={Clock3}
              title="Average Response Time per Barangay"
              description="Based on reports with recorded verification time"
            />
            <div className="space-y-3">
              {riskData.map((item) => {
                const times = data
                  .filter((r) => r.barangay === item.barangay)
                  .map(responseMinutes)
                  .filter((v): v is number => v !== null);
                const avg = times.length
                  ? Math.round(times.reduce((a, b) => a + b, 0) / times.length)
                  : null;
                return (
                  <div
                    key={item.barangay}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900/40"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                        {item.barangay}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                      {avg !== null ? `${avg} min` : '—'}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>
        </StaggerItem>

        <StaggerItem className="xl:col-span-3">
          <Card className="p-6 h-full">
            <SectionHeader
              icon={AlertTriangle}
              title="High-Risk Barangays"
              description="Priority ranking based on incident volume and urgency"
            />
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px]">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700">
                    {['Barangay', 'Incidents', 'High', 'Priority', 'Dominant Need'].map((h, i) => (
                      <th
                        key={h}
                        className={`${
                          i === 0 || i === 4 ? 'text-left' : 'text-center'
                        } py-2.5 px-2 text-[10px] uppercase tracking-wider font-semibold text-slate-400`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {riskData.map((item) => (
                    <tr
                      key={item.barangay}
                      className="border-b last:border-0 border-slate-50 dark:border-slate-700/60"
                    >
                      <td className="py-3 px-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {item.barangay}
                      </td>
                      <td className="py-3 px-2 text-center text-sm text-slate-600 dark:text-slate-300">
                        {item.incidents}
                      </td>
                      <td className="py-3 px-2 text-center text-sm text-slate-600 dark:text-slate-300">
                        {item.high}
                      </td>
                      <td className="py-3 px-2">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full border text-[10px] font-semibold ${
                            URGENCY_CLASS[item.priority]
                          }`}
                        >
                          {item.priority}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-xs text-slate-500 dark:text-slate-400">
                        {item.dominantType}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </StaggerItem>
      </div>

      {/* Prescriptive Resource Recommendations */}
      <StaggerItem>
        <Card className="p-6">
          <SectionHeader
            icon={Lightbulb}
            title="High-Risk Barangays → Recommended Resources"
            description="Prescriptive recommendations based on incident severity, location, and type"
          />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {recommendations.map((item) => (
              <div
                key={item.barangay}
                className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-slate-50/60 dark:bg-slate-900/20"
              >
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <MapPin className="w-4 h-4 text-blue-500" />
                    <span className="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate">
                      {item.barangay}
                    </span>
                  </div>
                  <span
                    className={`shrink-0 inline-flex px-2 py-0.5 rounded-full border text-[10px] font-semibold ${
                      URGENCY_CLASS[item.priority]
                    }`}
                  >
                    {item.priority}
                  </span>
                </div>
                <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">{item.text}</p>
              </div>
            ))}
            {!recommendations.length && (
              <div className="lg:col-span-3 text-center py-8 text-sm text-slate-400">
                Recommendations will appear when incident data is available.
              </div>
            )}
          </div>
        </Card>
      </StaggerItem>
    </StaggerContainer>
  );
}