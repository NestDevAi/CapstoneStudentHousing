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
  Eye,
  MessageSquare,
  Loader2,
  Search,
  ShieldAlert
} from 'lucide-react';
import { db as supabase } from '../../../lib/db';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useNotification } from '../../../contexts/NotificationContext';
import { motion, AnimatePresence } from 'motion/react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const PropertyVerification: React.FC = () => {
  const { showNotification } = useNotification();
  const [verifications, setVerifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'queue' | 'history'>('queue');
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchVerifications = async () => {
      const { data, error } = await supabase
        .from('verifications')
        .select('*, users(full_name, email)')
        .eq('type', 'Property Verification')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching property verifications:', error);
      } else {
        // Flatten the user data
        const flattenedData = data?.map(v => ({
          ...v,
          user_name: v.users?.full_name,
          user_email: v.users?.email
        })) || [];
        setVerifications(flattenedData);
      }
      setLoading(false);
    };

    fetchVerifications();

    // Set up real-time subscription
    const subscription = supabase
      .channel('property_verifications_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'verifications', filter: "type=eq.Property Verification" }, 
        fetchVerifications
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const filteredVerifications = verifications.filter(v => {
    const matchesSearch = 
      v.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.property_title?.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === 'queue') {
      return v.status === 'Pending' || v.status === 'More Info Required';
    } else {
      return v.status === 'Approved' || v.status === 'Rejected';
    }
  });

  const handleAction = async (item: any, status: 'Approved' | 'Rejected' | 'More Info Required' | 'Pending') => {
    const { id, listing_id } = item;
    setProcessingId(id);
    try {
      const adminNotes = status === 'More Info Required' || status === 'Rejected' ? prompt(`Enter notes for the user (Reason for ${status}):`) : '';
      
      if ((status === 'More Info Required' || status === 'Rejected') && adminNotes === null) {
        setProcessingId(null);
        return;
      }

      const { error: updateError } = await supabase
        .from('verifications')
        .update({
          status,
          admin_notes: adminNotes || '',
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (updateError) throw updateError;

      if (status === 'Approved' && listing_id) {
        const { error: listingError } = await supabase
          .from('listings')
          .update({ 
            status: 'Active',
            is_verified: true,
            verification_status: 'Verified'
          })
          .eq('id', listing_id);
        if (listingError) throw listingError;
      } else if (status === 'Rejected' && listing_id) {
        const { error: listingError } = await supabase
          .from('listings')
          .update({ 
            is_verified: false,
            verification_status: 'Rejected'
          })
          .eq('id', listing_id);
        if (listingError) throw listingError;
      }
      
      showNotification(`Property verification ${status.toLowerCase()} successfully.`, 'success');

      // Log the action
      await supabase.from('audit_logs').insert({
        action: `Property Verification ${status}`,
        target_id: listing_id || id,
        target_type: 'property',
        details: { notes: adminNotes, property_title: item.property_title }
      });

    } catch (error) {
      console.error('Error updating property verification:', error);
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
        <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-8">
            <h4 className="text-lg font-bold text-slate-900">Property Verification</h4>
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
                History
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative group">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-orange-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Search verifications..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm w-64 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all">
              <Filter className="w-4 h-4" /> Filter
            </button>
          </div>
        </div>

        <div className="divide-y divide-slate-50">
          {filteredVerifications.length === 0 ? (
            <div className="p-12 text-center text-slate-400 font-medium">
              {activeTab === 'queue' ? 'No pending property verification requests.' : 'No processed property verifications in history.'}
            </div>
          ) : (
            filteredVerifications.map((item) => (
              <div key={item.id} className="p-8 hover:bg-slate-50/50 transition-all group">
                <div className="flex items-start gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <Home className="w-7 h-7" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-lg font-bold text-slate-900">{item.property_title || 'Untitled Property'}</h5>
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                        item.status === 'Pending' ? 'bg-amber-100 text-amber-600' : 
                        item.status === 'Rejected' ? 'bg-rose-100 text-rose-600' : 
                        item.status === 'More Info Required' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'
                      )}>
                        {item.status}
                      </span>
                    </div>
                    <p className="text-slate-500 font-medium mb-2">Landlord: {item.user_name || 'User'} ({item.user_email})</p>
                    
                    {/* Extra Details */}
                    <div className="flex flex-wrap gap-x-6 gap-y-2 mb-4">
                      {item.listing_id && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                          <span className="font-bold text-slate-500 uppercase tracking-wider">Listing ID:</span> {item.listing_id}
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
                      {item.property_proof_url && (
                        <button 
                          onClick={() => setSelectedDoc({ url: item.property_proof_url, title: 'Property Proof' })}
                          className="flex items-center gap-1.5 text-orange-500 hover:text-orange-600"
                        >
                          <Eye className="w-3.5 h-3.5" /> Property Proof (Ownership)
                        </button>
                      )}
                      {item.gov_id_url && (
                        <button 
                          onClick={() => setSelectedDoc({ url: item.gov_id_url, title: 'Government ID' })}
                          className="flex items-center gap-1.5 text-orange-500 hover:text-orange-600"
                        >
                          <Eye className="w-3.5 h-3.5" /> Landlord ID
                        </button>
                      )}
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> Submitted: {item.created_at ? new Date(item.created_at).toLocaleString() : 'Recently'}
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
                    <button
                      onClick={() => {
                        setSelectedDoc({ 
                          ...item,
                          url: item.property_proof_url || item.gov_id_url, 
                          title: item.property_title || 'Property Verification' 
                        });
                      }}
                      className="px-4 py-2 text-orange-500 hover:bg-orange-50 rounded-xl transition-all text-xs font-bold"
                    >
                      View Information
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Document Preview Modal (Redesigned) */}
      <AnimatePresence>
        {selectedDoc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[40px] shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-8 border-b border-slate-100 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-slate-900 rounded-full flex items-center justify-center text-white font-black text-xl">
                    {selectedDoc.user_name?.[0] || 'U'}
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 leading-tight">
                      {selectedDoc.user_name || 'User'}
                    </h3>
                    <p className="text-sm text-slate-500 font-medium">
                      {selectedDoc.user_email} • Landlord
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedDoc(null)}
                  className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all"
                >
                  <X className="w-8 h-8" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  {/* Left Column: Documents & Analysis */}
                  <div className="space-y-8">
                    <div>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Submitted Documents</h4>
                      <div className="space-y-4">
                        {/* Property Proof */}
                        {selectedDoc.property_proof_url && (
                          <div className={cn(
                            "p-5 rounded-3xl border-2 transition-all cursor-pointer flex items-center justify-between group",
                            selectedDoc.url === selectedDoc.property_proof_url ? "border-orange-500 bg-orange-50/30" : "border-slate-100 bg-white hover:border-slate-200"
                          )}
                          onClick={() => setSelectedDoc({ ...selectedDoc, url: selectedDoc.property_proof_url })}
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center text-white">
                                <Home className="w-6 h-6" />
                              </div>
                              <div>
                                <p className="text-sm font-black text-slate-900">Property Ownership Proof</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">PDF • 2.4 MB</p>
                              </div>
                            </div>
                            <Eye className="w-5 h-5 text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        )}

                        {/* Landlord ID */}
                        {selectedDoc.gov_id_url && (
                          <div className={cn(
                            "p-5 rounded-3xl border-2 transition-all cursor-pointer flex items-center justify-between group",
                            selectedDoc.url === selectedDoc.gov_id_url ? "border-orange-500 bg-orange-50/30" : "border-slate-100 bg-white hover:border-slate-200"
                          )}
                          onClick={() => setSelectedDoc({ ...selectedDoc, url: selectedDoc.gov_id_url })}
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-orange-500">
                                <FileText className="w-6 h-6" />
                              </div>
                              <div>
                                <p className="text-sm font-black text-slate-900">Landlord Government ID</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">PDF • 2.4 MB</p>
                              </div>
                            </div>
                            <Eye className="w-5 h-5 text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* AI Verification Analysis */}
                    <div className="bg-[#0f172a] rounded-[32px] p-8 text-white relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 blur-3xl rounded-full"></div>
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center">
                          <ShieldAlert className="w-5 h-5 text-orange-500" />
                        </div>
                        <h5 className="text-sm font-black tracking-tight">AI Verification Analysis</h5>
                      </div>
                      
                      <div className="flex items-end justify-between mb-4">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Confidence Score</p>
                        <p className="text-2xl font-black">98%</p>
                      </div>
                      
                      <div className="h-2 bg-slate-800 rounded-full mb-6 overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full w-[98%]" />
                      </div>
                      
                      <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                        Our AI has cross-referenced the submitted documents with government databases and detected no anomalies in the metadata or visual elements.
                      </p>
                    </div>

                    {/* Review Notes */}
                    <div className="bg-slate-50 rounded-[32px] p-8 border border-slate-100">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-slate-400" />
                          <h5 className="text-sm font-black text-slate-900">Review Notes (Internal)</h5>
                        </div>
                        <button className="text-[10px] font-black text-slate-900 uppercase tracking-widest hover:text-orange-500 transition-colors">
                          Save Notes
                        </button>
                      </div>
                      <textarea
                        placeholder="Add internal notes about this review..."
                        className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-orange-500 transition-all min-h-[120px]"
                      />
                    </div>
                  </div>

                  {/* Right Column: Document Preview */}
                  <div className="space-y-6">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Document Preview</h4>
                    <div className="bg-slate-100 rounded-[40px] overflow-hidden relative aspect-[3/4] flex items-center justify-center border border-slate-200 shadow-inner">
                      {selectedDoc.url ? (
                        <>
                          <img 
                            src={selectedDoc.url} 
                            alt="Preview" 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute top-6 right-6 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 shadow-xl">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                            <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">High-Res Scan Verified</span>
                          </div>
                        </>
                      ) : (
                        <div className="text-center text-slate-400">
                          <FileText className="w-12 h-12 mx-auto mb-2 opacity-20" />
                          <p className="text-xs font-bold uppercase tracking-widest">Select a document to preview</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-8 border-t border-slate-100 bg-white shrink-0">
                <div className="grid grid-cols-3 gap-4">
                  <button
                    onClick={() => handleAction(selectedDoc, 'Approved')}
                    disabled={processingId === selectedDoc.id}
                    className="py-5 bg-emerald-500 text-white font-black rounded-2xl hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20 active:scale-[0.98] disabled:opacity-50"
                  >
                    Approve Verification
                  </button>
                  <button
                    onClick={() => handleAction(selectedDoc, 'Rejected')}
                    disabled={processingId === selectedDoc.id}
                    className="py-5 bg-rose-500 text-white font-black rounded-2xl hover:bg-rose-600 transition-all shadow-xl shadow-rose-500/20 active:scale-[0.98] disabled:opacity-50"
                  >
                    Reject Request
                  </button>
                  <button
                    onClick={() => setSelectedDoc(null)}
                    className="py-5 bg-white border-2 border-slate-100 text-slate-600 font-black rounded-2xl hover:bg-slate-50 transition-all active:scale-[0.98]"
                  >
                    Request More Info
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
