/**
 * PageLoader — shared skeleton loading component
 *
 * Pure CSS pulse-shimmer skeletons, zero external dependencies, zero build step.
 * Each variant mirrors the real page's layout exactly so there is no layout shift
 * when content arrives.
 *
 * Usage (early-return pattern — never wraps real content):
 *
 *   if (loading) return <PageLoader variant="dashboard" />;
 *   return <RealContent />;
 */

// ── Skeleton atom ────────────────────────────────────────────────────────────
function Bone({ className = '' }: { className?: string }) {
  return (
    <div
      className={`bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse ${className}`}
    />
  );
}

// ── Variant skeletons ────────────────────────────────────────────────────────

/** Mirrors the Dashboard 12-col grid: 4 stat cards + left activity feeds + right map */
function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-12 gap-6 h-full lg:grid-rows-[auto_1fr] overflow-x-hidden w-full">
      {/* ── Stat cards row ── */}
      <div className="col-span-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 flex items-center gap-4"
            >
              <Bone className="w-12 h-12 rounded-xl shrink-0" />
              <div className="flex-1 space-y-2">
                <Bone className="h-6 w-16" />
                <Bone className="h-3 w-28" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Left column: two activity feed panels ── */}
      <div className="col-span-12 lg:col-span-6 flex flex-col gap-6 h-full lg:min-h-0">
        {[...Array(2)].map((_, pi) => (
          <div
            key={pi}
            className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex-1 flex flex-col lg:min-h-0 overflow-hidden"
          >
            {/* panel header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-700 shrink-0">
              <Bone className="h-4 w-40" />
            </div>
            {/* panel rows */}
            <div className="p-3 space-y-2 flex-1 overflow-hidden">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-2">
                  <Bone className="w-8 h-8 rounded-full shrink-0" />
                  <Bone className="h-3 flex-1" />
                  <Bone className="h-3 w-14 shrink-0" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ── Right column: map panel ── */}
      <div className="col-span-12 lg:col-span-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col lg:min-h-0">
        <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between shrink-0">
          <Bone className="h-4 w-36" />
          <Bone className="h-3 w-24" />
        </div>
        <Bone className="flex-1 min-h-[320px] rounded-none rounded-b-xl" />
        <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-700 flex justify-center gap-6 shrink-0">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Bone className="w-2.5 h-2.5 rounded-full" />
              <Bone className="h-2.5 w-10" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Mirrors MessengerBotLogs: filter bar + split conversation list / chat panel */
function MessengerSkeleton() {
  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Filter bar */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 shrink-0">
        <div className="flex flex-wrap gap-3">
          <Bone className="h-9 w-28" />
          <Bone className="h-9 w-28" />
          <Bone className="h-9 w-28" />
          <Bone className="h-9 w-28 ml-auto" />
          <Bone className="h-9 w-28" />
        </div>
      </div>

      {/* Split pane */}
      <div className="flex-1 flex flex-col lg:grid lg:grid-cols-12 gap-6 min-h-0">
        {/* Left: conversation list */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col overflow-hidden min-h-[300px] lg:min-h-0">
          <div className="p-4 border-b border-slate-100 dark:border-slate-700 shrink-0">
            <Bone className="h-4 w-40" />
          </div>
          <div className="flex-1 overflow-hidden">
            {[...Array(7)].map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-4 border-b border-slate-50 dark:border-slate-700/50"
              >
                <Bone className="w-10 h-10 rounded-full shrink-0" />
                <div className="flex-1 space-y-2 min-w-0">
                  <div className="flex justify-between gap-2">
                    <Bone className="h-3 w-28" />
                    <Bone className="h-3 w-10 shrink-0" />
                  </div>
                  <div className="flex gap-2">
                    <Bone className="h-2.5 w-16" />
                    <Bone className="h-2.5 w-12" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: chat detail */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col overflow-hidden min-h-[400px] lg:min-h-0">
          {/* chat header */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3 shrink-0">
            <Bone className="w-10 h-10 rounded-full shrink-0" />
            <div className="space-y-2">
              <Bone className="h-4 w-32" />
              <Bone className="h-3 w-24" />
            </div>
          </div>
          {/* chat bubbles */}
          <div className="flex-1 p-5 space-y-4 overflow-hidden bg-slate-50/50 dark:bg-slate-900/30">
            {[...Array(5)].map((_, i) => (
              <div key={i} className={`flex items-end gap-2 ${i % 2 === 0 ? 'justify-end' : ''}`}>
                {i % 2 !== 0 && <Bone className="w-7 h-7 rounded-full shrink-0" />}
                <Bone className={`h-10 rounded-2xl ${i % 2 === 0 ? 'w-48' : 'w-56'}`} />
                {i % 2 === 0 && <Bone className="w-7 h-7 rounded-full shrink-0" />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Mirrors ScraperFeed: filter bar + split post list / post detail */
function ScraperSkeleton() {
  return (
    <div className="space-y-5 h-full flex flex-col">
      {/* Filter bar */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 shrink-0">
        <div className="flex flex-wrap gap-3">
          <Bone className="h-9 w-28" />
          <Bone className="h-9 w-28" />
          <Bone className="h-9 w-28" />
          <Bone className="h-9 w-28" />
          <Bone className="h-9 w-28 ml-auto" />
          <Bone className="h-9 w-28" />
        </div>
      </div>

      {/* Split pane */}
      <div className="flex-1 flex flex-col lg:grid lg:grid-cols-12 gap-5 min-h-0">
        {/* Left: post list */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col overflow-hidden min-h-[300px] lg:min-h-0">
          <div className="p-4 border-b border-slate-100 dark:border-slate-700 shrink-0">
            <Bone className="h-4 w-32" />
          </div>
          <div className="flex-1 overflow-hidden">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="p-4 border-b border-slate-50 dark:border-slate-700/50"
              >
                <div className="flex items-start gap-3">
                  <Bone className="w-9 h-9 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2 min-w-0">
                    <div className="flex justify-between gap-2">
                      <Bone className="h-3 w-24" />
                      <Bone className="h-3 w-12 shrink-0" />
                    </div>
                    <Bone className="h-2.5 w-20" />
                    <Bone className="h-3 w-full" />
                    <Bone className="h-3 w-4/5" />
                    <div className="flex gap-2 pt-1">
                      <Bone className="h-4 w-12 rounded-full" />
                      <Bone className="h-4 w-14 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: post detail */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col overflow-hidden min-h-[400px] lg:min-h-0">
          <div className="p-4 border-b border-slate-100 dark:border-slate-700 shrink-0">
            <Bone className="h-4 w-32" />
          </div>
          <div className="flex-1 p-5 space-y-4 overflow-hidden">
            <div className="flex items-center gap-3">
              <Bone className="w-12 h-12 rounded-full shrink-0" />
              <div className="space-y-2">
                <Bone className="h-4 w-36" />
                <Bone className="h-3 w-24" />
              </div>
            </div>
            <Bone className="h-3 w-full" />
            <Bone className="h-3 w-full" />
            <Bone className="h-3 w-3/4" />
            <div className="border border-slate-100 dark:border-slate-700 rounded-xl p-4 space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex justify-between">
                  <Bone className="h-3 w-24" />
                  <Bone className="h-3 w-32" />
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-2">
              <Bone className="h-9 w-28 rounded-lg" />
              <Bone className="h-9 w-28 rounded-lg" />
              <Bone className="h-9 w-28 rounded-lg ml-auto" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Public component ─────────────────────────────────────────────────────────
export type PageLoaderVariant = 'dashboard' | 'messenger' | 'scraper';

interface PageLoaderProps {
  variant: PageLoaderVariant;
}

/**
 * Render a content-shaped skeleton for the given page variant.
 * Use the early-return pattern — never wrap real content with this:
 *
 *   if (loading) return <PageLoader variant="dashboard" />;
 *   return <RealContent />;
 */
export default function PageLoader({ variant }: PageLoaderProps) {
  if (variant === 'dashboard') return <DashboardSkeleton />;
  if (variant === 'messenger') return <MessengerSkeleton />;
  return <ScraperSkeleton />;
}
