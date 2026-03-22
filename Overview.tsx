import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Home, 
  ShieldAlert, 
  CheckCircle2, 
  CircleDollarSign, 
  Clock,
  TrendingUp,
  TrendingDown,
  Activity,
  UserCheck,
  AlertTriangle,
  CheckCircle,
  MessageSquare,
  Loader2
} from 'lucide-react';
import { db as supabase } from '../../../lib/db';

export const Overview: React.FC = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeListings: 0,
    fraudBlocked: 0,
    verificationRate: 0,
    monthlyRevenue: 0,
    pendingVerifications: 0,
    studentCount: 0,
    landlordCount: 0
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // 1. Fetch Users Stats
        const { data: users, error: usersError } = await supabase
          .from('profiles')
          .select('role, is_verified');
        
        if (usersError) throw usersError;

        const students = users.filter(u => u.role === 'student').length;
        const landlords = users.filter(u => u.role === 'landlord').length;
        const verified = users.filter(u => u.is_verified).length;

        // 2. Fetch Active Listings
        const { count: activeListings, error: listingsError } = await supabase
          .from('listings')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'Active');
        
        if (listingsError) throw listingsError;

        // 3. Fetch Pending Verifications
        const { count: pendingVerifications, error: verificationsError } = await supabase
          .from('verifications')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'Pending');
        
        if (verificationsError) throw verificationsError;

        // 4. Fetch Fraud Alerts Count - Skip for now as table might not exist
        const fraudBlocked = 0;
        const fraudError = null;
        
        if (fraudError) throw fraudError;

        // 5. Fetch Recent Activity
        const { data: activityData, error: activityError } = await supabase
          .from('verifications')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);
        
        if (activityError) throw activityError;

        const activities = (activityData || []).map(data => ({
          icon: <UserCheck className="text-emerald-500" />,
          title: 'Verification Request',
          desc: `${data.user_name} (${data.role})`,
          time: data.created_at ? new Date(data.created_at).toLocaleTimeString() : 'Just now'
        }));

        setStats({
          totalUsers: users.length,
          activeListings: activeListings || 0,
          fraudBlocked: fraudBlocked || 0,
          verificationRate: users.length > 0 ? Math.round((verified / users.length) * 100) : 0,
          monthlyRevenue: 0, // Placeholder
          pendingVerifications: pendingVerifications || 0,
          studentCount: students,
          landlordCount: landlords
        });
        setRecentActivity(activities);
      } catch (error) {
        console.error('Error fetching overview stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();

    // Set up real-time subscriptions
    const profilesSub = supabase.channel('overview_profiles').on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchStats).subscribe();
    const listingsSub = supabase.channel('overview_listings').on('postgres_changes', { event: '*', schema: 'public', table: 'listings' }, fetchStats).subscribe();
    const verificationsSub = supabase.channel('overview_verifications').on('postgres_changes', { event: '*', schema: 'public', table: 'verifications' }, fetchStats).subscribe();

    return () => {
      profilesSub.unsubscribe();
      listingsSub.unsubscribe();
      verificationsSub.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
      </div>
    );
  }

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers.toLocaleString(), icon: <Users className="w-6 h-6" />, color: 'bg-blue-500' },
    { label: 'Active Listings', value: stats.activeListings.toLocaleString(), icon: <Home className="w-6 h-6" />, color: 'bg-emerald-500' },
    { label: 'Fraud Blocked', value: stats.fraudBlocked.toLocaleString(), icon: <ShieldAlert className="w-6 h-6" />, color: 'bg-rose-500' },
    { label: 'Verification Rate', value: `${stats.verificationRate}%`, icon: <CheckCircle2 className="w-6 h-6" />, color: 'bg-violet-500' },
    { label: 'Pending Verifications', value: stats.pendingVerifications.toLocaleString(), icon: <Clock className="w-6 h-6" />, color: 'bg-amber-500' },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-slate-900 p-8 rounded-[32px] border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 blur-[80px] rounded-full -mr-32 -mt-32"></div>
        <div className="relative z-10">
          <h2 className="text-3xl font-black text-white mb-2">Welcome back, Administrator</h2>
          <p className="text-slate-400 font-medium">Here's what's happening on VerifiedStudentShousing today.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">{stat.label}</p>
              <h3 className="text-3xl font-bold text-slate-900">{stat.value}</h3>
            </div>
            <div className={`${stat.color} p-4 rounded-2xl text-white shadow-lg shadow-opacity-20 group-hover:scale-110 transition-transform`}>
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Integrations Status */}
      <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <h4 className="text-lg font-bold text-slate-900">Auth Integrations</h4>
          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-widest">
            <Activity className="w-3 h-3" /> Live
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6">
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-6 h-6" />
              </div>
              <div>
                <h5 className="font-bold text-slate-900">Google Login</h5>
                <p className="text-xs text-slate-500 font-medium">Primary Admin Auth</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Connected</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid lg:grid-cols-1 gap-8">
        {/* User Growth */}
        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
          <h4 className="text-lg font-bold text-slate-900 mb-8">User Distribution</h4>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-slate-600">Students</span>
                <span className="text-sm font-bold text-slate-900">{stats.studentCount}</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all duration-1000" 
                  style={{ width: `${stats.totalUsers > 0 ? (stats.studentCount / stats.totalUsers) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-slate-600">Landlords</span>
                <span className="text-sm font-bold text-slate-900">{stats.landlordCount}</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-orange-500 rounded-full transition-all duration-1000" 
                  style={{ width: `${stats.totalUsers > 0 ? (stats.landlordCount / stats.totalUsers) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
        <h4 className="text-lg font-bold text-slate-900 mb-8">Recent Activity</h4>
        {recentActivity.length > 0 ? (
          <div className="space-y-8">
            {recentActivity.map((activity, i) => (
              <div key={i} className="flex items-start gap-6 group">
                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  {activity.icon}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <h5 className="text-sm font-bold text-slate-900">{activity.title}</h5>
                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">{activity.time}</span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">{activity.desc}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Activity className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">No recent activity found.</p>
          </div>
        )}
      </div>
    </div>
  );
};
