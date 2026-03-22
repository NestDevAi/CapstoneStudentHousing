import React, { useState, useEffect } from 'react';
import { Search, MapPin, Filter, Star, Heart, Wifi, Coffee, ShieldCheck, MessageSquare, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { db as supabase } from '../../../lib/db';
import { useNotification } from '../../../contexts/NotificationContext';
import { BookingModal } from '../modals/BookingModal';
import { PropertyDetailsModal } from '../../landlord/modals/PropertyDetailsModal';
import { ReportModal } from '../modals/ReportModal';

export const BrowseListings = ({ user, onRequireVerification, onNavigate, onLogin }: { user: any; onRequireVerification: () => void; onNavigate: (tab: string) => void; onLogin?: () => void }) => {
  const { showNotification } = useNotification();
  const [listings, setListings] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [priceRange, setPriceRange] = useState(50000);
  const [selectedLocation, setSelectedLocation] = useState('All Locations');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedListing, setSelectedListing] = useState<any>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const locations = ['All Locations', 'Baguio City', 'La Trinidad', 'Itogon', 'Tuba', 'Sablan'];
  const amenityOptions = ['WiFi', 'Kitchen', 'Laundry', 'Security', 'AC', 'Parking'];

  useEffect(() => {
    const fetchListings = async () => {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('status', 'Active');

      if (error) {
        console.error('Error fetching listings:', error);
      } else {
        setListings(data || []);
      }
      setLoading(false);
    };

    fetchListings();

    const subscription = supabase
      .channel('public_listings')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'listings',
        filter: "status=eq.Active"
      }, fetchListings)
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const filteredListings = listings.filter(listing => {
    const matchesSearch = listing.title.toLowerCase().includes(search.toLowerCase()) || 
                         (listing.location || listing.address || '').toLowerCase().includes(search.toLowerCase());
    const matchesPrice = (listing.price || 0) <= priceRange;
    const matchesLocation = selectedLocation === 'All Locations' || (listing.location || listing.address || '').includes(selectedLocation);
    const matchesAmenities = selectedAmenities.length === 0 || 
                            selectedAmenities.every(a => (listing.amenities || []).includes(a));
    const matchesAvailability = !onlyAvailable || listing.available !== false;

    return matchesSearch && matchesPrice && matchesLocation && matchesAmenities && matchesAvailability;
  });

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities(prev => 
      prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
    );
  };

  const handleBookNow = (listing: any) => {
    if (!user) {
      showNotification('Please sign in to book a property.', 'info', {
        label: 'Sign In',
        onClick: () => onLogin?.()
      });
      return;
    }
    if (!user?.is_verified) {
      onRequireVerification();
      return;
    }
    setSelectedListing(listing);
    setIsBookingModalOpen(true);
  };

  const handleViewDetails = (listing: any) => {
    setSelectedListing(listing);
    setIsDetailsModalOpen(true);
  };

  const handleReportListing = (listing: any) => {
    if (!user) {
      onLogin?.();
      return;
    }
    setSelectedListing(listing);
    setIsReportModalOpen(true);
  };

  const handleSaveProperty = async (listing: any) => {
    if (!user) {
      onLogin?.();
      return;
    }
    if (!user?.id) return;
    try {
      const { error } = await supabase.from('saved_properties').insert({
        user_id: user.id,
        listing_id: listing.id,
        listing_title: listing.title,
        listing_image: listing.image_url || (listing.images && listing.images[0]),
        listing_price: listing.price,
        listing_location: listing.location || listing.address
      });

      if (error) throw error;
      showNotification('Property saved to your favorites!', 'success');
    } catch (error) {
      console.error('Error saving property:', error);
      showNotification('Failed to save property.', 'error');
    }
  };

  const handleMessageLandlord = async (listing: any, customMessage?: string) => {
    if (!user) {
      showNotification('Please sign in to message the landlord.', 'info', {
        label: 'Sign In',
        onClick: () => onLogin?.()
      });
      return;
    }

    try {
      const participants = [user.id, listing.landlord_id].sort();
      const { error } = await supabase.from('messages').insert({
        sender_id: user.id,
        sender_name: user.full_name || user.email,
        receiver_id: listing.landlord_id,
        receiver_name: listing.landlord_name || 'Landlord',
        text: customMessage || `Hi! I'm interested in your property: ${listing.title}`,
        participants: participants,
        listing_id: listing.id
      });
      
      if (error) throw error;
      
      if (!customMessage) {
        onNavigate('messages');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      showNotification('Failed to send message.', 'error');
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
      {/* Search and Filter Bar */}
      <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 space-y-6">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex-1 min-w-[300px] relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search by university, area, or street..."
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-orange-500 transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-4">
            <select 
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-orange-500 transition-all appearance-none cursor-pointer"
            >
              {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
            </select>

            <div className="flex items-center gap-3 px-6 py-4 bg-slate-50 rounded-2xl border border-slate-100">
              <Filter className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-bold text-slate-700 min-w-[100px]">Max: <span className="text-orange-600">₱{priceRange.toLocaleString()}</span></span>
              <input 
                type="range" 
                min="2000" 
                max="100000" 
                step="500"
                value={priceRange}
                onChange={(e) => setPriceRange(parseInt(e.target.value))}
                className="w-32 accent-orange-500"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-6 pt-6 border-t border-slate-50">
          <div className="flex flex-wrap gap-2">
            {amenityOptions.map(amenity => (
              <button
                key={amenity}
                onClick={() => toggleAmenity(amenity)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                  selectedAmenities.includes(amenity)
                    ? 'bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-900/10'
                    : 'bg-white border-slate-200 text-slate-500 hover:border-orange-500'
                }`}
              >
                {amenity}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative">
              <input 
                type="checkbox" 
                className="sr-only" 
                checked={onlyAvailable}
                onChange={() => setOnlyAvailable(!onlyAvailable)}
              />
              <div className={`w-12 h-6 rounded-full transition-colors ${onlyAvailable ? 'bg-orange-500' : 'bg-slate-200'}`}></div>
              <div className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform ${onlyAvailable ? 'translate-x-6' : 'translate-x-0'}`}></div>
            </div>
            <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900 transition-colors">Available Only</span>
          </label>
        </div>
      </div>

      <BookingModal 
        isOpen={isBookingModalOpen} 
        onClose={() => setIsBookingModalOpen(false)} 
        listing={selectedListing} 
        user={user} 
      />

      <PropertyDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        property={selectedListing}
        isStudent={true}
        onBook={handleBookNow}
        onMessage={handleMessageLandlord}
        onReport={handleReportListing}
      />

      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        listing={selectedListing}
        user={user}
      />

      {/* Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredListings.map((listing, idx) => (
          <motion.div 
            key={listing.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            onClick={() => handleViewDetails(listing)}
            className="group bg-white rounded-[32px] overflow-hidden border border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 transition-all cursor-pointer"
          >
            <div className="relative aspect-[4/3] overflow-hidden">
              <img 
                src={listing.image_url || (listing.images && listing.images[0])} 
                alt={listing.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleSaveProperty(listing);
                }}
                className="absolute top-4 right-4 p-3 bg-white/80 backdrop-blur-md rounded-2xl text-slate-400 hover:text-red-500 transition-all"
              >
                <Heart className="w-5 h-5" />
              </button>
              {listing.is_verified && (
                <div className="absolute top-4 left-4 px-3 py-1.5 bg-emerald-500 text-white rounded-xl flex items-center gap-1.5 shadow-lg">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Verified</span>
                </div>
              )}
            </div>
            
            <div className="p-6">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-slate-900 line-clamp-1">{listing.title}</h3>
                <div className="flex items-center gap-1 text-orange-500">
                  <Star className="w-4 h-4 fill-current" />
                  <span className="text-sm font-bold">{listing.rating || 4.5}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-1 text-slate-500 text-sm mb-4">
                <MapPin className="w-4 h-4" />
                <span>{listing.location || listing.address}</span>
              </div>
              
              <div className="flex gap-2 mb-6">
                {(listing.amenities || []).map((amenity: string) => (
                  <span key={amenity} className="px-3 py-1 bg-slate-50 text-slate-500 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                    {amenity}
                  </span>
                ))}
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                <div>
                  <span className="text-2xl font-black text-slate-900">₱{listing.price?.toLocaleString()}</span>
                  <span className="text-slate-400 text-xs font-bold">/month</span>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReportListing(listing);
                    }}
                    className="p-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-all"
                    title="Report Listing"
                  >
                    <AlertCircle className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewDetails(listing);
                    }}
                    className="p-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all"
                    title="Message Landlord"
                  >
                    <MessageSquare className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBookNow(listing);
                    }}
                    className="px-5 py-2.5 bg-orange-500 text-white rounded-xl text-xs font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20"
                  >
                    Book Now
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
