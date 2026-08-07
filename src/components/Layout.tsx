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
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  const navItem = (path: string, label: string, Icon: React.ElementType) => (
    <Link
      to={path}
      onClick={() => setSidebarOpen(false)} // close sidebar on mobile after click
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
        isActive(path)
          ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30'
          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
      }`}
    >
      <Icon className="w-5 h-5" />
      {label}
    </Link>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50 w-64 bg-slate-900 flex flex-col border-r border-slate-800
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800">
          <div className="w-7 h-7 bg-blue-500 rounded"></div>
          <div>
            <h1 className="text-white font-bold text-lg">RESPONDE</h1>
            <p className="text-slate-500 text-[10px] uppercase">Talisay MDRRMO</p>
          </div>
          {/* Close button (mobile only) */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto text-slate-400 hover:text-white lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItem('/dashboard', 'Dashboard', LayoutDashboard)}
          {navItem('/incident-reports', 'Incident Reports', FileText)}
          {navItem('/messenger-bot-logs', 'Messenger Bot Logs', MessageSquare)}
          {navItem('/scraper-feed', 'Scraper Feed', Globe)}
          {navItem('/geospatial-map', 'Geospatial Map', Map)}
          {navItem('/analytics', 'Analytics', BarChart3)}
          {navItem('/settings', 'Settings', Settings)}
        </nav>

        {/* Sign Out */}
        <div className="p-3 border-t border-slate-800">
          <button
            onClick={() => navigate('/login')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6">
          {/* Left: Hamburger + Search */}
          <div className="flex items-center gap-3 flex-1 max-w-xl">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search incidents, logs, or barangays..."
                className="w-full pl-10 pr-4 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-lg">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
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

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 bg-slate-50">
          <Outlet />
        </div>
      </main>
    </div>
  );
}