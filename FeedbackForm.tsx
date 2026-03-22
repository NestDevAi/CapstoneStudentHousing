import React, { useState } from 'react';
import { Send, MessageSquare, AlertCircle, CheckCircle2, Loader2, Info } from 'lucide-react';
import { db as supabase } from '../../lib/db';
import { motion, AnimatePresence } from 'motion/react';

interface FeedbackFormProps {
  user: any;
}

export const FeedbackForm = ({ user }: FeedbackFormProps) => {
  const [type, setType] = useState<'feedback' | 'issue'>('feedback');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const { error: submitError } = await supabase
        .from('feedback')
        .insert({
          user_id: user.id,
          user_email: user.email,
          user_role: user.role,
          type,
          subject,
          message,
          status: 'pending',
          created_at: new Date().toISOString()
        });

      if (submitError) throw submitError;

      setSubmitted(true);
      setSubject('');
      setMessage('');
    } catch (err: any) {
      console.error('Error submitting feedback:', err);
      setError(err.message || 'Failed to submit feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white p-12 rounded-[48px] border border-slate-100 shadow-sm text-center space-y-6"
      >
        <div className="w-20 h-20 bg-emerald-50 rounded-[32px] flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10 text-emerald-500" />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-black text-slate-900">Thank You!</h3>
          <p className="text-slate-500 font-medium max-w-sm mx-auto">
            Your {type} has been submitted successfully. Our team will review it and get back to you if necessary.
          </p>
        </div>
        <button 
          onClick={() => setSubmitted(false)}
          className="px-8 py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all"
        >
          Submit Another
        </button>
      </motion.div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm space-y-8">
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Feedback & Support</h2>
          <p className="text-slate-500 font-medium">
            Have a suggestion or found an issue? Let us know and we'll help you out.
          </p>
        </div>

        <div className="flex p-1.5 bg-slate-50 rounded-2xl gap-1">
          <button
            onClick={() => setType('feedback')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
              type === 'feedback' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            General Feedback
          </button>
          <button
            onClick={() => setType('issue')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
              type === 'issue' 
                ? 'bg-white text-rose-600 shadow-sm' 
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <AlertCircle className="w-4 h-4" />
            Report an Issue
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-4">Subject</label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={type === 'feedback' ? "What's on your mind?" : "Briefly describe the issue"}
              className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all font-bold text-slate-900"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-4">Message</label>
            <textarea
              required
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={type === 'feedback' ? "Tell us more about your experience..." : "Please provide details about the issue you encountered..."}
              className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all font-bold text-slate-900 resize-none"
            />
          </div>

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-sm font-bold">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          <div className="bg-blue-50 p-4 rounded-2xl flex gap-3">
            <Info className="w-5 h-5 text-blue-500 shrink-0" />
            <p className="text-xs text-blue-700 font-medium leading-relaxed">
              Your feedback is important to us. We review every submission to improve VerifiedStudentShousing for everyone.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
            Submit {type === 'feedback' ? 'Feedback' : 'Issue Report'}
          </button>
        </form>
      </div>
    </div>
  );
};
