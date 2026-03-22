import React, { useState, useEffect } from 'react';
import { Users, ShieldCheck, AlertCircle, Eye, MessageSquare, Star, MoreHorizontal } from 'lucide-react';
import { motion } from 'motion/react';
import { db as supabase } from '../../../lib/db';

export const TenantScreening = ({ user }: { user: any }) => {
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    // We consider accepted bookings as current tenants
    const fetchTenants = async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('landlord_id', user.id)
        .eq('status', 'Approved');
      
      if (error) {
        console.error('Error fetching tenants:', error);
      } else {
        setTenants(data || []);
      }
      setLoading(false);
    };

    fetchTenants();

    // Set up real-time subscription
    const subscription = supabase
      .channel('tenants_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'bookings',
        filter: `landlord_id=eq.${user.id}`
      }, fetchTenants)
      .subscribe();

    return () => {
      subscription.unsubscribe();
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
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Tenant Screening</h2>
        <p className="text-slate-500 text-sm">Monitor current tenants and their verification status</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Tenants', value: tenants.length.toString(), icon: <Users className="text-blue-500" />, bg: 'bg-blue-50' },
          { label: 'Verified Tenants', value: tenants.length.toString(), icon: <ShieldCheck className="text-emerald-500" />, bg: 'bg-emerald-50' },
          { label: 'Active Leases', value: tenants.length.toString(), icon: <AlertCircle className="text-orange-500" />, bg: 'bg-orange-50' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white p-8 rounded-[40px] border border-slate-100 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{stat.label}</p>
              <p className="text-4xl font-black text-slate-900">{stat.value}</p>
            </div>
            <div className={`w-14 h-14 ${stat.bg} rounded-2xl flex items-center justify-center`}>
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tenant</th>
                <th className="px-8 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Property</th>
                <th className="px-8 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Move-in Date</th>
                <th className="px-8 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Duration</th>
                <th className="px-8 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {tenants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-12 text-center text-slate-400 font-medium">
                    No active tenants found.
                  </td>
                </tr>
              ) : (
                tenants.map((tenant, idx) => (
                  <motion.tr 
                    key={tenant.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="hover:bg-slate-50/50 transition-colors group"
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 font-bold">
                          {tenant.student_name?.charAt(0) || 'T'}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{tenant.student_name || 'Tenant'}</p>
                          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
                            <ShieldCheck className="w-3 h-3" /> Verified
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-xs text-slate-500 font-medium max-w-[150px] line-clamp-2">{tenant.listing_title}</p>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-xs text-slate-500 font-medium">{tenant.move_in_date}</p>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-xs text-slate-500 font-medium">{tenant.duration} months</p>
                    </td>
                    <td className="px-8 py-6">
                      <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600">
                        Active Lease
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all">
                          <MessageSquare className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
