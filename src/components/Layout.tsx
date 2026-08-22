import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  LayoutDashboard, FileText, MessageSquare, Globe, Map,
  BarChart3, Settings, Search, Bell, UserCircle, LogOut, Menu, X
} from 'lucide-react';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

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

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/incident-reports', label: 'Incident Reports', icon: FileText },
    { path: '/messenger-bot-logs', label: 'Messenger Bot Logs', icon: MessageSquare },
    { path: '/scraper-feed', label: 'Scraper Feed', icon: Globe },
    { path: '/geospatial-map', label: 'Geospatial Map', icon: Map },
    { path: '/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-[linear-gradient(113deg,#ffffff_0%,#f1f5ff_26%,#e5ebff_52%,#e3eaff_100%)] dark:bg-none dark:bg-[#0B0F19] overflow-hidden">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ─── SIDEBAR ─── */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          ${mobileOpen ? 'w-60' : collapsed ? 'lg:w-[89px]' : 'lg:w-60'}
          w-60
          bg-white dark:bg-[#111827]
          flex flex-col
          border-r border-slate-200 dark:border-slate-800
          transition-all duration-300 ease-in-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className={`
          h-[70px] flex items-center border-b border-slate-100 dark:border-slate-800
          ${collapsed && !mobileOpen ? 'lg:justify-center lg:px-0' : 'px-5 gap-3'}
        `}>
          <img
          src="/Responde_Logo.png"
          alt="Responde"
          className="w-9 h-9 rounded-lg object-cover shrink-0"
          />
          <span className={`
            font-bold text-slate-800 dark:text-white text-lg tracking-tight
            transition-all duration-300 overflow-hidden whitespace-nowrap
            ${collapsed && !mobileOpen ? 'lg:w-0 lg:opacity-0' : 'w-auto opacity-100'}
          `}>
            RESPONDE
          </span>
          <button
            onClick={() => setMobileOpen(false)}
            className="ml-auto text-slate-400 hover:text-slate-600 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-5 px-3 space-y-2.5 overflow-y-auto">
          {navItems.map((item) => {
            const active = isActive(item.path);
            const isCollapsed = collapsed && !mobileOpen;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`
                  group flex items-center rounded-xl transition-all duration-200
                  ${isCollapsed ? 'lg:justify-center lg:px-0 lg:py-1' : 'gap-7 px-3.5 py-2.5'}
                  ${active && !isCollapsed ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                  ${!active && !isCollapsed ? 'hover:bg-slate-50 dark:hover:bg-slate-800/50' : ''}
                `}
                title={isCollapsed ? item.label : undefined}
              >
                {/* Icon pill */}
                <div className={`
                  shrink-0 flex items-center justify-center transition-all duration-200
                  ${isCollapsed
                    ? active
                      ? 'w-11 h-11 rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                      : 'w-11 h-11 rounded-xl text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-300'
                    : active
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200'
                  }
                `}>
                  <item.icon className="w-[18px] h-[18px]" strokeWidth={active && isCollapsed ? 2.5 : 2} />
                </div>

                {/* Label */}
                <span className={`
                  text-sm font-medium transition-all duration-300 overflow-hidden whitespace-nowrap
                  ${isCollapsed ? 'lg:w-0 lg:opacity-0' : 'w-auto opacity-100'}
                  ${active
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-slate-600 dark:text-slate-300 group-hover:text-slate-800 dark:group-hover:text-white'
                  }
                `}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Sign Out */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => navigate('/login')}
            className={`
              group flex items-center w-full rounded-xl transition-all duration-200
              ${collapsed && !mobileOpen ? 'lg:justify-center lg:px-0 lg:py-1' : 'gap-3.5 px-3.5 py-2.5'}
            `}
            title={collapsed && !mobileOpen ? 'Sign Out' : undefined}
          >
            <div className={`
              shrink-0 flex items-center justify-center transition-all duration-200
              ${collapsed && !mobileOpen
                ? 'w-11 h-11 rounded-xl text-slate-400 dark:text-slate-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500'
                : 'text-slate-500 dark:text-slate-400 group-hover:text-red-500'
              }
            `}>
              <LogOut className="w-[18px] h-[18px]" />
            </div>
            <span className={`
              text-sm font-medium text-slate-600 dark:text-slate-300 group-hover:text-red-500
              transition-all duration-300 overflow-hidden whitespace-nowrap
              ${collapsed && !mobileOpen ? 'lg:w-0 lg:opacity-0' : 'w-auto opacity-100'}
            `}>
              Sign Out
            </span>
          </button>
        </div>
      </aside>

      {/* ─── MAIN CONTENT ─── */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-[70px] bg-white/70 dark:bg-[#0F1525]/70 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between px-5">
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <button
              onClick={() => {
                if (window.innerWidth < 1024) {
                  setMobileOpen(true);
                } else {
                  setCollapsed(!collapsed);
                }
              }}
              className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search incidents, logs, or barangays..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-100/80 dark:bg-[#1A2235] border-0 rounded-xl text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-[#0F1525]" />
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-slate-200 dark:border-slate-800">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-mono font-semibold text-slate-700 dark:text-slate-200">{formattedTime}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{formattedDate}</div>
              </div>
              <div className="w-9 h-9 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center">
                <UserCircle className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-5 lg:p-6 bg-[linear-gradient(113deg,#ffffff_0%,#f1f5ff_26%,#e5ebff_52%,#e3eaff_100%)] dark:bg-none dark:bg-[#0B0F19]">
          <Outlet />
        </div>
      </main>
    </div>
  );
}