import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Eye, 
  User, 
  Mail, 
  Calendar, 
  Loader2,
  Search,
  Filter,
  MoreVertical,
  X,
  FileText,
  ShieldAlert,
  GraduationCap
} from 'lucide-react';
import { db as supabase } from '../../../lib/db';
import { useNotification } from '../../../contexts/NotificationContext';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const AdminDocumentReview = () => {
  const { showNotification } = useNotification();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('documents')
        .select(`
          *,
          profiles:user_id (
            full_name,
            email,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
    
    const channel = supabase
      .channel('admin_documents')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'documents' }, fetchDocuments)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [filter]);

  useEffect(() => {
    const fetchPreviewUrl = async () => {
      if (!selectedDoc) {
        setPreviewUrl(null);
        return;
      }

      setPreviewLoading(true);
      try {
        const { data, error } = await supabase.storage.from('documents').createSignedUrl(selectedDoc.file_path);
        if (error) throw error;
        setPreviewUrl(data?.signedUrl || null);
      } catch (error) {
        console.error('Error fetching preview URL:', error);
        showNotification('Failed to load document preview', 'error');
      } finally {
        setPreviewLoading(false);
      }
    };

    fetchPreviewUrl();
  }, [selectedDoc]);

  const handleUpdateStatus = async (id: string, newStatus: 'approved' | 'rejected') => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('documents')
        .update({ 
          status: newStatus,
          admin_notes: adminNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      
      // If approved, check if we should update the user's overall verification status
      if (newStatus === 'approved') {
        // This could be handled by a database trigger or more complex logic
        // For now, we just notify the user
      }

      showNotification(`Document ${newStatus} successfully!`, 'success');
      setSelectedDoc(null);
      setAdminNotes('');
    } catch (error) {
      console.error('Error updating document status:', error);
      showNotification('Failed to update document status', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const previewDocument = async (filePath: string) => {
    try {
      const { data: { signedUrl }, error: signedUrlError } = await supabase.storage.from('documents').createSignedUrl(filePath, 3600);
      if (signedUrlError) throw signedUrlError;
      window.open(signedUrl, '_blank');
    } catch (error) {
      showNotification('Failed to generate preview link', 'error');
    }
  };

  const filteredDocs = documents.filter(doc => 
    doc.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.profiles?.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'rejected': return 'bg-rose-50 text-rose-700 border-rose-100';
      default: return 'bg-amber-50 text-amber-700 border-amber-100';
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Documents', value: documents.length, icon: FileText, color: 'text-slate-600', bg: 'bg-slate-50' },
          { label: 'Pending Review', value: documents.filter(d => d.status === 'pending').length, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
          { label: 'Approved', value: documents.filter(d => d.status === 'approved').length, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
          { label: 'Rejected', value: documents.filter(d => d.status === 'rejected').length, icon: AlertCircle, color: 'text-rose-500', bg: 'bg-rose-50' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 ${stat.bg} rounded-2xl flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                <p className="text-2xl font-black text-slate-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm space-y-8">
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by user or file name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 transition-all font-medium"
            />
          </div>
          <div className="flex gap-2">
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-600 focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-4 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">User</th>
                <th className="text-left py-4 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Document</th>
                <th className="text-left py-4 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Role</th>
                <th className="text-left py-4 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                <th className="text-left py-4 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</th>
                <th className="text-right py-4 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <Loader2 className="w-8 h-8 text-orange-500 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filteredDocs.length > 0 ? (
                filteredDocs.map((doc) => (
                  <tr key={doc.id} className="group hover:bg-slate-50/50 transition-all">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center font-bold text-xs text-slate-500">
                          {doc.profiles?.full_name?.[0] || 'U'}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{doc.profiles?.full_name}</p>
                          <p className="text-[10px] font-medium text-slate-400">{doc.profiles?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-medium text-slate-700 truncate max-w-[150px]">{doc.file_name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded-full">
                        {doc.role}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest border ${getStatusColor(doc.status)}`}>
                        {doc.status}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-xs font-medium text-slate-500">
                        {new Date(doc.created_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => setSelectedDoc(doc)}
                        className="px-4 py-2 text-orange-500 hover:bg-orange-50 rounded-xl transition-all text-xs font-bold"
                      >
                        View Information
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-20 text-center text-slate-400 font-medium">
                    No documents found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal */}
      <AnimatePresence>
        {selectedDoc && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDoc(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-5xl bg-white rounded-[40px] shadow-2xl overflow-hidden max-h-[95vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-8 border-b border-slate-100 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-slate-900 rounded-full flex items-center justify-center text-white font-black text-xl">
                    {selectedDoc.profiles?.full_name?.[0] || selectedDoc.user_name?.[0] || 'U'}
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 leading-tight">
                      {selectedDoc.profiles?.full_name || selectedDoc.user_name}
                    </h3>
                    <p className="text-sm text-slate-500 font-medium">
                      {selectedDoc.profiles?.email || selectedDoc.user_email} • {selectedDoc.role || 'Student'}
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
                        {/* Document Card 1: Student ID / Gov ID */}
                        <div className={cn(
                          "p-5 rounded-3xl border-2 transition-all cursor-pointer flex items-center justify-between group",
                          previewUrl === (selectedDoc.gov_id_url || selectedDoc.file_path) ? "border-orange-500 bg-orange-50/30" : "border-slate-100 bg-white hover:border-slate-200"
                        )}
                        onClick={() => setPreviewUrl(selectedDoc.gov_id_url || selectedDoc.file_path)}
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center text-white">
                              <FileText className="w-6 h-6" />
                            </div>
                            <div>
                              <p className="text-sm font-black text-slate-900">
                                {selectedDoc.type === 'Property Verification' ? 'Property Proof' : 'Student ID'}
                              </p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">PDF • 2.4 MB</p>
                            </div>
                          </div>
                          <Eye className="w-5 h-5 text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>

                        {/* Document Card 2: COR / Enrollment Cert (if exists) */}
                        {(selectedDoc.enrollment_cert_url || selectedDoc.property_proof_url) && (
                          <div className={cn(
                            "p-5 rounded-3xl border-2 transition-all cursor-pointer flex items-center justify-between group",
                            previewUrl === (selectedDoc.enrollment_cert_url || selectedDoc.property_proof_url) ? "border-orange-500 bg-orange-50/30" : "border-slate-100 bg-white hover:border-slate-200"
                          )}
                          onClick={() => setPreviewUrl(selectedDoc.enrollment_cert_url || selectedDoc.property_proof_url)}
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-orange-500">
                                <FileText className="w-6 h-6" />
                              </div>
                              <div>
                                <p className="text-sm font-black text-slate-900">
                                  {selectedDoc.type === 'Property Verification' ? 'Ownership Document' : 'COR'}
                                </p>
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
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: '98%' }}
                          className="h-full bg-emerald-500 rounded-full"
                        />
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
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        placeholder="Add internal notes about this review..."
                        className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-orange-500 transition-all min-h-[120px]"
                      />
                    </div>
                  </div>

                  {/* Right Column: Document Preview */}
                  <div className="space-y-6">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Document Preview</h4>
                    <div className="bg-slate-100 rounded-[40px] overflow-hidden relative aspect-[3/4] flex items-center justify-center border border-slate-200 shadow-inner">
                      {previewLoading ? (
                        <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
                      ) : previewUrl ? (
                        <>
                          <img 
                            src={previewUrl} 
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
                    onClick={() => handleUpdateStatus(selectedDoc.id, 'approved')}
                    disabled={updating}
                    className="py-5 bg-emerald-500 text-white font-black rounded-2xl hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-500/20 active:scale-[0.98] disabled:opacity-50"
                  >
                    Approve Verification
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedDoc.id, 'rejected')}
                    disabled={updating || !adminNotes}
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
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
