import React, { useState } from 'react';
import { X, AlertTriangle, ShieldAlert, Info, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db as supabase } from '../../../lib/db';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: any;
  user: any;
}

export const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, listing, user }) => {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const reasons = [
    { id: 'fake', label: 'Fake Listing', icon: ShieldAlert },
    { id: 'scam', label: 'Scam / Fraudulent', icon: AlertTriangle },
    { id: 'misleading', label: 'Misleading Information', icon: Info },
    { id: 'unavailable', label: 'Property Unavailable', icon: X },
    { id: 'other', label: 'Other Issue', icon: ShieldAlert },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('reports').insert({
        listing_id: listing.id,
        listing_title: listing.title,
        reporter_id: user.id,
        reporter_name: user.full_name || user.email,
        reason: reason,
        description: description,
        status: 'Pending'
      });

      if (error) throw error;
      
      setSubmitted(true);
      setTimeout(() => {
        onClose();
        setSubmitted(false);
        setReason('');
        setDescription('');
      }, 3000);
    } catch (error) {
      console.error('Error submitting report:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-white rounded-[32px] shadow-2xl overflow-hidden"
          >
            {submitted ? (
              <div className="p-12 text-center space-y-6">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <ShieldAlert className="w-10 h-10" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900">Report Submitted</h2>
                  <p className="text-slate-500 mt-2">Thank you for helping us keep the community safe. Our team will review this listing shortly.</p>
                </div>
                <button 
                  onClick={onClose}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900">Report Listing</h2>
                    <p className="text-slate-500 text-sm">Help us keep the community safe</p>
                  </div>
                  <button 
                    onClick={onClose}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                  >
                    <X className="w-6 h-6 text-slate-400" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                  <div className="space-y-4">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
                      Reason for reporting
                    </label>
                    <div className="grid grid-cols-1 gap-3">
                      {reasons.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setReason(item.label)}
                          className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                            reason === item.label
                              ? 'border-orange-500 bg-orange-50 text-orange-900'
                              : 'border-slate-100 hover:border-slate-200 text-slate-600'
                          }`}
                        >
                          <div className={`p-2 rounded-xl ${
                            reason === item.label ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-400'
                          }`}>
                            <item.icon className="w-5 h-5" />
                          </div>
                          <span className="font-bold text-sm">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
                      Additional Details
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Please provide more information about the issue..."
                      className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-orange-500 transition-all min-h-[120px] resize-none"
                      required
                    />
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={loading || !reason}
                      className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-slate-900/10"
                    >
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          Submit Report
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
