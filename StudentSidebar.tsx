import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Calendar, 
  Heart, 
  MessageSquare, 
  ShieldCheck, 
  Star, 
  AlertTriangle,
  LogOut,
  Shield,
  LayoutDashboard,
  X
} from 'lucide-react';
import { db as supabase } from '../../lib/db';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  onLogin?: () => void;
  user: any;
  isOpen?: boolean;
  onClose?: () => void;
}

export const StudentSidebar = ({ activeTab, setActiveTab, onLogout, onLogin, user, isOpen, onClose }: SidebarProps) => {
  const [counts, setCounts] = useState({
    bookings: 0,
    messages: 0
  });

  useEffect(() => {
    if (!user?.id) return;

    const fetchCounts = async () => {
      // Fetch Bookings Count
      const { count: bookingsCount } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', user.id)
        .eq('status', 'Pending');
      
      // Fetch Messages Count
      const { count: messagesCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .eq('read', false);

      setCounts({
        bookings: bookingsCount || 0,
        messages: messagesCount || 0
      });
    };

    fetchCounts();

    // Subscribe to changes
    const bookingsChannel = supabase
      .channel('sidebar_bookings')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'bookings',
        filter: `student_id=eq.${user.id}`
      }, fetchCounts)
      .subscribe();

    const messagesChannel = supabase
      .channel('sidebar_messages')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'messages'
      }, fetchCounts)
      .subscribe();

    return () => {
      supabase.removeChannel(bookingsChannel);
      supabase.removeChannel(messagesChannel);
    };
  }, [user?.id]);

  const menuItems = [
    { id: 'browse', label: 'Browse Listings', icon: <Search className="w-5 h-5" /> },
    { id: 'bookings', label: 'My Bookings', icon: <Calendar className="w-5 h-5" />, badge: counts.bookings, protected: true },
    { id: 'saved', label: 'Saved Properties', icon: <Heart className="w-5 h-5" />, protected: true },
    { id: 'messages', label: 'Messages', icon: <MessageSquare className="w-5 h-5" />, badge: counts.messages, protected: true },
    { id: 'verification', label: 'Verification', icon: <ShieldCheck className="w-5 h-5" />, protected: true },
    { id: 'reviews', label: 'My Reviews', icon: <Star className="w-5 h-5" />, protected: true },
    { id: 'report', label: 'Report Fraud', icon: <AlertTriangle className="w-5 h-5" />, protected: true },
    { id: 'feedback', label: 'Feedback & Support', icon: <MessageSquare className="w-5 h-5" />, protected: true },
    { id: 'profile', label: 'My Profile', icon: <LayoutDashboard className="w-5 h-5" />, protected: true },
  ];

  const visibleMenuItems = user ? menuItems : menuItems.filter(item => !item.protected);

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`w-72 bg-[#0F172A] border-r border-slate-800 flex flex-col fixed h-screen z-50 transition-transform duration-300 lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-orange-500 p-1.5 rounded-lg">
              <Shield className="w-6 h-6 text-white" fill="currentColor" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-white tracking-tight">VerifiedStudentShousing</span>
              <span className="text-[10px] text-slate-400 font-medium">Student Portal</span>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
        {visibleMenuItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all ${
              activeTab === item.id 
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              {item.icon}
              <span className="text-sm font-bold">{item.label}</span>
            </div>
            {item.badge !== undefined && item.badge > 0 && (
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                activeTab === item.id ? 'bg-white text-orange-500' : 'bg-red-500 text-white'
              }`}>
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      <div className="p-6 border-t border-slate-800">
        {user ? (
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-500 transition-all font-bold text-sm"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        ) : (
          <button 
            onClick={onLogin}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-orange-500 text-white hover:bg-orange-600 transition-all font-bold text-sm shadow-lg shadow-orange-500/20"
          >
            <LogOut className="w-5 h-5 rotate-180" />
            Login / Signup
          </button>
        )}
      </div>
    </aside>
  </>
);
};
