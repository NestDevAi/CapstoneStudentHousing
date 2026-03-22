import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, Home, ArrowUpRight, ArrowDownRight, Calendar } from 'lucide-react';
import { motion } from 'motion/react';
import { db as supabase } from '../../../lib/db';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

const DATA = [
  { name: 'Jan', views: 400, inquiries: 240, bookings: 120 },
  { name: 'Feb', views: 300, inquiries: 139, bookings: 80 },
  { name: 'Mar', views: 200, inquiries: 980, bookings: 200 },
  { name: 'Apr', views: 278, inquiries: 390, bookings: 150 },
  { name: 'May', views: 189, inquiries: 480, bookings: 180 },
  { name: 'Jun', views: 239, inquiries: 380, bookings: 190 },
];

export const Analytics = ({ user }: { user: any }) => {
  const [stats, setStats] = useState({
    totalProperties: 0,
    totalBookings: 0,
    pendingBookings: 0,
    approvedBookings: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    const fetchStats = async () => {
      // Fetch listings count
      const { count: listingsCount, error: listingsError } = await supabase
        .from('listings')
        .select('*', { count: 'exact', head: true })
        .eq('landlord_id', user.id);

      // Fetch bookings stats
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('status')
        .eq('landlord_id', user.id);

      if (!listingsError && !bookingsError) {
        setStats({
          totalProperties: listingsCount || 0,
          totalBookings: bookingsData?.length || 0,
          pendingBookings: bookingsData?.filter(b => b.status === 'Pending').length || 0,
          approvedBookings: bookingsData?.filter(b => b.status === 'Approved').length || 0
        });
      }
      setLoading(false);
    };

    fetchStats();

    // Set up real-time subscriptions
    const listingsSubscription = supabase
      .channel('listings_stats')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'listings', filter: `landlord_id=eq.${user.id}` }, fetchStats)
      .subscribe();

    const bookingsSubscription = supabase
      .channel('bookings_stats')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings', filter: `landlord_id=eq.${user.id}` }, fetchStats)
      .subscribe();

    return () => {
      listingsSubscription.unsubscribe();
      bookingsSubscription.unsubscribe();
    };
  }, [user?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Analytics</h2>
          <p className="text-slate-500 text-sm">Track your property performance and revenue</p>
        </div>
        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
          <button className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-900 transition-all">Last 7 Days</button>
          <button className="px-4 py-2 text-xs font-bold bg-[#0F172A] text-white rounded-xl shadow-lg">Last 30 Days</button>
          <button className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-900 transition-all">Last Year</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Properties', value: stats.totalProperties.toString(), trend: '+0%', up: true, icon: <Home className="text-blue-500" /> },
          { label: 'Total Bookings', value: stats.totalBookings.toString(), trend: '+0%', up: true, icon: <BarChart3 className="text-emerald-500" /> },
          { label: 'Pending Requests', value: stats.pendingBookings.toString(), trend: '+0%', up: true, icon: <Users className="text-orange-500" /> },
          { label: 'Occupancy Rate', value: stats.totalProperties > 0 ? `${Math.round((stats.approvedBookings / stats.totalProperties) * 100)}%` : '0%', trend: '+0%', up: true, icon: <TrendingUp className="text-purple-500" /> },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center">
                {stat.icon}
              </div>
              <div className={`flex items-center gap-1 text-xs font-bold ${stat.up ? 'text-emerald-500' : 'text-red-500'}`}>
                {stat.up ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                {stat.trend}
              </div>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
            <p className="text-3xl font-black text-slate-900">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[48px] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-slate-900">Property Performance</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Views</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bookings</span>
              </div>
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={DATA}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 700 }}
                />
                <Area type="monotone" dataKey="views" stroke="#f97316" fillOpacity={1} fill="url(#colorViews)" strokeWidth={3} />
                <Area type="monotone" dataKey="bookings" stroke="#3b82f6" fillOpacity={1} fill="url(#colorBookings)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[48px] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-slate-900">Inquiry Volume</h3>
            <select className="bg-slate-50 border-none rounded-xl px-4 py-2 text-xs font-bold text-slate-600 outline-none">
              <option>Monthly</option>
              <option>Weekly</option>
            </select>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={DATA}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 700 }}
                />
                <Bar dataKey="inquiries" fill="#f97316" radius={[6, 6, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
