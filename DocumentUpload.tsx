import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Trash2, 
  Loader2,
  Eye
} from 'lucide-react';
import { db as supabase } from '../../lib/db';
import { useNotification } from '../../contexts/NotificationContext';
import { motion, AnimatePresence } from 'motion/react';

interface DocumentUploadProps {
  user: any;
  role: 'student' | 'landlord';
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({ user, role }) => {
  const { showNotification } = useNotification();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

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
      .channel('user_documents')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'documents',
        filter: `user_id=eq.${user.id}`
      }, fetchDocuments)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user.id]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showNotification('File size must be less than 10MB', 'error');
      return;
    }

    setUploading(true);
    try {
      const timestamp = Date.now();
      const filePath = `${user.id}/${timestamp}-${file.name}`;
      
      // 1. Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage.from('documents').upload(filePath, file);
      if (uploadError) throw uploadError;
      const uploadedPath = uploadData.path;

      // 2. Save metadata to database
      const { error: dbError } = await supabase
        .from('documents')
        .insert({
          user_id: user.id,
          role: role,
          file_name: file.name,
          file_path: uploadedPath,
          status: 'pending'
        });

      if (dbError) throw dbError;
      showNotification('Document uploaded successfully!', 'success');
    } catch (error: any) {
      console.error('Upload error:', error);
      showNotification(error.message || 'Failed to upload document', 'error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'rejected': return <AlertCircle className="w-4 h-4 text-rose-500" />;
      default: return <Clock className="w-4 h-4 text-amber-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'rejected': return 'bg-rose-50 text-rose-700 border-rose-100';
      default: return 'bg-amber-50 text-amber-700 border-amber-100';
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h3 className="text-xl font-black text-slate-900 mb-1">Verification Documents</h3>
            <p className="text-sm text-slate-500 font-medium">Upload your ID and other required documents for verification.</p>
          </div>
          
          <div className="relative">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleUpload}
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="px-6 py-3 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20 flex items-center gap-2 disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {uploading ? 'Uploading...' : 'Upload Document'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {documents.map((doc) => (
              <motion.div
                key={doc.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-slate-200 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0">
                    <FileText className="w-5 h-5 text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate mb-1">{doc.file_name}</p>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1 ${getStatusColor(doc.status)}`}>
                        {getStatusIcon(doc.status)}
                        {doc.status}
                      </span>
                    </div>
                  </div>
                </div>

                {doc.admin_notes && (
                  <div className="mt-3 p-2 bg-rose-50/50 rounded-lg text-[10px] text-rose-600 font-medium border border-rose-100">
                    Note: {doc.admin_notes}
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {new Date(doc.created_at).toLocaleDateString()}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => previewDocument(doc.file_path)}
                      className="p-2 text-slate-400 hover:text-slate-900 hover:bg-white rounded-lg transition-all"
                      title="Preview"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {documents.length === 0 && !loading && (
            <div className="col-span-full py-12 text-center space-y-4">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                <FileText className="w-8 h-8 text-slate-200" />
              </div>
              <p className="text-slate-400 font-medium">No documents uploaded yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
