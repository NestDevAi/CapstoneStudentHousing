import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Eye, MapPin, Star, LayoutGrid, List, Shield, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { db as supabase } from '../../../lib/db';
import { AddPropertyModal } from '../modals/AddPropertyModal';
import { PropertyDetailsModal } from '../modals/PropertyDetailsModal';
import { useNotification } from '../../../contexts/NotificationContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const MyProperties = ({ user, onRequireVerification }: { user: any; onRequireVerification: () => void }) => {
  const { showNotification } = useNotification();
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<any>(null);

  const handleEdit = (property: any) => {
    setEditingProperty(property);
    setIsAddModalOpen(true);
  };

  const handleView = (property: any) => {
    setSelectedProperty(property);
    setIsDetailsModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
    setEditingProperty(null);
  };

  const handleRequestVerification = async (property: any) => {
    if (!user?.is_verified) {
      showNotification('Please verify your landlord account first before verifying individual properties.', 'info');
      onRequireVerification();
      return;
    }

    setVerifyingId(property.id);
    try {
      const { error } = await supabase.from('verifications').insert({
        user_id: user.id,
        user_email: user.email,
        user_name: user.full_name || user.email,
        role: 'landlord',
        status: 'Pending',
        type: 'Property Verification',
        listing_id: property.id,
        property_title: property.title
      });

      if (error) throw error;
      showNotification('Verification request submitted! Admin will review it shortly.', 'success');
    } catch (error) {
      console.error('Error requesting verification:', error);
      showNotification('Failed to submit verification request.', 'error');
    } finally {
      setVerifyingId(null);
    }
  };

  useEffect(() => {
    if (!user?.id) return;

    const fetchProperties = async () => {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('landlord_id', user.id);

      if (error) {
        console.error('Error fetching properties:', error);
      } else {
        setProperties(data || []);
        
        // Auto-sync landlord info if missing
        const missingInfo = (data || []).filter(p => !p.landlord_name || !p.landlord_phone);
        if (missingInfo.length > 0) {
          const syncInfo = async () => {
            const updates = missingInfo.map(p => 
              supabase.from('listings').update({
                landlord_name: user.full_name || user.email,
                landlord_phone: user.phone || '',
                landlord_email: user.email || ''
              }).eq('id', p.id)
            );
            try {
              await Promise.all(updates);
            } catch (error) {
              console.error('Error syncing landlord info:', error);
            }
          };
          syncInfo();
        }
      }
      setLoading(false);
    };

    fetchProperties();

    const subscription = supabase
      .channel('landlord_listings')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'listings',
        filter: `landlord_id=eq.${user.id}`
      }, fetchProperties)
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id, user?.full_name, user?.phone, user?.email]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">My Properties</h2>
          <p className="text-slate-500 text-sm">Manage your property listings and availability</p>
        </div>
        <button 
          onClick={() => {
            if (!user?.is_verified) {
              onRequireVerification();
              return;
            }
            setIsAddModalOpen(true);
          }}
          className="flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20"
        >
          <Plus className="w-5 h-5" />
          Add New Property
        </button>
      </div>

      <AddPropertyModal 
        isOpen={isAddModalOpen} 
        onClose={handleCloseAddModal} 
        user={user}
        editingProperty={editingProperty}
      />

      <PropertyDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        property={selectedProperty}
      />

      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between gap-4">
        {/* ... existing filter bar ... */}
        <div className="flex items-center gap-2">
          <button className="p-2 bg-slate-50 text-slate-900 rounded-lg border border-slate-200">
            <LayoutGrid className="w-5 h-5" />
          </button>
          <button className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg">
            <List className="w-5 h-5" />
          </button>
          <div className="h-8 w-px bg-slate-100 mx-2" />
          <select className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-orange-500/20">
            <option>All Properties</option>
            <option>Active</option>
            <option>Rented</option>
            <option>Pending</option>
          </select>
        </div>

        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Search properties..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {properties.map((property, idx) => (
          <motion.div
            key={property.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white rounded-[32px] overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all group"
          >
            <div className="relative aspect-[16/10] overflow-hidden">
              <img 
                src={property.image_url} 
                alt={property.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
                {property.is_verified ? (
                  <span className="px-3 py-1 bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg shadow-lg flex items-center gap-1">
                    <Shield className="w-3 h-3" /> Verified
                  </span>
                ) : (
                  <span className={cn(
                    "px-3 py-1 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg shadow-lg",
                    property.verification_status === 'Pending' ? 'bg-amber-500' : 
                    property.verification_status === 'Rejected' ? 'bg-rose-500' : 'bg-slate-500'
                  )}>
                    {property.verification_status || 'Unverified'}
                  </span>
                )}
                <span className={cn(
                  "px-3 py-1 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg shadow-lg",
                  property.status === 'Active' ? 'bg-blue-500' : 
                  property.status === 'Rented' ? 'bg-slate-600' : 
                  property.status === 'Flagged' ? 'bg-rose-600' : 'bg-orange-500'
                )}>
                  {property.status}
                </span>
              </div>
            </div>

            <div className="p-6">
              <h3 className="font-bold text-slate-900 mb-1 line-clamp-1">{property.title}</h3>
              <div className="flex items-center gap-1 text-slate-400 text-xs mb-4">
                <MapPin className="w-3 h-3" />
                {property.address}
              </div>

              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-2xl font-black text-orange-500">₱{property.price?.toLocaleString()}</span>
                <span className="text-slate-400 text-xs font-bold">/month</span>
              </div>

              <div className="flex items-center gap-4 text-xs font-bold text-slate-500 mb-6">
                <div className="flex items-center gap-1">
                  <LayoutGrid className="w-3 h-3" />
                  {property.beds || 1} Bed
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  {property.baths || 1} Bath
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-6">
                <div className="bg-slate-50 p-3 rounded-2xl text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Views</p>
                  <p className="text-sm font-black text-slate-900">{property.views || 0}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Inquiries</p>
                  <p className="text-sm font-black text-slate-900">{property.inquiries || 0}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Bookings</p>
                  <p className="text-sm font-black text-slate-900">{property.bookings || 0}</p>
                </div>
              </div>

              <div className="flex gap-3">
                {!property.is_verified && (
                  <button 
                    onClick={() => handleRequestVerification(property)}
                    disabled={verifyingId === property.id}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500 text-white rounded-xl text-xs font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50"
                  >
                    {verifyingId === property.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Shield className="w-4 h-4" />
                        Verify
                      </>
                    )}
                  </button>
                )}
                <button 
                  onClick={() => handleEdit(property)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0F172A] text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button 
                  onClick={() => handleView(property)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all"
                >
                  <Eye className="w-4 h-4" />
                  View
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
