import React, { useState, useEffect } from 'react';
import { 
  Flag, 
  Search, 
  Filter, 
  Download,
  AlertTriangle,
  Trash2,
  Ban,
  User,
  Clock,
  Home,
  CheckCircle,
  Eye,
  Loader2,
  X
} from 'lucide-react';
import { db as supabase } from '../../../lib/db';
import { createAuditLog } from '../../../utils/auditLogger';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useNotification } from '../../../contexts/NotificationContext';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Report {
  id: string;
  listing_id: string;
  listing_title?: string;
  reporter_id: string;
  reporter_name?: string;
  reason: string;
  description?: string;
  status: 'Pending' | 'Reviewed' | 'Action Taken' | 'Dismissed';
  created_at: any;
}

export const ReportedListings: React.FC = () => {
  const { showNotification } = useNotification();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching reports:', error);
    } else {
      setReports(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReports();

    const subscription = supabase
      .channel('reports_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, fetchReports)
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('reports')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
      showNotification(`Report status updated to ${status}.`, 'success');
    } catch (error) {
      console.error('Error updating report:', error);
      showNotification('Failed to update report status.', 'error');
    }
  };

  const handleSuspendListing = async (listingId: string, reportId: string) => {
    showNotification(
      'Are you sure you want to suspend this listing? It will no longer be visible to students.',
      'info',
      {
        label: 'Suspend',
        onClick: async () => {
          try {
            const { data: listingData, error: fetchError } = await supabase
              .from('listings')
              .select('status, title')
              .eq('id', listingId)
              .single();
            
            if (fetchError) throw fetchError;

            const oldStatus = listingData?.status || 'Unknown';
            const listingTitle = listingData?.title || 'Unknown Property';

            const { error: updateListingError } = await supabase
              .from('listings')
              .update({ status: 'Suspended' })
              .eq('id', listingId);
            
            if (updateListingError) throw updateListingError;

            const { error: updateReportError } = await supabase
              .from('reports')
              .update({ status: 'Action Taken' })
              .eq('id', reportId);
            
            if (updateReportError) throw updateReportError;

            await createAuditLog({
              action: 'Suspend Property',
              targetId: listingId,
              type: 'property',
              details: `Property suspended due to report. Status changed from ${oldStatus} to Suspended. Property: ${listingTitle}`
            });

            showNotification('Listing suspended successfully.', 'success');
          } catch (error) {
            console.error('Error suspending listing:', error);
            showNotification('Failed to suspend listing.', 'error');
          }
        }
      }
    );
  };

  const handleDeleteListing = async (listingId: string, reportId: string) => {
    showNotification(
      'Are you sure you want to remove this listing and mark the report as Action Taken?',
      'info',
      {
        label: 'Remove',
        onClick: async () => {
          try {
            const { data: listingData, error: fetchError } = await supabase
              .from('listings')
              .select('title')
              .eq('id', listingId)
              .single();
            
            if (fetchError) throw fetchError;

            const listingTitle = listingData?.title || 'Unknown Property';

            const { error: deleteListingError } = await supabase
              .from('listings')
              .delete()
              .eq('id', listingId);
            
            if (deleteListingError) throw deleteListingError;

            const { error: updateReportError } = await supabase
              .from('reports')
              .update({ status: 'Action Taken' })
              .eq('id', reportId);
            
            if (updateReportError) throw updateReportError;

            await createAuditLog({
              action: 'Delete Property',
              targetId: listingId,
              type: 'property',
              details: `Property deleted due to report. Property: ${listingTitle}`
            });

            showNotification('Listing removed successfully.', 'success');
          } catch (error) {
            console.error('Error removing listing:', error);
            showNotification('Failed to remove listing.', 'error');
          }
        }
      }
    );
  };

  const stats = [
    { label: 'Total Reports', value: reports.length, sub: 'All time', color: 'text-blue-500' },
    { label: 'Pending', value: reports.filter(r => r.status === 'Pending').length, sub: 'Requires review', color: 'text-amber-500' },
    { label: 'Action Taken', value: reports.filter(r => r.status === 'Action Taken').length, sub: 'Listings removed', color: 'text-rose-500' },
    { label: 'Reviewed/Dismissed', value: reports.filter(r => r.status === 'Reviewed' || r.status === 'Dismissed').length, sub: 'Cases closed', color: 'text-emerald-500' },
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
          <div key={i} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm group hover:shadow-md transition-all">
            <p className="text-sm font-medium text-slate-500 mb-1">{stat.label}</p>
            <h3 className="text-3xl font-bold text-slate-900 mb-2">{stat.value}</h3>
            <p className={cn("text-[10px] font-bold uppercase tracking-wider", stat.color)}>{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Reported Listings List */}
      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
          <h4 className="text-lg font-bold text-slate-900">Property Reports</h4>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all">
              <Filter className="w-4 h-4" /> Filter
            </button>
          </div>
        </div>

        <div className="divide-y divide-slate-50">
          {reports.length === 0 ? (
            <div className="p-12 text-center text-slate-400 font-medium">
              No reported listings found.
            </div>
          ) : (
            reports.map((report) => (
              <div key={report.id} className="p-8 hover:bg-slate-50/50 transition-all group">
                <div className="flex items-start gap-6">
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform bg-orange-50 text-orange-500"
                  )}>
                    <Flag className="w-7 h-7" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-lg font-bold text-slate-900">{report.listing_title || 'Unknown Listing'}</h5>
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                        report.status === 'Pending' ? 'bg-amber-100 text-amber-600' : 
                        report.status === 'Reviewed' ? 'bg-blue-100 text-blue-600' : 
                        report.status === 'Dismissed' ? 'bg-slate-100 text-slate-600' :
                        report.status === 'Action Taken' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'
                      )}>
                        {report.status}
                      </span>
                    </div>
                    <p className="text-slate-500 font-medium mb-4">ID: {report.listing_id} • Reason: {report.reason}</p>
                    
                    <div className="flex items-center gap-6 text-xs font-medium text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" /> Reported by: <span className="text-slate-900">{report.reporter_name || 'Anonymous'}</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> {report.created_at ? new Date(report.created_at).toLocaleString() : 'Recently'}
                      </span>
                    </div>

                    {report.description && (
                      <div className="mt-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                        <p className="text-sm text-slate-600 italic">"{report.description}"</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-start">
                    {report.status === 'Pending' && (
                      <>
                        <button 
                          onClick={() => handleStatusUpdate(report.id, 'Reviewed')}
                          className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-all flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" /> Review
                        </button>
                        <button 
                          onClick={() => handleStatusUpdate(report.id, 'Dismissed')}
                          className="px-4 py-2 bg-slate-100 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-200 transition-all flex items-center gap-2"
                        >
                          <X className="w-4 h-4" /> Dismiss
                        </button>
                      </>
                    )}
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleSuspendListing(report.listingId, report.id)}
                        className="px-4 py-2 bg-amber-500 text-white text-xs font-bold rounded-xl hover:bg-amber-600 transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20"
                        title="Suspend Listing"
                      >
                        <Ban className="w-4 h-4" /> Suspend
                      </button>
                      <button 
                        onClick={() => handleDeleteListing(report.listingId, report.id)}
                        className="px-4 py-2 bg-rose-500 text-white text-xs font-bold rounded-xl hover:bg-rose-600 transition-all flex items-center gap-2 shadow-lg shadow-rose-500/20"
                        title="Delete Listing"
                      >
                        <Trash2 className="w-4 h-4" /> Delete
                      </button>
                    </div>
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
