import React, { useState, useEffect } from 'react';
import { FileText, ShieldCheck, Clock, Upload, Eye, Download, Trash2, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db as supabase } from '../../../lib/db';
import { useNotification } from '../../../contexts/NotificationContext';

export const Documents = ({ user }: { user: any }) => {
  const { showNotification } = useNotification();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    type: 'Identity Verification',
    fileName: ''
  });

  useEffect(() => {
    if (!user?.id) return;

    const fetchDocuments = async () => {
      const { data, error } = await supabase
        .from('verifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching documents:', error);
      } else {
        setDocuments(data || []);
      }
      setLoading(false);
    };

    fetchDocuments();

    // Set up real-time subscription
    const subscription = supabase
      .channel('verifications_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'verifications',
        filter: `user_id=eq.${user.id}`
      }, fetchDocuments)
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    
    setUploading(true);
    try {
      const { error } = await supabase
        .from('verifications')
        .insert({
          user_id: user.id,
          user_email: user.email,
          user_name: user.full_name || user.email,
          role: 'landlord',
          type: formData.type,
          file_name: formData.fileName || 'document.pdf',
          status: 'Pending'
        });
      
      if (error) throw error;
      
      setIsUploadModalOpen(false);
      setFormData({ type: 'Identity Verification', fileName: '' });
      showNotification('Document submitted for verification.', 'success');
    } catch (error) {
      console.error('Error uploading document:', error);
      showNotification('Failed to submit document.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    showNotification(
      'Are you sure you want to delete this document?',
      'info',
      {
        label: 'Delete',
        onClick: async () => {
          try {
            const { error } = await supabase
              .from('verifications')
              .delete()
              .eq('id', id);
            
            if (error) throw error;
            showNotification('Document deleted successfully.', 'success');
          } catch (error) {
            console.error('Error deleting document:', error);
            showNotification('Failed to delete document.', 'error');
          }
        }
      }
    );
  };

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
          <h2 className="text-2xl font-bold text-slate-900">Documents</h2>
          <p className="text-slate-500 text-sm">Manage verification documents and property papers</p>
        </div>
        <button 
          onClick={() => setIsUploadModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20"
        >
          <Upload className="w-5 h-5" />
          Upload Document
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Documents', value: documents.length.toString(), icon: <FileText className="text-blue-500" />, bg: 'bg-blue-50' },
          { label: 'Verified', value: documents.filter(d => d.status === 'Approved').length.toString(), icon: <ShieldCheck className="text-emerald-500" />, bg: 'bg-emerald-50' },
          { label: 'Pending Review', value: documents.filter(d => d.status === 'Pending').length.toString(), icon: <Clock className="text-orange-500" />, bg: 'bg-orange-50' },
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
        <div className="p-8 border-b border-slate-50">
          <h3 className="text-lg font-bold text-slate-900">Uploaded Documents</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Document Type</th>
                <th className="px-8 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">File Name</th>
                <th className="px-8 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Upload Date</th>
                <th className="px-8 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {documents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-12 text-center text-slate-400 font-medium">
                    No documents uploaded yet.
                  </td>
                </tr>
              ) : (
                documents.map((doc, idx) => (
                  <motion.tr 
                    key={doc.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="hover:bg-slate-50/50 transition-colors group"
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center">
                          <FileText className="text-blue-500 w-5 h-5" />
                        </div>
                        <p className="text-sm font-bold text-slate-900">{doc.type}</p>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-xs text-slate-500 font-medium">{doc.file_name || 'document.pdf'}</p>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-xs text-slate-500 font-medium">
                        {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : 'Recently'}
                      </p>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        doc.status === 'Approved' ? 'bg-emerald-50 text-emerald-600' : 
                        doc.status === 'Rejected' ? 'bg-rose-50 text-rose-600' : 
                        doc.status === 'More Info Required' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'
                      }`}>
                        {doc.status}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleDelete(doc.id)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-200 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Upload Modal */}
      <AnimatePresence>
        {isUploadModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[40px] w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                <h3 className="text-xl font-bold text-slate-900">Upload Document</h3>
                <button 
                  onClick={() => setIsUploadModalOpen(false)}
                  className="p-2 hover:bg-white rounded-xl transition-all"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleUpload} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Document Type</label>
                  <select 
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all"
                  >
                    <option>Identity Verification</option>
                    <option>Property Ownership Proof</option>
                    <option>Business Permit</option>
                    <option>Other</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">File Name (Mock)</label>
                  <input 
                    type="text"
                    placeholder="e.g. passport.pdf"
                    value={formData.fileName}
                    onChange={(e) => setFormData({ ...formData, fileName: e.target.value })}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all"
                    required
                  />
                </div>

                <div className="p-8 border-2 border-dashed border-slate-200 rounded-[32px] text-center space-y-4 hover:border-orange-500/50 transition-all group cursor-pointer">
                  <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                    <Upload className="w-8 h-8 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Click to select file</p>
                    <p className="text-xs text-slate-400 font-medium mt-1">PDF, JPG, PNG up to 10MB</p>
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={uploading}
                  className="w-full py-4 bg-orange-500 text-white rounded-2xl font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {uploading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      Submit for Verification
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
