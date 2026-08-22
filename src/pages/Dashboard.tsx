export default function Dashboard() {
  return (
    <div className="grid grid-cols-12 gap-6 h-full lg:grid-rows-[auto_1fr]">
      {/* Stats Row */}
      <div className="col-span-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-900/30 flex items-center justify-center text-xl">⚠️</div>
          <div>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">0</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Incidents</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-xl">💬</div>
          <div>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">0</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Bot Conversations</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center text-xl">🌐</div>
          <div>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">0</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Scraped Comments</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-50 dark:bg-green-900/30 flex items-center justify-center text-xl">⏱️</div>
          <div>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">0</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Avg Response Time</p>
          </div>
        </div>
      </div>

      {/* Left Column */}
      <div className="col-span-12 lg:col-span-6 flex flex-col gap-6 h-full lg:min-h-0">
        {/* Messenger Bot */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex-1 flex flex-col lg:min-h-0 overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-slate-700">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100">Messenger Bot Activities</h3>
          </div>
          <div className="p-2 overflow-y-auto flex-1 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
            {['B','C','D','E','E','E'].map((letter, i) => (
              <div key={i} className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700/30 rounded-lg transition-colors">
                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300">{letter}</div>
                <span className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">Medical</span>
                <span className={`text-xs px-2 py-0.5 rounded ${i === 1 ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400'}`}>
                  {i === 1 ? 'Incomplete' : 'Complete'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Scraper Activity */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex-1 flex flex-col lg:min-h-0 overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-slate-700">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100">Scraper Activities</h3>
          </div>
          <div className="p-4 space-y-3 overflow-y-auto flex-1 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
            {[
              'Tulungan nyo po ako, hindi ko alam kung pano ko uubusin yung pera ko',
              'Pa wash out po kay Juan Dela Cruz',
              'Pa wash out po kay Juan Dela Cruz',
              'Pa wash out po kay Juan Dela Cruz',
              'Pa wash out po kay Juan Dela Cruz',
              'Pa wash out po kay Juan Dela Cruz',
            ].map((text, i) => (
              <div key={i} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-700">
                <p className="text-xs text-slate-600 dark:text-slate-300">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column: Heat Map */}
      <div className="col-span-12 lg:col-span-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col lg:min-h-0">
        <div className="p-5 border-b border-slate-100 dark:border-slate-700">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100">Talisay Heat Map</h3>
        </div>
        <div className="p-4 flex flex-col h-full min-h-0">
          <div className="flex-1 min-h-0 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center p-3">
            <svg viewBox="0 0 400 320" className="w-full h-full">
              <rect width="400" height="320" fill="transparent" rx="6"/>
              <path d="M 70 50 L 200 35 L 330 65 L 360 170 L 310 280 L 140 295 L 45 240 L 35 140 Z" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="2"/>
              <path d="M 200 35 L 330 65 L 360 170 L 260 150 L 230 80 Z" fill="#fca5a5" stroke="#ef4444" strokeWidth="1.5" opacity="0.75"/>
              <circle cx="290" cy="100" r="5" fill="#ef4444"/>
              <text x="290" y="98" fontSize="9" fill="#7f1d1d" textAnchor="middle" fontWeight="600">Sampaloc</text>
              <path d="M 70 50 L 200 35 L 230 80 L 260 150 L 170 190 L 90 170 L 35 140 Z" fill="#fde68a" stroke="#eab308" strokeWidth="1.5" opacity="0.7"/>
              <circle cx="155" cy="110" r="5" fill="#eab308"/>
              <text x="155" y="108" fontSize="9" fill="#713f12" textAnchor="middle" fontWeight="600">Leynes</text>
              <path d="M 35 140 L 90 170 L 170 190 L 260 150 L 310 280 L 140 295 L 45 240 Z" fill="#86efac" stroke="#22c55e" strokeWidth="1.5" opacity="0.6"/>
              <circle cx="130" cy="230" r="5" fill="#22c55e"/>
              <text x="130" y="228" fontSize="9" fill="#14532d" textAnchor="middle" fontWeight="600">Banga</text>
              <text x="200" y="315" fontSize="10" fill="#64748b" textAnchor="middle">Barangays by Incident Density</text>
            </svg>
          </div>
          <div className="mt-3 flex justify-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">High</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Moderate</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Low</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}