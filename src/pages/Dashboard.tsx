import { useState, useEffect } from 'react';
import { LayoutDashboard, FileText, MessageSquare, Globe, Map, BarChart3, Settings, Search, Bell, UserCircle } from 'lucide-react';



export default function Dashboard() {

const [currentTime, setCurrentTime] = useState(new Date());

useEffect(() => {
  const timer = setInterval(() => setCurrentTime(new Date()), 1000);
  return () => clearInterval(timer);
}, []);

const formattedTime = currentTime.toLocaleTimeString('en-US', {
  hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
});
const formattedDate = currentTime.toLocaleDateString('en-US', {
  month: 'short', day: 'numeric', year: 'numeric',
});

  return(
  <div className="flex h-screen bg-slate-50">
    {/* sidebar */}
    <aside className="w-64 bg-slate-900 flex flex-col border-r border-slate-800">
      {/* logo dito */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800">
      <div>
        <h1 className="text-white fold-bold text-lg">RESPONDE</h1>
        <p className="text-slate-400 text-[10px] upppercase">Talisay MDRRMO</p>
      </div>
      </div>

        {/* Nav placeholder */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        <button className="w-full flex items-center justify-start gap-2 px-3 py-2.5 rounded-lg text-sm font-medium bg-blue-600/20 text-blue-400 border border-blue-600/30">
          <LayoutDashboard className="w-5 h-5" />
          Dashboard
        </button>

        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-200">
          <FileText className="w-5 h-5" />
          Incident Reports
        </button>

        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-200">
          <MessageSquare className="w-5 h-5" />
          Messenger Bot Logs
        </button>

        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-200">
          <Globe className="w-5 h-5" />
          Scraper Feed
        </button>

        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-200">
          <Map className="w-5 h-5" />
          Geospatial Map
        </button>

        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-200">
          <BarChart3 className="w-5 h-5" />
          Analytics
        </button>

        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-200">
          <Settings className="w-5 h-5" />
          Settings
        </button>

      </nav>

       {/* sign up */}
       <div className="p-4 border-t border-slate-800">
          <p className="text-slate-400 text-sm">Sign Out</p>
       </div>
    
    </aside>
    
    <main className="flex-1 flex flex-col min-w-0">
      {/* dashboard content */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
      <div className="flex items-center gap-4 flex-1 max-w-xl">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input 
        type="text"
        placeholder="Search incidents, logs, or barangays..."
        className="w-full pl-10 pr-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-lg">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full">
          </span>
        </button>
        <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-mono font-semibold text-slate-700">{formattedTime}</div>
            <div className="text-xs text-slate-500">{formattedDate}</div>
          </div>
          <div className="w-9 h-9 bg-slate-200 rounded-full flex items-center justify-center">
            <UserCircle className="w-5 h-5 text-slate-600" />
          </div>
        </div>
      </div> 
      </header>

      <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
        <div className="grid grid-cols-12 gap-6">
          {/* cards*/}
          <div className="col-span-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">⚠️</div> 
              <div>
                <p className="text-2xl font-bold text-slate-800">0</p>
                <p className="text-xs text-slate-500 font-medium">Total Incidents</p>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-xl">💬</div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">0</p>
                  <p className="text-xs text-slate-500 font-medium">Bot Conversations</p>
                </div>
              </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-xl">🌐</div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">0</p>
                  <p className="text-xs text-slate-500 font-medium">Scraped Comments</p>
                </div>
              </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-xl">⏱️</div>
                <div>
                  <p className="text-2xl font-bold text-slate-800">0</p>
                  <p className="text-xs text-slate-500 font-medium">Avg Response Time</p>
                </div>
              </div>
            </div>
            
          <div className="col-span-12 lg:col-span-6 flex flex-col gap-6">  
            {/* messenger bot */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="p-5 border-b border-slate-100">
                <h3 className="font-semibold text-slate-800">Messenger Bot Acitivities</h3>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-3 p-3 hover:bg-slate-100 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">B</div>
                    <span className="text-xs bg-slate-100 px-2 py-0.5 rounded">Medical</span>
                    <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded">Complete</span>
                  </div>

                <div className="flex items-center gap-3 p-3 hover:bg-slate-100 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">C</div>
                    <span className="text-xs bg-slate-100 px-2 py-0.5 rounded">Medical</span>
                    <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded">Incomplete</span>
                  </div>

                <div className="flex items-center gap-3 p-3 hover:bg-slate-100 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">D</div>
                    <span className="text-xs bg-slate-100 px-2 py-0.5 rounded">Medical</span>
                    <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded">Complete</span>
                  </div>

                <div className="flex items-center gap-3 p-3 hover:bg-slate-100 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">E</div>
                    <span className="text-xs bg-slate-100 px-2 py-0.5 rounded">Medical</span>
                    <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded">Complete</span>
                  </div>

              </div>
            </div>

            {/* Scraper Activity */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="p-5 border-b border-slate-100">
                  <h3 className="font-semibold text-slate-800">Scraper Activities</h3>
                </div>
                <div className="p-4 space-y-3">
               {/* scraped comments*/}
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <p className="text-xs text-slate-600">Tulungan nyo po ako, hindi ko alam kung pano ko uubusin yung pera ko</p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <p className="text-xs text-slate-600">Send help may na stock na odlid sa tewup ko</p>
                  </div>
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-6 bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="p-5 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800">Talisay Heat Map</h3>
            </div>
            <div className="p-4">
<div className="p-4 flex flex-col h-full">
  {/* Map Visualization */}
  <div className="flex-1 min-h-[280px] bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-center p-3">
    <svg viewBox="0 0 400 320" className="w-full h-full">
      {/* Background */}
      <rect width="400" height="320" fill="#f8fafc" rx="6"/>
      
      {/* Talisay municipality outline - simplified polygon */}
      <path 
        d="M 70 50 L 200 35 L 330 65 L 360 170 L 310 280 L 140 295 L 45 240 L 35 140 Z" 
        fill="#e2e8f0" 
        stroke="#94a3b8" 
        strokeWidth="2"
      />
      
      {/* High Risk Zone (Red) - top right */}
      <path 
        d="M 200 35 L 330 65 L 360 170 L 260 150 L 230 80 Z" 
        fill="#fca5a5" 
        stroke="#ef4444" 
        strokeWidth="1.5" 
        opacity="0.75"
      />
      <circle cx="290" cy="100" r="5" fill="#ef4444"/>
      <text x="290" y="98" fontSize="9" fill="#7f1d1d" textAnchor="middle" fontWeight="600">Sampaloc</text>
      
      {/* Moderate Zone (Yellow) - center */}
      <path 
        d="M 70 50 L 200 35 L 230 80 L 260 150 L 170 190 L 90 170 L 35 140 Z" 
        fill="#fde68a" 
        stroke="#eab308" 
        strokeWidth="1.5" 
        opacity="0.7"
      />
      <circle cx="155" cy="110" r="5" fill="#eab308"/>
      <text x="155" y="108" fontSize="9" fill="#713f12" textAnchor="middle" fontWeight="600">Leynes</text>
      
      {/* Low Zone (Green) - bottom */}
      <path 
        d="M 35 140 L 90 170 L 170 190 L 260 150 L 310 280 L 140 295 L 45 240 Z" 
        fill="#86efac" 
        stroke="#22c55e" 
        strokeWidth="1.5" 
        opacity="0.6"
      />
      <circle cx="130" cy="230" r="5" fill="#22c55e"/>
      <text x="130" y="228" fontSize="9" fill="#14532d" textAnchor="middle" fontWeight="600">Banga</text>
      
      {/* Map label */}
      <text x="200" y="315" fontSize="10" fill="#64748b" textAnchor="middle">Barangays by Incident Density</text>
    </svg>
  </div>

  {/* Legend */}
  <div className="mt-3 flex justify-center gap-4">
    <div className="flex items-center gap-1.5">
      <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
      <span className="text-[10px] text-slate-500 font-medium">High</span>
    </div>
    <div className="flex items-center gap-1.5">
      <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
      <span className="text-[10px] text-slate-500 font-medium">Moderate</span>
    </div>
    <div className="flex items-center gap-1.5">
      <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
      <span className="text-[10px] text-slate-500 font-medium">Low</span>
    </div>
  </div>
</div>  
            </div>

          </div>


        </div>
      </div>
    </main>

  </div>


  );
}