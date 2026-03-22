import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Search, 
  Filter,
  MoreVertical,
  User,
  Mail,
  Calendar,
  Trash2,
  ExternalLink,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { db as supabase } from '../../../lib/db';
import { motion, AnimatePresence } from 'motion/react';

export const FeedbackManagement = () => {
  const [feedback, setFeedback] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'feedback' | 'issue'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'reviewed' | 'resolved'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('type', filter);
      }
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setFeedback(data || []);
    } catch (error) {
      console.error('Error fetching feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
    
    const channel = supabase
      .channel('admin_feedback')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'feedback' }, fetchFeedback)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [filter, statusFilter]);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('feedback')
        .update({ status: newStatus })
        .eq('id', id);
      
      if (error) throw error;
      if (selectedItem?.id === id) {
        setSelectedItem({ ...selectedItem, status: newStatus });
      }
    } catch (error) {
      console.error('Error updating feedback status:', error);
    }
  };

  const deleteFeedback = async (id: string) => {
    if (!confirm('Are you sure you want to delete this feedback?')) return;
    
    try {
      const { error } = await supabase
        .from('feedback')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      setSelectedItem(null);
    } catch (error) {
      console.error('Error deleting feedback:', error);
    }
  };

  const filteredFeedback = feedback.filter(item => 
    item.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.user_email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'reviewed': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'pending': return 'bg-amber-50 text-amber-600 border-amber-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Submissions', value: feedback.length, icon: MessageSquare, color: 'text-slate-600', bg: 'bg-slate-50' },
          { label: 'Pending Review', value: feedback.filter(f => f.status === 'pending').length, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
          { label: 'Issues Reported', value: feedback.filter(f => f.type === 'issue').length, icon: AlertCircle, color: 'text-rose-500', bg: 'bg-rose-50' },
          { label: 'Resolved', value: feedback.filter(f => f.status === 'resolved').length, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
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

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Feedback List */}
        <div className="flex-1 space-y-6">
          <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search feedback..."
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
                  <option value="all">All Types</option>
                  <option value="feedback">Feedback</option>
                  <option value="issue">Issues</option>
                </select>
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-600 focus:ring-2 focus:ring-orange-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
            </div>

            <div className="space-y-3">
              {loading ? (
                <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-4">
                  <Loader2 className="w-8 h-8 animate-spin" />
                  <p className="text-sm font-medium">Loading submissions...</p>
                </div>
              ) : filteredFeedback.length > 0 ? (
                filteredFeedback.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className={`w-full text-left p-5 rounded-2xl border transition-all flex items-center gap-4 group ${
                      selectedItem?.id === item.id 
                        ? 'bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-900/10' 
                        : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                      selectedItem?.id === item.id ? 'bg-white/10' : 'bg-slate-100'
                    }`}>
                      {item.type === 'issue' ? (
                        <AlertCircle className={`w-6 h-6 ${selectedItem?.id === item.id ? 'text-rose-400' : 'text-rose-500'}`} />
                      ) : (
                        <MessageSquare className={`w-6 h-6 ${selectedItem?.id === item.id ? 'text-blue-400' : 'text-blue-500'}`} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-bold truncate pr-4">{item.subject}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest border ${
                          selectedItem?.id === item.id ? 'bg-white/10 border-white/20 text-white' : getStatusColor(item.status)
                        }`}>
                          {item.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] font-medium opacity-60">
                        <span className="truncate">{item.user_email}</span>
                        <span>•</span>
                        <span>{new Date(item.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <ChevronRight className={`w-5 h-5 transition-transform ${selectedItem?.id === item.id ? 'translate-x-1' : 'text-slate-300 group-hover:text-slate-400'}`} />
                  </button>
                ))
              ) : (
                <div className="py-20 text-center space-y-4">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                    <MessageSquare className="w-8 h-8 text-slate-200" />
                  </div>
                  <p className="text-slate-400 font-medium">No feedback found matching your filters.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Details View */}
        <div className="w-full lg:w-96 shrink-0">
          <AnimatePresence mode="wait">
            {selectedItem ? (
              <motion.div
                key={selectedItem.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden sticky top-28"
              >
                <div className="p-8 space-y-8">
                  <div className="flex items-center justify-between">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${getStatusColor(selectedItem.status)}`}>
                      {selectedItem.status}
                    </span>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => deleteFeedback(selectedItem.id)}
                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-2xl font-black text-slate-900 leading-tight">{selectedItem.subject}</h3>
                    <div className="p-4 bg-slate-50 rounded-2xl text-sm text-slate-600 leading-relaxed font-medium">
                      {selectedItem.message}
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-slate-100">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">User Information</h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                          <Mail className="w-4 h-4 text-slate-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email</p>
                          <p className="text-xs font-bold text-slate-900 truncate">{selectedItem.user_email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                          <User className="w-4 h-4 text-slate-500" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Role</p>
                          <p className="text-xs font-bold text-slate-900 capitalize">{selectedItem.user_role}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                          <Calendar className="w-4 h-4 text-slate-500" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Submitted On</p>
                          <p className="text-xs font-bold text-slate-900">{new Date(selectedItem.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-slate-100">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Actions</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => updateStatus(selectedItem.id, 'reviewed')}
                        disabled={selectedItem.status === 'reviewed'}
                        className="px-4 py-3 bg-blue-50 text-blue-600 text-xs font-bold rounded-xl hover:bg-blue-100 transition-all disabled:opacity-50"
                      >
                        Mark Reviewed
                      </button>
                      <button
                        onClick={() => updateStatus(selectedItem.id, 'resolved')}
                        disabled={selectedItem.status === 'resolved'}
                        className="px-4 py-3 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-xl hover:bg-emerald-100 transition-all disabled:opacity-50"
                      >
                        Mark Resolved
                      </button>
                    </div>
                    <button className="w-full px-4 py-3 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
                      <Mail className="w-4 h-4" />
                      Reply to User
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="bg-slate-50 rounded-[32px] border border-dashed border-slate-200 p-12 text-center space-y-4">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                  <ExternalLink className="w-8 h-8 text-slate-200" />
                </div>
                <p className="text-sm font-bold text-slate-400">Select a submission to view details and take action.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
