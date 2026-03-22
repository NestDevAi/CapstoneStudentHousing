import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle, 
  ShieldCheck,
  Filter,
  RefreshCw,
  Search,
  MoreVertical,
  Eye, 
  Trash2, 
  Shield,
  Clock,
  Loader2
} from 'lucide-react';
import { db as supabase } from '../../../lib/db';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useNotification } from '../../../contexts/NotificationContext';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface FraudAlert {
  id: string;
  title: string;
  description: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'New' | 'Investigating' | 'Resolved';
  reported_by?: string;
  created_at: any;
}

export const FraudDetection: React.FC = () => {
  const { showNotification } = useNotification();
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    const { data, error } = await supabase
      .from('fraud_alerts')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching fraud alerts:', error);
    } else {
      setAlerts(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAlerts();

    const subscription = supabase
      .channel('fraud_alerts_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'fraud_alerts' }, fetchAlerts)
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleAction = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('fraud_alerts')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    } catch (error) {
      console.error('Error updating alert:', error);
    }
  };

  const handleDelete = async (id: string) => {
    showNotification(
      'Are you sure you want to delete this alert?',
      'info',
      {
        label: 'Delete',
        onClick: async () => {
          try {
            const { error } = await supabase
              .from('fraud_alerts')
              .delete()
              .eq('id', id);
            if (error) throw error;
            showNotification('Alert deleted successfully.', 'success');
          } catch (error) {
            console.error('Error deleting alert:', error);
            showNotification('Failed to delete alert.', 'error');
          }
        }
      }
    );
  };

  const stats = [
    { label: 'Critical Alerts', value: alerts.filter(a => a.priority === 'CRITICAL' && a.status !== 'Resolved').length, icon: <AlertTriangle className="w-6 h-6" />, color: 'bg-rose-500', light: 'bg-rose-50' },
    { label: 'High Priority', value: alerts.filter(a => a.priority === 'HIGH' && a.status !== 'Resolved').length, icon: <ShieldAlert className="w-6 h-6" />, color: 'bg-orange-500', light: 'bg-orange-50' },
    { label: 'Resolved Today', value: alerts.filter(a => a.status === 'Resolved').length, icon: <CheckCircle className="w-6 h-6" />, color: 'bg-emerald-500', light: 'bg-emerald-50' },
    { label: 'Total Alerts', value: alerts.length, icon: <ShieldCheck className="w-6 h-6" />, color: 'bg-blue-500', light: 'bg-blue-50' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-6 group hover:shadow-md transition-all">
            <div className={cn(stat.light, "p-4 rounded-2xl group-hover:scale-110 transition-transform")}>
              <div className={cn("text-white p-2 rounded-lg", stat.color)}>
                {stat.icon}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">{stat.label}</p>
              <h3 className="text-3xl font-bold text-slate-900">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Active Alerts List */}
      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
          <h4 className="text-lg font-bold text-slate-900">Active Fraud Alerts</h4>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all">
              <Filter className="w-4 h-4" /> Filter
            </button>
          </div>
        </div>

        <div className="divide-y divide-slate-50">
          {alerts.length === 0 ? (
            <div className="p-12 text-center text-slate-400 font-medium">
              No fraud alerts found.
            </div>
          ) : (
            alerts.map((alert) => (
              <div key={alert.id} className="p-8 hover:bg-slate-50/50 transition-all group">
                <div className="flex items-start gap-6">
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform",
                    alert.priority === 'CRITICAL' ? 'bg-rose-50 text-rose-500' : 
                    alert.priority === 'HIGH' ? 'bg-orange-50 text-orange-500' : 'bg-blue-50 text-blue-500'
                  )}>
                    <ShieldAlert className="w-7 h-7" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-lg font-bold text-slate-900">{alert.title}</h5>
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                        alert.status === 'New' ? 'bg-blue-100 text-blue-600' : 
                        alert.status === 'Investigating' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
                      )}>
                        {alert.status}
                      </span>
                    </div>
                    <p className="text-slate-500 font-medium mb-4">{alert.description}</p>
                    
                    <div className="flex items-center gap-6 text-xs font-medium text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <Search className="w-3.5 h-3.5" /> Reported by: <span className="text-slate-900">{alert.reported_by || 'System'}</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> {alert.created_at ? new Date(alert.created_at).toLocaleString() : 'Recently'}
                      </span>
                      <span className={cn(
                        "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest",
                        alert.priority === 'CRITICAL' ? 'bg-rose-500 text-white' : 
                        alert.priority === 'HIGH' ? 'bg-orange-500 text-white' : 'bg-blue-500 text-white'
                      )}>
                        {alert.priority}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {alert.status !== 'Investigating' && alert.status !== 'Resolved' && (
                      <button 
                        onClick={() => handleAction(alert.id, 'Investigating')}
                        className="px-5 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-all"
                      >
                        Investigate
                      </button>
                    )}
                    {alert.status !== 'Resolved' && (
                      <button 
                        onClick={() => handleAction(alert.id, 'Resolved')}
                        className="px-5 py-2.5 bg-emerald-500 text-white text-sm font-bold rounded-xl hover:bg-emerald-600 transition-all"
                      >
                        Resolve
                      </button>
                    )}
                    <button 
                      onClick={() => handleDelete(alert.id)}
                      className="p-2.5 border border-slate-200 text-rose-500 rounded-xl hover:bg-rose-50 transition-all"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
