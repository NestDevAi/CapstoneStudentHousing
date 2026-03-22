import React, { useState, useEffect, useRef } from 'react';
import { Bell, ChevronRight, X, Clock, MessageSquare, ShieldAlert, Info, Sparkles, Menu } from 'lucide-react';
import { db as supabase } from '../../lib/db';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface HeaderProps {
  activeTab: string;
  setActiveTab?: (tab: string) => void;
  user: any;
  onLogin?: () => void;
  onMenuClick?: () => void;
}

export const StudentHeader = ({ activeTab, setActiveTab, user, onLogin, onMenuClick }: HeaderProps) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const initials = user?.email?.split('@')[0].substring(0, 2).toUpperCase() || 'G';
  const name = user?.email?.split('@')[0] || 'Guest User';

  useEffect(() => {
    if (!user?.id) return;

    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching notifications:', error);
      } else {
        setNotifications(data || []);
        setUnreadCount(data?.filter((n: any) => !n.read).length || 0);
      }
    };

    fetchNotifications();

    // Subscribe to changes
    const channel = supabase
      .channel('header_notifications')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, fetchNotifications)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unread = notifications.filter(n => !n.read);
      if (unread.length === 0) return;

      await supabase
        .from('notifications')
        .update({ read: true })
        .in('id', unread.map(n => n.id));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'security alert': return <ShieldAlert className="w-4 h-4 text-rose-500" />;
      case 'maintenance notice': return <Clock className="w-4 h-4 text-amber-500" />;
      case 'promotion': return <Sparkles className="w-4 h-4 text-emerald-500" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-4 md:px-10 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-all"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2 text-slate-400 overflow-hidden">
          <span className="text-sm font-medium hidden sm:block whitespace-nowrap">Student Portal</span>
          <ChevronRight className="w-4 h-4 hidden sm:block" />
          <span className="text-sm font-bold text-slate-900 capitalize truncate">{activeTab.replace('-', ' ')}</span>
        </div>
      </div>

      <div className="flex items-center gap-6">
        {user ? (
          <>
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="relative p-2 text-slate-400 hover:text-slate-900 transition-colors"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                )}
              </button>

              <AnimatePresence>
                {isNotificationsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-4 w-80 bg-white rounded-[32px] shadow-2xl border border-slate-100 overflow-hidden z-50"
                  >
                    <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-900">Notifications</h4>
                      {unreadCount > 0 && (
                        <button 
                          onClick={markAllAsRead}
                          className="text-[10px] font-bold text-blue-500 uppercase tracking-widest hover:text-blue-600"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <div className="max-h-[400px] overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map((n) => (
                          <div 
                            key={n.id} 
                            onClick={() => markAsRead(n.id)}
                            className={cn(
                              "p-6 border-b border-slate-50 last:border-0 cursor-pointer transition-colors",
                              !n.read ? "bg-slate-50/50" : "hover:bg-slate-50/30"
                            )}
                          >
                            <div className="flex gap-4">
                              <div className="mt-1">
                                {getIcon(n.type)}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <p className="text-xs font-bold text-slate-900">{n.title}</p>
                                  {!n.read && <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>}
                                </div>
                                <p className="text-[11px] text-slate-500 leading-relaxed mb-2">{n.message}</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                  {n.createdAt?.toDate ? n.createdAt.toDate().toLocaleString() : 'Just now'}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-12 text-center">
                          <Bell className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                          <p className="text-xs font-medium text-slate-400">No notifications yet</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="flex items-center gap-3 pl-6 border-l border-slate-100">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-900">{name}</p>
                <p className="text-[10px] text-slate-400 font-medium">
                  {user?.verified ? 'Verified Student' : 'Pending Verification'}
                </p>
              </div>
              <button 
                onClick={() => setActiveTab?.('profile')}
                className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-sm hover:scale-105 transition-all shadow-lg shadow-orange-500/20"
              >
                {initials}
              </button>
            </div>
          </>
        ) : (
          <button 
            onClick={onLogin}
            className="px-6 py-2 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-all"
          >
            Sign In
          </button>
        )}
      </div>
    </header>
  );
};
