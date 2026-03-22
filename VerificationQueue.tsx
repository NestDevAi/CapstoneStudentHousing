import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Filter,
  ArrowUpDown,
  FileText,
  Check,
  X,
  Home,
  User,
  Eye,
  MessageSquare,
  Loader2
} from 'lucide-react';
import { db as supabase } from '../../../lib/db';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useNotification } from '../../../contexts/NotificationContext';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const VerificationQueue: React.FC = () => {
  const { showNotification } = useNotification();
  const [verifications, setVerifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'queue' | 'history'>('queue');
  const [selectedDoc, setSelectedDoc] = useState<{ url: string, title: string } | null>(null);

  useEffect(() => {
    const fetchVerifications = async () => {
      const { data, error } = await supabase
        .from('verifications')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching verifications:', error);
      } else {
        setVerifications(data || []);
      }
      setLoading(false);
    };

    fetchVerifications();

    // Set up real-time subscription
    const subscription = supabase
      .channel('verifications_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'verifications' }, fetchVerifications)
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const filteredVerifications = verifications.filter(v => {
    if (activeTab === 'queue') {
      return v.status === 'Pending' || v.status === 'More Info Required';
    } else {
      return v.status === 'Approved' || v.status === 'Rejected';
    }
  });

  const handleAction = async (item: any, status: 'Approved' | 'Rejected' | 'More Info Required' | 'Pending') => {
    const { id, user_id, listing_id, type } = item;
    setProcessingId(id);
    try {
      const adminNotes = status === 'More Info Required' ? prompt('Enter notes for the user:') : '';
      
      const { error: updateError } = await supabase
        .from('verifications')
        .update({
          status,
          admin_notes: adminNotes || '',
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (updateError) throw updateError;

      if (status === 'Approved') {
        if (type === 'Landlord Verification' || type === 'Student Verification') {
          const { error: userError } = await supabase
            .from('profiles')
            .update({
              is_verified: true,
              verification_status: 'Verified'
            })
            .eq('id', user_id);
          if (userError) throw userError;
        }

        if (listing_id) {
          const { error: listingError } = await supabase
            .from('listings')
            .update({ status: 'Active' })
            .eq('id', listing_id);
          if (listingError) throw listingError;
        }
      } else if (status === 'Rejected') {
        if (type === 'Landlord Verification' || type === 'Student Verification') {
          const { error: userError } = await supabase
            .from('profiles')
            .update({
              is_verified: false,
              verification_status: 'Rejected'
            })
            .eq('id', user_id);
          if (userError) throw userError;
        }
      }
      
      showNotification(`Verification ${status.toLowerCase()} successfully.`, 'success');

      // Log the action
      await supabase.from('audit_logs').insert({
        action: `Verification ${status}`,
        target_id: id,
        target_type: type === 'Property Verification' ? 'property' : 'user',
        details: { notes: adminNotes, type }
      });

    } catch (error) {
      console.error('Error updating verification:', error);
      showNotification('Failed to update verification.', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
      </div>
    );
  }

  const stats = [
    { label: 'Pending Review', value: verifications.filter(v => v.status === 'Pending').length, sub: 'Requires action', color: 'text-amber-500' },
    { label: 'More Info Needed', value: verifications.filter(v => v.status === 'More Info Required').length, sub: 'Waiting for user', color: 'text-blue-500' },
    { label: 'Approved', value: verifications.filter(v => v.status === 'Approved').length, sub: 'Verification complete', color: 'text-emerald-500' },
    { label: 'Rejected', value: verifications.filter(v => v.status === 'Rejected').length, sub: 'Access denied', color: 'text-rose-500' },
  ];

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

      {/* Queue List */}
      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h4 className="text-lg font-bold text-slate-900">Verification Center</h4>
            <div className="flex p-1 bg-slate-100 rounded-2xl">
              <button 
                onClick={() => setActiveTab('queue')}
                className={cn(
                  "px-6 py-2 rounded-xl text-sm font-bold transition-all",
                  activeTab === 'queue' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                Active Queue
              </button>
              <button 
                onClick={() => setActiveTab('history')}
                className={cn(
                  "px-6 py-2 rounded-xl text-sm font-bold transition-all",
                  activeTab === 'history' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                History (Bin)
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all">
              <Filter className="w-4 h-4" /> Filter
            </button>
          </div>
        </div>

        <div className="divide-y divide-slate-50">
          {filteredVerifications.length === 0 ? (
            <div className="p-12 text-center text-slate-400 font-medium">
              {activeTab === 'queue' ? 'No pending verification requests.' : 'No processed verifications in history.'}
            </div>
          ) : (
            filteredVerifications.map((item) => (
              <div key={item.id} className="p-8 hover:bg-slate-50/50 transition-all group">
                <div className="flex items-start gap-6">
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform",
                    item.role === 'landlord' ? 'bg-orange-50 text-orange-500' : 'bg-blue-50 text-blue-500'
                  )}>
                    {item.role === 'landlord' ? <Home className="w-7 h-7" /> : <User className="w-7 h-7" />}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-lg font-bold text-slate-900">{item.type || 'General Verification'}</h5>
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                        item.status === 'Pending' ? 'bg-amber-100 text-amber-600' : 
                        item.status === 'Rejected' ? 'bg-rose-100 text-rose-600' : 
                        item.status === 'More Info Required' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'
                      )}>
                        {item.status}
                      </span>
                    </div>
                    <p className="text-slate-500 font-medium mb-2">{item.user_email} • {item.user_name || 'User'}</p>
                    
                    {/* Extra Details */}
                    <div className="flex flex-wrap gap-x-6 gap-y-2 mb-4">
                      {item.property_title && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                          <span className="font-bold text-slate-500 uppercase tracking-wider">Property:</span> {item.property_title}
                        </div>
                      )}
                      {item.listing_id && !item.property_title && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                          <span className="font-bold text-slate-500 uppercase tracking-wider">Listing ID:</span> {item.listing_id}
                        </div>
                      )}
                      {item.university && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                          <span className="font-bold text-slate-500 uppercase tracking-wider">University:</span> {item.university} ({item.year_level})
                        </div>
                      )}
                      {item.student_id && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                          <span className="font-bold text-slate-500 uppercase tracking-wider">Student ID:</span> {item.student_id}
                        </div>
                      )}
                      {item.business_name && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                          <span className="font-bold text-slate-500 uppercase tracking-wider">Business:</span> {item.business_name}
                        </div>
                      )}
                      {item.tin && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                          <span className="font-bold text-slate-500 uppercase tracking-wider">TIN:</span> {item.tin}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-6 text-xs font-medium text-slate-400">
                      {item.gov_id_url && (
                        <button 
                          onClick={() => setSelectedDoc({ url: item.gov_id_url, title: 'Government ID' })}
                          className="flex items-center gap-1.5 text-orange-500 hover:text-orange-600"
                        >
                          <Eye className="w-3.5 h-3.5" /> Government ID
                        </button>
                      )}
                      {item.enrollment_cert_url && (
                        <button 
                          onClick={() => setSelectedDoc({ url: item.enrollment_cert_url, title: 'Enrollment Cert' })}
                          className="flex items-center gap-1.5 text-orange-500 hover:text-orange-600"
                        >
                          <Eye className="w-3.5 h-3.5" /> Enrollment Cert
                        </button>
                      )}
                      {item.property_proof_url && (
                        <button 
                          onClick={() => setSelectedDoc({ url: item.property_proof_url, title: 'Property Proof' })}
                          className="flex items-center gap-1.5 text-orange-500 hover:text-orange-600"
                        >
                          <Eye className="w-3.5 h-3.5" /> Property Proof
                        </button>
                      )}
                      {!item.gov_id_url && !item.enrollment_cert_url && !item.property_proof_url && (
                        <span className="flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5" /> {item.file_name || 'Document'}
                        </span>
                      )}
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> {item.created_at ? new Date(item.created_at).toLocaleString() : 'Recently'}
                      </span>
                    </div>

                    {item.admin_notes && (
                      <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-center gap-3">
                        <MessageSquare className="w-5 h-5 text-blue-500 shrink-0" />
                        <p className="text-sm font-bold text-blue-600">Admin Notes: {item.admin_notes}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-start">
                    {activeTab === 'queue' ? (
                      <>
                        <button className="p-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                          onClick={() => handleAction(item, 'Approved')}
                          disabled={processingId === item.id}
                          title="Approve"
                        >
                          <Check className="w-5 h-5" />
                        </button>
                        <button className="p-2.5 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20 disabled:opacity-50"
                          onClick={() => handleAction(item, 'Rejected')}
                          disabled={processingId === item.id}
                          title="Reject"
                        >
                          <X className="w-5 h-5" />
                        </button>
                        <button className="px-5 py-2.5 border border-slate-200 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-50 transition-all disabled:opacity-50"
                          onClick={() => handleAction(item, 'More Info Required')}
                          disabled={processingId === item.id}
                        >
                          Request More Info
                        </button>
                      </>
                    ) : (
                      <button 
                        onClick={() => handleAction(item, 'Pending')}
                        className="px-5 py-2.5 border border-slate-200 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-50 transition-all disabled:opacity-50"
                        disabled={processingId === item.id}
                      >
                        Restore to Queue
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Document Preview Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">{selectedDoc.title}</h3>
              <button 
                onClick={() => setSelectedDoc(null)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex items-center justify-center min-h-[400px]">
                {selectedDoc.url.toLowerCase().endsWith('.pdf') ? (
                  <iframe 
                    src={selectedDoc.url} 
                    className="w-full h-[600px]" 
                    title={selectedDoc.title}
                  />
                ) : (
                  <img 
                    src={selectedDoc.url} 
                    alt={selectedDoc.title} 
                    className="max-w-full h-auto"
                    referrerPolicy="no-referrer"
                  />
                )}
              </div>
            </div>
            <div className="p-8 bg-white border-t border-slate-50 flex justify-end gap-4">
              <a 
                href={selectedDoc.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="px-8 py-3 border border-slate-200 text-slate-600 text-sm font-bold rounded-2xl hover:bg-slate-50 transition-all"
              >
                Open in New Tab
              </a>
              <button 
                onClick={() => setSelectedDoc(null)}
                className="px-8 py-3 bg-slate-900 text-white text-sm font-bold rounded-2xl hover:bg-slate-800 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
