import React, { useState } from 'react';
import { X, Calendar, MessageSquare, ShieldCheck, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db as supabase } from '../../../lib/db';
import { useNotification } from '../../../contexts/NotificationContext';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: any;
  user: any;
}

export const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, listing, user }) => {
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    moveInDate: '',
    duration: '12 months',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !listing?.id) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('bookings').insert({
        student_id: user.id,
        student_name: user.full_name || user.displayName || user.email,
        student_avatar: user.photoURL || `https://i.pravatar.cc/150?u=${user.id}`,
        student_verified: user.is_verified || false,
        student_phone: user.phone || '',
        landlord_id: listing.landlordId,
        landlord_name: listing.landlordName || '',
        landlord_phone: listing.landlordPhone || '',
        listing_id: listing.id,
        property_title: listing.title,
        price: listing.price,
        image_url: listing.image || (listing.images && listing.images[0]),
        address: listing.address || listing.location,
        move_in_date: formData.moveInDate,
        duration: formData.duration,
        message: formData.message,
        status: 'Pending'
      });

      if (error) throw error;
      onClose();
      showNotification('Booking request sent successfully!', 'success');
    } catch (error) {
      console.error('Error creating booking:', error);
      showNotification('Failed to send booking request. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
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
            className="relative w-full max-w-lg bg-white rounded-[40px] shadow-2xl overflow-hidden"
          >
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-900">Request Booking</h2>
                <p className="text-slate-500 text-sm">Send an application to the landlord</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <img src={listing.image || (listing.images && listing.images[0])} alt={listing.title} className="w-16 h-16 rounded-xl object-cover" />
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{listing.title}</h4>
                  <p className="text-xs text-slate-500">{listing.location}</p>
                  <p className="text-orange-500 font-bold text-sm mt-1">₱{listing.price?.toLocaleString()}/month</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Move-in Date</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                  <input
                    required
                    type="date"
                    value={formData.moveInDate}
                    onChange={e => setFormData({ ...formData, moveInDate: e.target.value })}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-orange-500 transition-all text-slate-900 font-medium"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Lease Duration</label>
                <select
                  value={formData.duration}
                  onChange={e => setFormData({ ...formData, duration: e.target.value })}
                  className="w-full px-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-orange-500 transition-all text-slate-900 font-medium"
                >
                  <option value="6 months">6 Months</option>
                  <option value="10 months">10 Months</option>
                  <option value="12 months">12 Months</option>
                  <option value="24 months">24 Months</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Message to Landlord</label>
                <div className="relative">
                  <MessageSquare className="absolute left-4 top-4 w-5 h-5 text-slate-300" />
                  <textarea
                    required
                    value={formData.message}
                    onChange={e => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Introduce yourself and why you're interested..."
                    rows={4}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-orange-500 transition-all text-slate-900 font-medium resize-none"
                  />
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700 leading-relaxed">
                  Your profile and verification status will be shared with the landlord to help them review your application.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-orange-500 text-white rounded-2xl font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? 'Sending Request...' : 'Send Booking Request'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
