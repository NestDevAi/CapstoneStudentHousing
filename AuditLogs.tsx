import React, { useState, useEffect } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  Download,
  Calendar,
  User,
  Activity,
  ShieldAlert,
  Home,
  MessageSquare,
  Eye,
  ChevronLeft,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { db as supabase } from '../../../lib/db';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AuditLog {
  id: string;
  action: string;
  adminId?: string;
  adminName: string;
  targetId: string;
  details: string;
  type: 'user' | 'property' | 'fraud' | 'support' | 'system';
  createdAt: any;
}

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [adminFilter, setAdminFilter] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    admin: 0,
    system: 0,
    critical: 0
  });

  useEffect(() => {
    const fetchLogs = async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) {
        console.error('Error fetching audit logs:', error);
      } else {
        const formattedLogs = (data || []).map(log => ({
          id: log.id,
          action: log.action,
          adminId: log.admin_id,
          adminName: log.admin_name || 'AI System',
          targetId: log.target_id,
          details: typeof log.details === 'object' ? JSON.stringify(log.details) : log.details,
          type: log.target_type || 'system',
          createdAt: log.created_at
        }));
        setLogs(formattedLogs as any);
        
        setStats({
          total: formattedLogs.length,
          admin: formattedLogs.filter(l => l.adminName !== 'AI System').length,
          system: formattedLogs.filter(l => l.adminName === 'AI System').length,
          critical: formattedLogs.filter(l => l.type === 'fraud').length
        });
      }
      setLoading(false);
    };

    fetchLogs();

    const subscription = supabase
      .channel('audit_logs_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'audit_logs' }, fetchLogs)
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.adminName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.targetId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || log.type === typeFilter;
    const matchesAdmin = adminFilter === 'all' || 
      (adminFilter === 'AI System' ? log.adminName === 'AI System' : log.adminName !== 'AI System');

    const logDate = log.createdAt ? new Date(log.createdAt) : new Date();
    const now = new Date();
    let matchesDate = true;
    if (dateRange === '24h') {
      matchesDate = (now.getTime() - logDate.getTime()) <= 24 * 60 * 60 * 1000;
    } else if (dateRange === '7d') {
      matchesDate = (now.getTime() - logDate.getTime()) <= 7 * 24 * 60 * 60 * 1000;
    } else if (dateRange === '30d') {
      matchesDate = (now.getTime() - logDate.getTime()) <= 30 * 24 * 60 * 60 * 1000;
    }

    return matchesSearch && matchesType && matchesAdmin && matchesDate;
  });

  const handleExport = () => {
    if (filteredLogs.length === 0) return;

    const headers = ['Timestamp', 'Action', 'Admin', 'Target', 'Details', 'Type'];
    const csvRows = filteredLogs.map(log => {
      const timestamp = log.createdAt 
        ? new Date(log.createdAt).toLocaleString().replace(/"/g, '""') 
        : 'Recently';
      
      return [
        `"${timestamp}"`,
        `"${(log.action || '').replace(/"/g, '""')}"`,
        `"${(log.adminName || '').replace(/"/g, '""')}"`,
        `"${(log.targetId || '').replace(/"/g, '""')}"`,
        `"${(log.details || '').replace(/"/g, '""')}"`,
        `"${(log.type || '').replace(/"/g, '""')}"`
      ].join(',');
    });

    const csvContent = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
        {[
          { label: 'Total Actions', value: stats.total, sub: 'Recent logs', color: 'text-blue-500' },
          { label: 'Admin Actions', value: stats.admin, sub: 'Manual interventions', color: 'text-orange-500' },
          { label: 'System Actions', value: stats.system, sub: 'Automated processes', color: 'text-emerald-500' },
          { label: 'Critical Actions', value: stats.critical, sub: 'Requires review', color: 'text-rose-500' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm group hover:shadow-md transition-all">
            <p className="text-sm font-medium text-slate-500 mb-1">{stat.label}</p>
            <h3 className="text-3xl font-bold text-slate-900 mb-2">{stat.value}</h3>
            <p className={cn("text-[10px] font-bold uppercase tracking-wider", stat.color)}>{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm grid md:grid-cols-4 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Date Range</label>
          <select 
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all"
          >
            <option value="all">All Time</option>
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Action Type</label>
          <select 
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all"
          >
            <option value="all">All Actions</option>
            <option value="user">User Management</option>
            <option value="property">Property Verification</option>
            <option value="fraud">Fraud Detection</option>
            <option value="support">Support</option>
            <option value="system">System</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Admin User</label>
          <select 
            value={adminFilter}
            onChange={(e) => setAdminFilter(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all"
          >
            <option value="all">All Admins</option>
            <option value="Admin User">Manual Admins</option>
            <option value="AI System">AI System</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Search</label>
          <div className="relative group">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-orange-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search logs..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
          <h4 className="text-lg font-bold text-slate-900">Audit Log Entries</h4>
          <button 
            onClick={handleExport}
            disabled={filteredLogs.length === 0}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" /> Export Logs
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Timestamp</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Action</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Admin</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Target</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Details</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-12 text-center text-slate-400 font-medium">
                    No audit logs found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-all group">
                    <td className="px-8 py-5">
                      <p className="text-xs text-slate-500 font-medium">
                        {log.createdAt ? new Date(log.createdAt).toLocaleString() : 'Recently'}
                      </p>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                          log.type === 'user' ? 'bg-blue-50 text-blue-500' : 
                          log.type === 'property' ? 'bg-emerald-50 text-emerald-500' : 
                          log.type === 'fraud' ? 'bg-rose-50 text-rose-500' : 
                          log.type === 'support' ? 'bg-violet-50 text-violet-500' : 'bg-slate-50 text-slate-500'
                        )}>
                          {log.type === 'user' ? <User className="w-4 h-4" /> : 
                           log.type === 'property' ? <Home className="w-4 h-4" /> : 
                           log.type === 'fraud' ? <ShieldAlert className="w-4 h-4" /> : 
                           log.type === 'support' ? <MessageSquare className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
                        </div>
                        <p className="text-sm font-bold text-slate-900">{log.action}</p>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className={cn(
                        "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider",
                        log.adminName === 'AI System' ? 'bg-violet-50 text-violet-600' : 'bg-blue-50 text-blue-600'
                      )}>
                        {log.adminName}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-sm font-bold text-slate-900">{log.targetId}</p>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-xs text-slate-500 font-medium">{log.details}</p>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
