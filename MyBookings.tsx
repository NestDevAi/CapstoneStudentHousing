import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, CheckCircle2, AlertCircle, ChevronRight, MessageSquare } from 'lucide-react';
import { motion } from 'motion/react';
import { db as supabase } from '../../../lib/db';
import { LeaseModal } from '../../shared/modals/LeaseModal';

export const MyBookings = ({ user, onRequireVerification, onNavigate }: { user: any; onRequireVerification: () => void; onNavigate: (tab: string) => void }) => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [isLeaseModalOpen, setIsLeaseModalOpen] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    const fetchBookings = async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('student_id', user.id);

      if (error) {
        console.error('Error fetching bookings:', error);
      } else {
        setBookings(data || []);
      }
      setLoading(false);
    };

    fetchBookings();

    const subscription = supabase
      .channel('public_bookings')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'bookings',
        filter: `student_id=eq.${user.id}`
      }, fetchBookings)
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id]);

  const handleMessageLandlord = async (booking: any) => {
    if (!user?.is_verified) {
      onRequireVerification();
      return;
    }
    try {
      const participants = [user.id, booking.landlord_id].sort();
      const { error } = await supabase.from('messages').insert({
        sender_id: user.id,
        sender_name: user.full_name || user.email,
        receiver_id: booking.landlord_id,
        receiver_name: booking.landlord_name || 'Landlord',
        text: `Hi! I'm messaging you regarding my booking for ${booking.property_title}.`,
        participants: participants,
        booking_id: booking.id
      });
      
      if (error) throw error;
      onNavigate('messages');
    } catch (error) {
      console.error('Error sending message:', error);
    }
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
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Active Bookings', value: bookings.filter(b => b.status === 'Confirmed').length.toString(), icon: <CheckCircle2 className="text-emerald-500" /> },
          { label: 'Pending Requests', value: bookings.filter(b => b.status === 'Pending').length.toString(), icon: <Clock className="text-orange-500" /> },
          { label: 'Total Spent', value: `$${bookings.reduce((acc, b) => acc + (b.price || 0), 0).toLocaleString()}`, icon: <Calendar className="text-blue-500" /> },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-100 flex items-center gap-4 shadow-sm">
            <div className="p-3 bg-slate-50 rounded-2xl">
              {stat.icon}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <p className="text-2xl font-black text-slate-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Bookings List */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 px-2">Recent Bookings</h2>
        {bookings.length === 0 ? (
          <div className="bg-white p-12 rounded-[32px] border border-slate-100 text-center">
            <p className="text-slate-400 font-medium">No bookings found. Start browsing listings to find your next home!</p>
          </div>
        ) : (
          bookings.map((booking, idx) => (
            <motion.div
              key={booking.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white p-6 rounded-[32px] border border-slate-100 flex items-center gap-6 hover:shadow-lg hover:shadow-slate-100 transition-all group cursor-pointer"
            >
              <div className="w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0">
                <img src={booking.image_url || "https://picsum.photos/seed/apt/200/200"} alt={booking.property_title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID: {booking.id}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    booking.status === 'Confirmed' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'
                  }`}>
                    {booking.status}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-lg mb-1">{booking.property_title}</h3>
                <div className="flex items-center gap-4 text-sm text-slate-500">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{booking.address || 'Metro City'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{booking.booking_date || 'TBD'}</span>
                  </div>
                </div>
              </div>

              <div className="text-right flex flex-col items-end gap-2">
                <p className="text-2xl font-black text-slate-900">₱{booking.price?.toLocaleString() || 0}</p>
                <div className="flex gap-2">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMessageLandlord(booking);
                    }}
                    className="p-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all"
                    title="Message Landlord"
                  >
                    <MessageSquare className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (booking.status === 'Confirmed') {
                        setSelectedBooking(booking);
                        setIsLeaseModalOpen(true);
                      }
                    }}
                    className={`flex items-center gap-2 text-sm font-bold transition-all ${
                      booking.status === 'Confirmed' ? 'text-orange-500 hover:gap-3' : 'text-slate-300 cursor-not-allowed'
                    }`}
                  >
                    View Lease <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Help Box */}
      <div className="bg-slate-900 p-8 rounded-[40px] text-white flex items-center justify-between overflow-hidden relative">
        <div className="relative z-10">
          <h3 className="text-2xl font-bold mb-2">Need help with your booking?</h3>
          <p className="text-slate-400 max-w-md text-sm">Our support team is available 24/7 to assist you with any issues regarding your stay or payment.</p>
          <button className="mt-6 px-8 py-3 bg-orange-500 text-white rounded-2xl font-bold hover:bg-orange-600 transition-all">
            Contact Support
          </button>
        </div>
        <AlertCircle className="w-48 h-48 text-white/5 absolute -right-10 -bottom-10 rotate-12" />
      </div>

      <LeaseModal 
        isOpen={isLeaseModalOpen} 
        onClose={() => setIsLeaseModalOpen(false)} 
        booking={selectedBooking} 
      />
    </div>
  );
};
