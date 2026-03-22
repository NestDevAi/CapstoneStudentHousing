import React from 'react';
import { X, FileText, Phone, User, Home, Calendar, Clock, ShieldCheck, Download, Printer } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LeaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
}

export const LeaseModal: React.FC<LeaseModalProps> = ({ isOpen, onClose, booking }) => {
  if (!booking) return null;

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
            className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900">Lease Agreement</h2>
                  <p className="text-slate-500 text-sm font-medium">Reference: #LS-{booking.id?.slice(0, 8).toUpperCase()}</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
              {/* Status Badge */}
              <div className="flex justify-center">
                <div className="px-6 py-2 bg-emerald-50 text-emerald-600 rounded-full flex items-center gap-2 border border-emerald-100">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-widest">Legally Binding & Confirmed</span>
                </div>
              </div>

              {/* Property Info */}
              <section className="space-y-4">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Property Details</h3>
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center gap-6">
                  <img 
                    src={booking.image} 
                    alt={booking.propertyTitle} 
                    className="w-20 h-20 rounded-2xl object-cover shadow-md"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h4 className="text-lg font-black text-slate-900">{booking.propertyTitle}</h4>
                    <p className="text-sm text-slate-500 font-medium flex items-center gap-1.5 mt-1">
                      <Home className="w-4 h-4" />
                      {booking.address}
                    </p>
                    <p className="text-orange-500 font-black text-lg mt-2">₱{booking.price?.toLocaleString()}/month</p>
                  </div>
                </div>
              </section>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Tenant Info */}
                <section className="space-y-4">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Tenant Information</h3>
                  <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                        <User className="w-5 h-5 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Full Name</p>
                        <p className="text-sm font-black text-slate-900">{booking.studentName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                        <Phone className="w-5 h-5 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Contact Number</p>
                        <p className="text-sm font-black text-slate-900">{booking.studentPhone || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Landlord Info */}
                <section className="space-y-4">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Landlord Information</h3>
                  <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                        <User className="w-5 h-5 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Full Name</p>
                        <p className="text-sm font-black text-slate-900">{booking.landlordName || 'Landlord'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                        <Phone className="w-5 h-5 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Contact Number</p>
                        <p className="text-sm font-black text-slate-900">{booking.landlordPhone || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              {/* Lease Terms */}
              <section className="space-y-4">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Lease Terms</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Move-in Date</p>
                      <p className="text-sm font-black text-slate-900">{booking.moveInDate}</p>
                    </div>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center">
                      <Clock className="w-6 h-6 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Duration</p>
                      <p className="text-sm font-black text-slate-900">{booking.duration}</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Legal Note */}
              <div className="p-6 bg-orange-50 rounded-3xl border border-orange-100">
                <p className="text-[10px] text-orange-700 leading-relaxed font-medium">
                  This document serves as a formal confirmation of the lease agreement between the landlord and the tenant. Both parties agree to the terms stated above and are bound by the local housing regulations of Baguio City.
                </p>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
              <button className="flex-1 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-100 transition-all flex items-center justify-center gap-2">
                <Printer className="w-5 h-5" />
                Print Lease
              </button>
              <button className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-900/20">
                <Download className="w-5 h-5" />
                Download PDF
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
