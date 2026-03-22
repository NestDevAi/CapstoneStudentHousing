import React, { useState } from 'react';
import { X, MapPin, LayoutGrid, Star, ChevronLeft, ChevronRight, ShieldCheck, Clock, Activity, MessageSquare, Send, Phone, Mail, User as UserIcon, AlertCircle, FileText, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNotification } from '../../../contexts/NotificationContext';

interface PropertyDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: any;
  isStudent?: boolean;
  onBook?: (property: any) => void;
  onMessage?: (property: any, message: string) => void;
  onReport?: (property: any) => void;
}

export const PropertyDetailsModal: React.FC<PropertyDetailsModalProps> = ({ 
  isOpen, 
  onClose, 
  property, 
  isStudent,
  onBook,
  onMessage,
  onReport
}) => {
  const { showNotification } = useNotification();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [message, setMessage] = useState('');
  const [isMessaging, setIsMessaging] = useState(false);
  const [sending, setSending] = useState(false);

  if (!property) return null;

  const allImages = [property.image_url, ...(property.images || [])].filter(Boolean);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !onMessage) return;
    setSending(true);
    try {
      const participants = [property.landlord_id, property.student_id].filter(Boolean).sort();
      // If we don't have student_id, it's the current user
      
      await onMessage(property, message);
      setMessage('');
      setIsMessaging(false);
      showNotification('Message sent successfully!', 'success');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
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
            className="relative w-full max-w-4xl bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]"
          >
            {/* Image Section */}
            <div className="relative w-full md:w-1/2 bg-slate-100 aspect-square md:aspect-auto">
              {(() => {
                const currentFile = allImages[currentImageIndex];
                const isPdf = currentFile?.toLowerCase().endsWith('.pdf');
                const isDoc = currentFile?.toLowerCase().endsWith('.doc') || currentFile?.toLowerCase().endsWith('.docx');

                if (isPdf || isDoc) {
                  return (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-6 p-12 bg-slate-50">
                      <div className="w-24 h-24 bg-white rounded-3xl shadow-xl flex items-center justify-center">
                        <FileText className={`w-12 h-12 ${isPdf ? 'text-rose-500' : 'text-blue-500'}`} />
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-black text-slate-900 mb-2">
                          {isPdf ? 'PDF Document' : 'Word Document'}
                        </p>
                        <p className="text-sm font-medium text-slate-400 mb-6 truncate max-w-[200px]">
                          {currentFile.split('/').pop()?.split('_').pop()}
                        </p>
                        <a 
                          href={currentFile} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white text-sm font-bold rounded-2xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20"
                        >
                          View Document
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  );
                }

                return (
                  <img 
                    src={currentFile} 
                    alt={property.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                );
              })()}
              
              {allImages.length > 1 && (
                <>
                  <button 
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-all"
                  >
                    <ChevronLeft className="w-6 h-6 text-slate-900" />
                  </button>
                  <button 
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-all"
                  >
                    <ChevronRight className="w-6 h-6 text-slate-900" />
                  </button>
                  
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                    {allImages.map((_, idx) => (
                      <div 
                        key={idx}
                        className={`w-2 h-2 rounded-full transition-all ${
                          idx === currentImageIndex ? 'bg-white w-6' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}

              <div className="absolute top-6 left-6 flex gap-2">
                {property.is_verified ? (
                  <div className="px-4 py-2 bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl shadow-lg flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" /> Verified
                  </div>
                ) : (
                  <div className="px-4 py-2 bg-orange-500 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl shadow-lg flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Pending
                  </div>
                )}
              </div>
            </div>

            {/* Content Section */}
            <div className="w-full md:w-1/2 p-8 md:p-12 overflow-y-auto">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 mb-2">{property.title}</h2>
                  <div className="flex items-center gap-2 text-slate-400 font-medium">
                    <MapPin className="w-4 h-4" />
                    {property.address}
                  </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-4xl font-black text-orange-500">₱{property.price?.toLocaleString()}</span>
                <span className="text-slate-400 font-bold">/month</span>
              </div>

              {property.landlord_phone && (
                <div className="mb-8 p-4 bg-orange-50 border border-orange-100 rounded-3xl flex items-center justify-between group/quick-contact">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-orange-400 uppercase tracking-widest">Direct Contact</p>
                      <p className="text-lg font-black text-slate-900">{property.landlord_phone}</p>
                    </div>
                  </div>
                  <a 
                    href={`tel:${property.landlord_phone}`}
                    className="px-4 py-2 bg-white text-orange-500 text-xs font-bold rounded-xl border border-orange-200 hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all shadow-sm"
                  >
                    Call Now
                  </a>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-slate-50 p-4 rounded-3xl flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center">
                    <LayoutGrid className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bedrooms</p>
                    <p className="text-sm font-black text-slate-900">{property.beds || 1} Rooms</p>
                  </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-3xl flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center">
                    <Star className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bathrooms</p>
                    <p className="text-sm font-black text-slate-900">{property.baths || 1} Baths</p>
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Description</h4>
                <p className="text-slate-600 leading-relaxed font-medium">
                  {property.description || 'No description provided.'}
                </p>
              </div>

              {/* Landlord Information */}
              <div className="mb-8 p-8 bg-slate-50 rounded-[40px] border border-slate-100 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-orange-500/10 transition-colors"></div>
                
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-6">Contact Landlord</h4>
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-orange-500 font-black text-2xl border border-slate-100">
                      {property.landlord_name?.charAt(0) || <UserIcon className="w-8 h-8" />}
                    </div>
                    <div>
                      <p className="text-xl font-black text-slate-900 mb-1">{property.landlord_name || 'Landlord'}</p>
                      <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full w-fit">
                        <ShieldCheck className="w-3 h-3" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Verified Host</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    {property.landlord_phone ? (
                      <div className="flex flex-col gap-2">
                        <a 
                          href={`tel:${property.landlord_phone}`}
                          className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-200 hover:border-orange-500 hover:shadow-lg hover:shadow-orange-500/10 transition-all group/phone"
                        >
                          <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center group-hover/phone:bg-orange-500 group-hover/phone:text-white transition-colors">
                            <Phone className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mobile Number</p>
                            <p className="text-lg font-black text-slate-900">{property.landlord_phone}</p>
                          </div>
                        </a>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(property.landlord_phone);
                            showNotification('Phone number copied to clipboard!', 'success');
                          }}
                          className="text-[10px] font-bold text-slate-400 hover:text-orange-500 transition-colors text-right pr-2 uppercase tracking-widest"
                        >
                          Copy Number
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-4 p-4 bg-slate-100/50 rounded-2xl border border-dashed border-slate-200">
                        <div className="w-10 h-10 bg-slate-200 text-slate-400 rounded-xl flex items-center justify-center">
                          <Phone className="w-5 h-5" />
                        </div>
                        <p className="text-sm font-bold text-slate-400 italic">No contact number provided</p>
                      </div>
                    )}

                    {property.landlord_email && (
                      <a 
                        href={`mailto:${property.landlord_email}`}
                        className="flex items-center gap-3 px-4 py-2 text-slate-500 hover:text-slate-900 transition-colors"
                      >
                        <Mail className="w-4 h-4" />
                        <span className="text-sm font-medium">{property.landlord_email}</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Amenities</h4>
                <div className="flex flex-wrap gap-2">
                  {property.amenities?.map((amenity: string) => (
                    <span 
                      key={amenity}
                      className="px-4 py-2 bg-slate-50 text-slate-600 text-xs font-bold rounded-xl border border-slate-100"
                    >
                      {amenity}
                    </span>
                  )) || <p className="text-xs text-slate-400">No amenities listed.</p>}
                </div>
              </div>

              <div className="p-6 bg-slate-900 rounded-[32px] text-white mb-8">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Property Performance</p>
                  <Activity className="w-4 h-4 text-orange-500" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-xl font-black">{property.views || 0}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Views</p>
                  </div>
                  <div className="text-center border-x border-white/10">
                    <p className="text-xl font-black">{property.inquiries || 0}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Inquiries</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-black">{property.bookings || 0}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bookings</p>
                  </div>
                </div>
              </div>

              {isStudent && (
                <div className="space-y-4">
                  <AnimatePresence>
                    {isMessaging ? (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="space-y-3"
                      >
                        <textarea
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="Type your message to the landlord..."
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-orange-500 transition-all resize-none text-slate-900"
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setIsMessaging(false)}
                            className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all"
                          >
                            Cancel
                          </button>
                          <button 
                            onClick={handleSendMessage}
                            disabled={sending || !message.trim()}
                            className="flex-[2] py-3 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            <Send className="w-4 h-4" />
                            {sending ? 'Sending...' : 'Send Message'}
                          </button>
                        </div>
                      </motion.div>
                    ) : (
                      <div className="flex gap-4">
                        <button 
                          onClick={() => setIsMessaging(true)}
                          className="flex-1 py-4 bg-slate-100 text-slate-900 rounded-2xl font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                        >
                          <MessageSquare className="w-5 h-5" />
                          Message
                        </button>
                        <button 
                          onClick={() => onBook?.(property)}
                          className="flex-[2] py-4 bg-orange-500 text-white rounded-2xl font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
                        >
                          Book Now
                        </button>
                      </div>
                    )}
                  </AnimatePresence>

                  {onReport && (
                    <button 
                      onClick={() => onReport(property)}
                      className="w-full py-3 text-red-500 text-xs font-bold hover:underline flex items-center justify-center gap-1.5"
                    >
                      <AlertCircle className="w-3.5 h-3.5" />
                      Report this listing
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
