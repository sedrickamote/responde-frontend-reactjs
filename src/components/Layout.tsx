import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, FileText, MessageSquare, Globe, Map,
  BarChart3, Settings, Search, Bell, UserCircle, LogOut, Menu, X,
  Globe2, MessageCircle, CheckCheck, Trash2, BellOff, ArrowRight,
} from 'lucide-react';
import PageTransition from './Transition';
import {
  useNotifications,
  type AppNotification,
  type ToastNotification,
  type NotificationType,
} from '../context/NotificationContext';

type FilterTab = 'all' | NotificationType;

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const notifRef = useRef<HTMLDivElement>(null);

  const {
    notifications,
    toasts,
    unreadCount,
    markAllRead,
    markNotificationRead,
    deleteNotification,
    clearAll,
    dismissToast,
  } = useNotifications();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Close notification dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const formattedTime = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  });
  const formattedDate = currentTime.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  const isActive = (p: string) => location.pathname === p;

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/incident-reports', label: 'Incident Reports', icon: FileText },
    { path: '/messenger-bot-logs', label: 'Messenger Bot Logs', icon: MessageSquare },
    { path: '/scraper-feed', label: 'Scraper Feed', icon: Globe },
    { path: '/geospatial-map', label: 'Geospatial Map', icon: Map },
    { path: '/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  const filteredNotifications =
    activeTab === 'all'
      ? notifications
      : notifications.filter((n) => n.type === activeTab);

  const scraperUnread = notifications.filter((n) => n.type === 'scraper' && !n.read).length;
  const messengerUnread = notifications.filter((n) => n.type === 'messenger' && !n.read).length;

  const handleBellClick = () => {
    setNotifOpen((prev) => !prev);
  };

  const handleNotifClick = (notif: AppNotification) => {
    markNotificationRead(notif.id);
    setNotifOpen(false);
    navigate(notif.targetPath);
  };

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
          border-r border-slate-300 dark:border-slate-800
          transition-all duration-300 ease-in-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className={`
          h-[70px] flex items-center border-b border-slate-300 dark:border-slate-800
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
        <div className="p-3 border-t border-slate-200 dark:border-slate-800">
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
        <header className="relative z-[100] h-[70px] bg-white/70 dark:bg-[#0F1525]/70 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between px-5">
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
            {/* ── Notification Bell ── */}
            <div ref={notifRef} className="relative">
              <button
                id="notification-bell-btn"
                onClick={handleBellClick}
                className="relative p-2.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                <AnimatePresence>
                  {unreadCount > 0 && (
                    <motion.span
                      key="badge"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                      className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white dark:ring-[#0F1525]"
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>

              {/* ── Notification Dropdown ── */}
              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    id="notification-dropdown"
                    initial={{ opacity: 0, y: -8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.97 }}
                    transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute right-0 top-full mt-2 w-[360px] sm:w-[400px] bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl shadow-black/10 dark:shadow-black/40 z-[60] overflow-hidden flex flex-col"
                  >
                    {/* ── Header ── */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                          Notifications
                        </span>
                        {notifications.length > 0 && (
                          <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-medium rounded-full">
                            {notifications.length}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {notifications.length > 0 && (
                          <>
                            <button
                              onClick={markAllRead}
                              className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                              title="Mark all as read"
                            >
                              <CheckCheck className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={clearAll}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="Clear all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* ── Filter Tabs ── */}
                    <div className="flex gap-1 px-3 pt-2.5 pb-1">
                      {([
                        { key: 'all', label: 'All', count: notifications.length },
                        { key: 'scraper', label: 'Scraper', count: scraperUnread },
                        { key: 'messenger', label: 'Messenger', count: messengerUnread },
                      ] as { key: FilterTab; label: string; count: number }[]).map((tab) => (
                        <button
                          key={tab.key}
                          onClick={() => setActiveTab(tab.key)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150
                            ${activeTab === tab.key
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }
                          `}
                        >
                          {tab.label}
                          {tab.count > 0 && (
                            <span className={`text-[10px] font-bold px-1 rounded-full ${activeTab === tab.key
                                ? 'bg-white/20 text-white'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                              }`}>
                              {tab.count}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>

                    {/* ── Notification List ── */}
                    <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800/60">
                      <AnimatePresence initial={false}>
                        {filteredNotifications.length === 0 ? (
                          <motion.div
                            key="empty"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center justify-center py-12 gap-2 text-slate-400"
                          >
                            <BellOff className="w-8 h-8" />
                            <p className="text-sm font-medium">No notifications yet</p>
                            <p className="text-xs text-slate-300 dark:text-slate-600">
                              New scraper &amp; messenger events will appear here in real-time
                            </p>
                          </motion.div>
                        ) : (
                          filteredNotifications.map((n) => (
                            <NotificationRow
                              key={n.id}
                              notification={n}
                              onClick={() => handleNotifClick(n)}
                              onDelete={() => deleteNotification(n.id)}
                            />
                          ))
                        )}
                      </AnimatePresence>
                    </div>

                    {/* ── Footer ── */}
                    {filteredNotifications.length > 0 && (
                      <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <span className="text-xs text-slate-400">
                          {filteredNotifications.length} notification
                          {filteredNotifications.length !== 1 ? 's' : ''}
                        </span>
                        <button
                          onClick={() => {
                            setNotifOpen(false);
                            navigate(activeTab === 'messenger' ? '/messenger-bot-logs' : '/scraper-feed');
                          }}
                          className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 font-medium transition-colors"
                        >
                          View feed
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

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

        <div className="flex-1 flex flex-col overflow-y-auto p-5 lg:p-6 bg-[linear-gradient(113deg,#ffffff_0%,#f1f5ff_26%,#e5ebff_52%,#e3eaff_100%)] dark:bg-none dark:bg-[#0B0F19]">
          <PageTransition key={location.pathname}>
            <Outlet />
          </PageTransition>
        </div>
      </main>

      {/* ── Global Toast Renderer ── */}
      <div
        className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 items-end pointer-events-none"
        aria-live="polite"
      >
        <AnimatePresence>
          {toasts.map((toast) => (
            <GlobalToast
              key={toast.id}
              toast={toast}
              onDismiss={dismissToast}
              onView={(path) => {
                dismissToast(toast.id);
                navigate(path);
              }}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── NotificationRow ───────────────────────────────────────────────────────────

function NotificationRow({
  notification: n,
  onClick,
  onDelete,
}: {
  notification: AppNotification;
  onClick: () => void;
  onDelete: () => void;
}) {
  const isMessenger = n.type === 'messenger';
  const timeAgo = formatTimeAgo(n.timestamp);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10, height: 0, marginTop: 0, paddingTop: 0, paddingBottom: 0 }}
      transition={{ duration: 0.2 }}
      className={
        'group relative flex items-start gap-3 px-4 py-3.5 cursor-pointer transition-colors ' +
        (!n.read ? 'bg-blue-50/60 dark:bg-blue-950/10 ' : '') +
        'hover:bg-slate-50 dark:hover:bg-slate-800/40'
      }
      onClick={onClick}
    >
      {/* Left blue unread bar */}
      {!n.read && (
        <span className="absolute left-0 top-3 bottom-3 w-[3px] bg-blue-500 rounded-r-full" />
      )}

      {/* Icon */}
      <div
        className={
          'shrink-0 mt-0.5 w-9 h-9 rounded-xl flex items-center justify-center ' +
          (isMessenger
            ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-500'
            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-500')
        }
      >
        {isMessenger ? (
          <MessageCircle className="w-4 h-4" />
        ) : (
          <Globe2 className="w-4 h-4" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pr-6">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">
            {n.title}
          </p>
          {isMessenger ? (
            <span className="shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
              Messenger
            </span>
          ) : (
            <span className="shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              Scraper
            </span>
          )}
        </div>

        {/* Barangay / Sender meta */}
        {(n.barangay || n.sender) && (
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-0.5">
            {n.barangay ? `📍 ${n.barangay}` : `👤 ${n.sender}`}
          </p>
        )}

        {/* Message snippet */}
        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
          {n.message}
        </p>
        <p className="text-[10px] text-slate-400 dark:text-slate-600 mt-1">{timeAgo}</p>
      </div>

      {/* Hover dismiss button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-slate-500 dark:hover:text-slate-300 rounded-lg transition-all"
        title="Dismiss"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
}

// ── GlobalToast ───────────────────────────────────────────────────────────────

function GlobalToast({
  toast,
  onDismiss,
  onView,
}: {
  toast: ToastNotification;
  onDismiss: (id: number) => void;
  onView: (path: string) => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 5500);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const isMessenger = toast.type === 'messenger';

  return (
    <motion.div
      initial={{ opacity: 0, x: 80, scale: 0.94 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.94 }}
      transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
      className="pointer-events-auto relative flex items-start gap-3 pl-4 pr-3 pt-3.5 pb-5 rounded-2xl border shadow-xl min-w-[310px] max-w-[390px] bg-white dark:bg-[#111827] border-slate-200 dark:border-slate-700 overflow-hidden"
    >
      {/* Accent bar */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 ${isMessenger ? 'bg-purple-500' : 'bg-blue-500'
          }`}
      />

      {/* Icon */}
      <div
        className={`shrink-0 mt-0.5 w-9 h-9 rounded-xl flex items-center justify-center ${isMessenger
            ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-500'
            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-500'
          }`}
      >
        {isMessenger ? (
          <MessageCircle className="w-4 h-4" />
        ) : (
          <Globe2 className="w-4 h-4" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{toast.title}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
          {toast.message}
        </p>
        {/* View button */}
        <button
          onClick={() => onView(toast.targetPath)}
          className={`mt-2 flex items-center gap-1 text-xs font-semibold transition-colors ${isMessenger
              ? 'text-purple-500 hover:text-purple-600'
              : 'text-blue-500 hover:text-blue-600'
            }`}
        >
          View
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* Dismiss */}
      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 mt-0.5 p-1 text-slate-300 hover:text-slate-500 dark:hover:text-slate-300 rounded-lg transition-colors"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Progress bar */}
      <motion.div
        className={`absolute bottom-0 left-0 h-[3px] ${isMessenger ? 'bg-purple-400' : 'bg-blue-400'
          }`}
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: 5.5, ease: 'linear' }}
      />
    </motion.div>
  );
}

// ── Utility ───────────────────────────────────────────────────────────────────

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
