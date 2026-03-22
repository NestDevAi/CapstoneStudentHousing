import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Bell, 
  Plus, 
  Menu, 
  ShieldAlert, 
  UserCheck, 
  AlertTriangle, 
  MessageSquare,
  Megaphone,
  UserPlus,
  Lock,
  FileText,
  Check,
  X,
  Clock
} from 'lucide-react';

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  user?: any;
  setActiveView?: (view: any) => void;
  onMenuClick?: () => void;
}

interface Notification {
  id: string;
  type: 'fraud' | 'verification' | 'report' | 'support';
  title: string;
  desc: string;
  time: string;
  isRead: boolean;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ title, subtitle, user, setActiveView, onMenuClick }) => {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: '1', type: 'fraud', title: 'High Risk Alert', desc: 'Suspicious listing detected in Baguio City', time: '2m ago', isRead: false },
    { id: '2', type: 'verification', title: 'New Document', desc: 'Landlord "Juan D." uploaded ownership deed', time: '15m ago', isRead: false },
    { id: '3', type: 'report', title: 'Listing Reported', desc: 'Multiple reports for "Cozy Room near SLU"', time: '1h ago', isRead: true },
    { id: '4', type: 'support', title: 'New Ticket', desc: 'Student inquiry regarding payment escrow', time: '3h ago', isRead: true },
  ]);

  const notificationRef = useRef<HTMLDivElement>(null);
  const quickActionRef = useRef<HTMLDivElement>(null);

  const initials = user?.email?.split('@')[0].substring(0, 2).toUpperCase() || 'AD';
  const name = user?.full_name || user?.email?.split('@')[0] || 'Admin User';

  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (quickActionRef.current && !quickActionRef.current.contains(event.target as Node)) {
        setIsQuickActionsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'fraud': return <ShieldAlert className="w-4 h-4 text-rose-500" />;
      case 'verification': return <UserCheck className="w-4 h-4 text-emerald-500" />;
      case 'report': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'support': return <MessageSquare className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-10 sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-all"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="overflow-hidden">
          <h2 className="text-lg md:text-2xl font-bold text-slate-900 truncate">{title}</h2>
          {subtitle && <p className="text-xs md:text-sm text-slate-500 font-medium truncate hidden sm:block">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-6">
        <div className="relative group hidden lg:block">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-orange-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search users, properties..." 
            className="pl-12 pr-6 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm w-80 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
          />
        </div>

        {/* Notification Dropdown */}
        <div className="relative" ref={notificationRef}>
          <button 
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className={`relative p-2.5 rounded-xl transition-all ${
              isNotificationsOpen ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Bell className="w-6 h-6" />
            {unreadCount > 0 && (
              <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-orange-500 border-2 border-white rounded-full"></span>
            )}
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 mt-3 w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                <h3 className="font-bold text-slate-900">Notifications</h3>
                <button 
                  onClick={markAllAsRead}
                  className="text-[10px] font-bold text-orange-500 uppercase tracking-widest hover:text-orange-600"
                >
                  Mark all as read
                </button>
              </div>
              <div className="max-h-[400px] overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((n) => (
                    <div 
                      key={n.id} 
                      className={`p-4 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors cursor-pointer flex gap-4 ${!n.isRead ? 'bg-orange-50/30' : ''}`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center shrink-0 shadow-sm">
                        {getNotificationIcon(n.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-0.5">
                          <h4 className={`text-sm truncate ${!n.isRead ? 'font-bold text-slate-900' : 'font-medium text-slate-600'}`}>
                            {n.title}
                          </h4>
                          <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap ml-2">{n.time}</span>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{n.desc}</p>
                      </div>
                      {!n.isRead && (
                        <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 shrink-0"></div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-10 text-center">
                    <Bell className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                    <p className="text-sm text-slate-500 font-medium">No new notifications</p>
                  </div>
                )}
              </div>
              <div className="p-3 bg-slate-50 border-t border-slate-50 text-center">
                <button className="text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors">
                  View All Activity
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Quick Action Dropdown */}
        <div className="relative" ref={quickActionRef}>
          <button 
            onClick={() => setIsQuickActionsOpen(!isQuickActionsOpen)}
            className={`flex items-center gap-2 px-3 md:px-5 py-2.5 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-orange-500/20 ${
              isQuickActionsOpen ? 'bg-orange-600 scale-95' : 'bg-orange-500 hover:bg-orange-600'
            }`}
          >
            <Plus className={`w-4 h-4 transition-transform duration-300 ${isQuickActionsOpen ? 'rotate-45' : ''}`} />
            <span className="hidden sm:inline">Quick Action</span>
          </button>

          {isQuickActionsOpen && (
            <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-3 border-b border-slate-50 bg-slate-50/50">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Administrative Shortcuts</p>
              </div>
              <div className="p-2">
                {[
                  { icon: <Megaphone className="w-4 h-4" />, label: 'Send Broadcast', view: 'broadcast', color: 'text-blue-500' },
                  { icon: <UserPlus className="w-4 h-4" />, label: 'Add New Admin', view: 'user-management', color: 'text-emerald-500' },
                  { icon: <Search className="w-4 h-4" />, label: 'Global Search', view: 'overview', color: 'text-orange-500' },
                  { icon: <Lock className="w-4 h-4" />, label: 'Platform Lockdown', view: 'fraud-detection', color: 'text-rose-500' },
                  { icon: <FileText className="w-4 h-4" />, label: 'Generate Report', view: 'audit-logs', color: 'text-slate-600' },
                ].map((action, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setActiveView?.(action.view);
                      setIsQuickActionsOpen(false);
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-all group"
                  >
                    <div className={`w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center ${action.color} group-hover:scale-110 transition-transform`}>
                      {action.icon}
                    </div>
                    <span className="text-sm font-bold text-slate-700 group-hover:text-slate-900">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 pl-3 md:pl-6 border-l border-slate-200">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-slate-900">{name}</p>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">System Administrator</p>
          </div>
          <button 
            onClick={() => setActiveView?.('profile')}
            className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm hover:scale-105 transition-all shadow-lg shadow-slate-900/10"
          >
            {initials}
          </button>
        </div>
      </div>
    </header>
  );
};
