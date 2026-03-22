import React, { useState, useEffect } from 'react';
import { 
  Home, 
  Calendar, 
  Users, 
  MessageSquare, 
  FileText, 
  BarChart3, 
  AlertCircle, 
  ShieldCheck,
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
  user: any;
  isOpen?: boolean;
  onClose?: () => void;
}

export const LandlordSidebar = ({ activeTab, setActiveTab, onLogout, user, isOpen, onClose }: SidebarProps) => {
  const [counts, setCounts] = useState({
    requests: 0,
    messages: 0
  });

  useEffect(() => {
    if (!user?.id) return;

    const fetchCounts = async () => {
      // Fetch pending booking requests count
      const { count: requestsCount } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('landlord_id', user.id)
        .eq('status', 'Pending');

      // Fetch unread messages count
      const { count: messagesCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .eq('read', false);

      setCounts(prev => ({
        ...prev,
        requests: requestsCount || 0,
        messages: messagesCount || 0
      }));
    };

    fetchCounts();

    // Set up real-time subscriptions
    const bookingsSubscription = supabase
      .channel('bookings_counts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings', filter: `landlord_id=eq.${user.id}` }, fetchCounts)
      .subscribe();

    const messagesSubscription = supabase
      .channel('messages_counts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, fetchCounts)
      .subscribe();

    return () => {
      bookingsSubscription.unsubscribe();
      messagesSubscription.unsubscribe();
    };
  }, [user?.id]);

  const menuItems = [
    { id: 'properties', label: 'My Properties', icon: <Home className="w-5 h-5" /> },
    { id: 'requests', label: 'Booking Requests', icon: <Calendar className="w-5 h-5" />, badge: counts.requests },
    { id: 'screening', label: 'Tenant Screening', icon: <Users className="w-5 h-5" /> },
    { id: 'messages', label: 'Messages', icon: <MessageSquare className="w-5 h-5" />, badge: counts.messages },
    { id: 'documents', label: 'Documents', icon: <FileText className="w-5 h-5" /> },
    { id: 'verification', label: 'Verification', icon: <ShieldCheck className="w-5 h-5" /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'calendar', label: 'Calendar', icon: <Calendar className="w-5 h-5" /> },
    { id: 'feedback', label: 'Feedback & Support', icon: <MessageSquare className="w-5 h-5" /> },
    { id: 'profile', label: 'My Profile', icon: <LayoutDashboard className="w-5 h-5" /> },
  ];

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
              <span className="text-xl font-bold text-white tracking-tight">Landlord Portal</span>
              <span className="text-[10px] text-slate-400 font-medium">Property Management</span>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
        {menuItems.map(item => (
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
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-500 transition-all font-bold text-sm"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </aside>
  </>
);
};
