import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Check, X, MessageSquare, ShieldCheck, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { db as supabase } from '../../../lib/db';
import { LeaseModal } from '../../shared/modals/LeaseModal';

export const BookingRequests = ({ user, onNavigate }: { user: any; onNavigate: (tab: string) => void }) => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All Requests');
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [isLeaseModalOpen, setIsLeaseModalOpen] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    const fetchRequests = async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('landlord_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching requests:', error);
      } else {
        setRequests(data || []);
      }
      setLoading(false);
    };

    fetchRequests();

    // Set up real-time subscription
    const subscription = supabase
      .channel('bookings_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'bookings',
        filter: `landlord_id=eq.${user.id}`
      }, fetchRequests)
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id]);

  const handleStatusUpdate = async (requestId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', requestId);
      
      if (error) throw error;
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleMessageStudent = async (request: any) => {
    try {
      const participants = [user.id, request.student_id].sort();
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          sender_name: user.full_name || user.email,
          receiver_id: request.student_id,
          receiver_name: request.student_name || 'Student',
          text: `Hi ${request.student_name}! I'm messaging you regarding your booking request for ${request.property_title}.`,
          participants: participants,
          booking_id: request.id
        });
      
      if (error) throw error;
      onNavigate('messages');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const filteredRequests = requests.filter(req => {
    if (activeFilter === 'All Requests') return true;
    return req.status === activeFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Booking Requests</h2>
        <p className="text-slate-500 text-sm">Review and manage student booking applications</p>
      </div>

      <div className="flex gap-4 mb-8">
        {['All Requests', 'Pending', 'Confirmed', 'Rejected'].map((tab) => (
          <button 
            key={tab}
            onClick={() => setActiveFilter(tab)}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeFilter === tab ? 'bg-[#0F172A] text-white shadow-lg shadow-slate-900/10' : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-100'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {filteredRequests.length === 0 ? (
          <div className="bg-white p-12 rounded-[40px] border border-slate-100 text-center">
            <p className="text-slate-400 font-medium">No booking requests found for this category.</p>
          </div>
        ) : (
          filteredRequests.map((request, idx) => (
            <motion.div
              key={request.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm hover:shadow-md transition-all relative overflow-hidden group"
            >
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <img 
                      src={request.student_avatar || `https://i.pravatar.cc/150?u=${request.student_id}`} 
                      alt={request.student_name} 
                      className="w-16 h-16 rounded-2xl object-cover"
                      referrerPolicy="no-referrer"
                    />
                    {request.student_verified && (
                      <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1 rounded-lg border-2 border-white">
                        <ShieldCheck className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-slate-900 text-lg">{request.student_name || 'Student'}</h3>
                      {request.student_verified && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
                          <Check className="w-3 h-3" /> Verified
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 font-medium">{request.property_title}</p>
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold">
                        <Calendar className="w-3.5 h-3.5" />
                        Move-in: {request.move_in_date || 'TBD'}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold">
                        <Clock className="w-3.5 h-3.5" />
                        Duration: {request.duration || '12 months'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex-1 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                  <p className="text-sm text-slate-600 leading-relaxed italic">"{request.message || 'No message provided.'}"</p>
                </div>

                <div className="flex flex-col justify-between items-end">
                  <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-4 ${
                    request.status === 'Confirmed' ? 'bg-emerald-50 text-emerald-600' : 
                    request.status === 'Rejected' ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'
                  }`}>
                    {request.status}
                  </span>
                  
                  <div className="flex gap-2">
                    {request.status === 'Pending' ? (
                      <>
                        <button 
                          onClick={() => handleStatusUpdate(request.id, 'Confirmed')}
                          className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                        >
                          <Check className="w-4 h-4" />
                          Approve
                        </button>
                        <button 
                          onClick={() => handleStatusUpdate(request.id, 'Rejected')}
                          className="flex items-center gap-2 px-6 py-2.5 bg-red-500 text-white rounded-xl text-xs font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                        >
                          <X className="w-4 h-4" />
                          Reject
                        </button>
                      </>
                    ) : (
                      <button 
                        onClick={() => {
                          setSelectedBooking(request);
                          setIsLeaseModalOpen(true);
                        }}
                        className="flex items-center gap-2 px-6 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all"
                      >
                        View Lease
                      </button>
                    )}
                    <button 
                      onClick={() => handleMessageStudent(request)}
                      className="p-2.5 border border-slate-200 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all"
                    >
                      <MessageSquare className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Requested on {request.created_at ? new Date(request.created_at).toLocaleDateString() : 'Recently'}
                </span>
                <button className="flex items-center gap-2 text-xs font-bold text-slate-900 hover:gap-3 transition-all">
                  View Full Application <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <LeaseModal 
        isOpen={isLeaseModalOpen} 
        onClose={() => setIsLeaseModalOpen(false)} 
        booking={selectedBooking} 
      />
    </div>
  );
};
