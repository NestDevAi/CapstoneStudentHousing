import React, { useState, useEffect } from 'react';
import { 
  Home, 
  Search, 
  Filter, 
  Eye, 
  Ban, 
  Flag, 
  CheckCircle, 
  XCircle, 
  Loader2,
  MapPin,
  User,
  ShieldAlert,
  Activity,
  Clock
} from 'lucide-react';
import { db as supabase } from '../../../lib/db';
import { useNotification } from '../../../contexts/NotificationContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Listing {
  id: string;
  title: string;
  landlordId: string;
  landlordName?: string;
  location?: string;
  address?: string;
  price: number;
  status: string;
  verified: boolean;
  verificationStatus?: 'Pending' | 'Verified' | 'Rejected';
  createdAt: any;
}

export const PropertyManagement: React.FC = () => {
  const { showNotification } = useNotification();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFlagModalOpen, setIsFlagModalOpen] = useState(false);
  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [selectedLandlord, setSelectedLandlord] = useState<{ id: string, name: string } | null>(null);
  const [flagReason, setFlagReason] = useState('Inappropriate Content');
  const [suspendReason, setSuspendReason] = useState('Violation of Terms');
  const [suspendType, setSuspendType] = useState<'Suspended' | 'Restricted'>('Suspended');

  useEffect(() => {
    const fetchListings = async () => {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching properties:', error);
      } else {
        // Map Supabase fields to the Listing interface
        const mappedListings = (data || []).map(l => ({
          id: l.id,
          title: l.title,
          landlordId: l.landlord_id,
          landlordName: l.landlord_name,
          location: l.location,
          address: l.address,
          price: l.price,
          status: l.status,
          verified: l.is_verified,
          verificationStatus: l.verification_status,
          createdAt: l.created_at
        }));
        setListings(mappedListings as Listing[]);
      }
      setLoading(false);
    };

    fetchListings();

    // Set up real-time subscription
    const subscription = supabase
      .channel('listings_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'listings' }, fetchListings)
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const openFlagModal = (listing: Listing) => {
    setSelectedListing(listing);
    setIsFlagModalOpen(true);
  };

  const openSuspendModal = async (landlordId: string) => {
    try {
      const { data: userData, error } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', landlordId)
        .single();
      
      if (error) throw error;

      const userName = userData?.full_name || userData?.email || 'Unknown Landlord';
      setSelectedLandlord({ id: landlordId, name: userName });
      setIsSuspendModalOpen(true);
    } catch (error) {
      console.error('Error fetching landlord info:', error);
      showNotification('Failed to fetch landlord information.', 'error');
    }
  };

  const confirmFlagAndHide = async () => {
    if (!selectedListing) return;
    try {
      const oldStatus = selectedListing.status || 'Unknown';
      const { error } = await supabase
        .from('listings')
        .update({ 
          status: 'Flagged',
          flag_reason: flagReason
        })
        .eq('id', selectedListing.id);
      
      if (error) throw error;
      
      await supabase.from('audit_logs').insert({
        action: 'Flag & Hide Property',
        target_id: selectedListing.id,
        target_type: 'property',
        details: { oldStatus, newStatus: 'Flagged', reason: flagReason, title: selectedListing.title }
      });

      setIsFlagModalOpen(false);
      setSelectedListing(null);
      showNotification('Listing has been flagged and hidden.', 'success');
    } catch (error) {
      console.error('Error flagging listing:', error);
      showNotification('Failed to flag listing.', 'error');
    }
  };

  const confirmSuspendLandlord = async () => {
    if (!selectedLandlord) return;
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          status: suspendType,
          suspension_reason: suspendReason
        })
        .eq('id', selectedLandlord.id);
      
      if (error) throw error;

      await supabase.from('audit_logs').insert({
        action: `${suspendType} Landlord`,
        target_id: selectedLandlord.id,
        target_type: 'user',
        details: { type: suspendType, reason: suspendReason, name: selectedLandlord.name }
      });

      setIsSuspendModalOpen(false);
      setSelectedLandlord(null);
      showNotification(`Landlord account has been ${suspendType.toLowerCase()}.`, 'success');
    } catch (error) {
      console.error('Error suspending landlord:', error);
      showNotification(`Failed to ${suspendType.toLowerCase()} landlord.`, 'error');
    }
  };

  const handleRestoreListing = async (listingId: string) => {
    const listing = listings.find(l => l.id === listingId);
    showNotification(
      'Restore this listing to Active status?',
      'info',
      {
        label: 'Restore',
        onClick: async () => {
          try {
            const { error } = await supabase
              .from('listings')
              .update({ 
                status: 'Active',
                flag_reason: null
              })
              .eq('id', listingId);
            
            if (error) throw error;

            await supabase.from('audit_logs').insert({
              action: 'Restore Property',
              target_id: listingId,
              target_type: 'property',
              details: { title: listing?.title }
            });
            showNotification('Listing restored to Active status.', 'success');
          } catch (error) {
            console.error('Error restoring listing:', error);
            showNotification('Failed to restore listing.', 'error');
          }
        }
      }
    );
  };

  const handleVerifyListing = async (listingId: string) => {
    const listing = listings.find(l => l.id === listingId);
    try {
      const oldStatus = listing?.status || 'Unknown';
      const { error } = await supabase
        .from('listings')
        .update({ 
          is_verified: true,
          verification_status: 'Verified',
          status: 'Active'
        })
        .eq('id', listingId);
      
      if (error) throw error;

      await supabase.from('audit_logs').insert({
        action: 'Verify Property',
        target_id: listingId,
        target_type: 'property',
        details: { oldStatus, newStatus: 'Active', title: listing?.title }
      });
      showNotification('Property verified and activated.', 'success');
    } catch (error) {
      console.error('Error verifying listing:', error);
      showNotification('Failed to verify property.', 'error');
    }
  };

  const handleRejectListing = async (listingId: string) => {
    const listing = listings.find(l => l.id === listingId);
    const reason = prompt('Reason for rejection:');
    if (reason === null) return;

    try {
      const oldStatus = listing?.status || 'Unknown';
      const { error } = await supabase
        .from('listings')
        .update({ 
          is_verified: false,
          verification_status: 'Rejected',
          status: 'Flagged',
          flag_reason: reason
        })
        .eq('id', listingId);
      
      if (error) throw error;

      await supabase.from('audit_logs').insert({
        action: 'Reject Property',
        target_id: listingId,
        target_type: 'property',
        details: { oldStatus, newStatus: 'Flagged', reason, title: listing?.title }
      });
      showNotification('Property verification rejected.', 'success');
    } catch (error) {
      console.error('Error rejecting listing:', error);
      showNotification('Failed to reject property.', 'error');
    }
  };

  const handleMarkAsRented = async (listingId: string) => {
    const listing = listings.find(l => l.id === listingId);
    showNotification(
      'Are you sure you want to mark this property as Rented? It will be hidden from students.',
      'info',
      {
        label: 'Mark as Rented',
        onClick: async () => {
          try {
            const oldStatus = listing?.status || 'Unknown';
            const { error } = await supabase
              .from('listings')
              .update({ 
                status: 'Rented' 
              })
              .eq('id', listingId);
            
            if (error) throw error;

            await supabase.from('audit_logs').insert({
              action: 'Mark as Rented',
              target_id: listingId,
              target_type: 'property',
              details: { oldStatus, newStatus: 'Rented', title: listing?.title }
            });

            showNotification('Listing marked as rented.', 'success');
          } catch (error) {
            console.error('Error marking as rented:', error);
            showNotification('Failed to update status.', 'error');
          }
        }
      }
    );
  };

  const filteredListings = listings.filter(listing => 
    listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    listing.landlordName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    listing.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    listing.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = [
    { label: 'Total Listings', value: listings.length, color: 'text-blue-500' },
    { label: 'Active', value: listings.filter(l => l.status === 'Active').length, color: 'text-emerald-500' },
    { label: 'Pending Review', value: listings.filter(l => l.status === 'Pending Review').length, color: 'text-amber-500' },
    { label: 'Verified', value: listings.filter(l => l.verified).length, color: 'text-violet-500' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm group hover:shadow-md transition-all">
            <p className="text-sm font-medium text-slate-500 mb-1">{stat.label}</p>
            <h3 className="text-3xl font-bold text-slate-900 mb-2">{stat.value}</h3>
            <div className={cn("h-1 w-12 rounded-full", stat.color.replace('text', 'bg'))} />
          </div>
        ))}
      </div>

      {/* Property Table */}
      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
          <h4 className="text-lg font-bold text-slate-900">Property Listings</h4>
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-orange-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Search properties..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm w-64 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Property</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Landlord</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Price</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredListings.length > 0 ? filteredListings.map((listing) => (
                <tr key={listing.id} className="hover:bg-slate-50/50 transition-all group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                        <Home className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{listing.title}</p>
                        <p className="text-xs text-slate-400 font-medium flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {listing.location || listing.address}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400" />
                      <span className="text-sm font-medium text-slate-600">{listing.landlordName || 'Unknown'}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-sm font-bold text-slate-900">₱{listing.price?.toLocaleString()}</span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex flex-col gap-1">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider w-fit",
                        listing.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 
                        listing.status === 'Pending Review' ? 'bg-amber-50 text-amber-600' : 
                        listing.status === 'Flagged' ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-600'
                      )}>
                        {listing.status}
                      </span>
                      {listing.verified ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 uppercase tracking-wider">
                          <CheckCircle className="w-3 h-3" /> Verified
                        </span>
                      ) : (
                        <span className={cn(
                          "flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider",
                          listing.verificationStatus === 'Pending' ? 'text-amber-500' : 
                          listing.verificationStatus === 'Rejected' ? 'text-rose-500' : 'text-slate-400'
                        )}>
                          {listing.verificationStatus === 'Pending' ? <Clock className="w-3 h-3" /> : 
                           listing.verificationStatus === 'Rejected' ? <XCircle className="w-3 h-3" /> : null}
                          {listing.verificationStatus || 'Unverified'}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {listing.status === 'Flagged' ? (
                        <button 
                          onClick={() => handleRestoreListing(listing.id)}
                          className="p-2 text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                          title="Restore Listing"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      ) : (
                        <>
                          {!listing.verified && (
                            <>
                              <button 
                                onClick={() => handleVerifyListing(listing.id)}
                                className="p-2 text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                title="Verify Listing"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleRejectListing(listing.id)}
                                className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                title="Reject Verification"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {listing.status === 'Active' && (
                            <button 
                              onClick={() => handleMarkAsRented(listing.id)}
                              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                              title="Mark as Rented"
                            >
                              <Activity className="w-4 h-4" />
                            </button>
                          )}
                          <button 
                            onClick={() => openFlagModal(listing)}
                            className="p-2 text-amber-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                            title="Flag & Hide"
                          >
                            <Flag className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <button 
                        onClick={() => openSuspendModal(listing.landlordId)}
                        className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                        title="Restrict/Suspend Landlord"
                      >
                        <Ban className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-8 py-12 text-center text-slate-500 font-medium">
                    No properties found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Flag & Hide Modal */}
      {isFlagModalOpen && selectedListing && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-8 border-b border-slate-50">
              <h3 className="text-xl font-bold text-slate-900">Flag & Hide Property</h3>
              <p className="text-sm text-slate-500 mt-1">This listing will be hidden from students and marked for review.</p>
            </div>
            <div className="p-8 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Reason for Flagging</label>
                <select 
                  value={flagReason}
                  onChange={(e) => setFlagReason(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all"
                >
                  <option value="Inappropriate Content">Inappropriate Content</option>
                  <option value="Misleading Information">Misleading Information</option>
                  <option value="Suspected Fraud">Suspected Fraud</option>
                  <option value="Duplicate Listing">Duplicate Listing</option>
                  <option value="Expired/Unavailable">Expired/Unavailable</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              {flagReason === 'Other' && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Custom Reason</label>
                  <textarea 
                    placeholder="Enter custom reason..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all min-h-[100px]"
                    onChange={(e) => setFlagReason(e.target.value)}
                  />
                </div>
              )}
            </div>
            <div className="p-8 bg-slate-50 flex items-center justify-end gap-3">
              <button 
                onClick={() => {
                  setIsFlagModalOpen(false);
                  setSelectedListing(null);
                }}
                className="px-6 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmFlagAndHide}
                className="px-6 py-2.5 bg-amber-500 text-white text-sm font-bold rounded-xl hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20"
              >
                Flag & Hide
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suspend/Restrict Landlord Modal */}
      {isSuspendModalOpen && selectedLandlord && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-8 border-b border-slate-50">
              <h3 className="text-xl font-bold text-slate-900">Restrict/Suspend Landlord</h3>
              <p className="text-sm text-slate-500 mt-1">Manage account access for {selectedLandlord.name}.</p>
            </div>
            <div className="p-8 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Action Type</label>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setSuspendType('Restricted')}
                    className={cn(
                      "flex-1 py-3 rounded-2xl text-sm font-bold border transition-all",
                      suspendType === 'Restricted' ? "bg-amber-50 border-amber-200 text-amber-600" : "bg-slate-50 border-slate-200 text-slate-500"
                    )}
                  >
                    Restrict
                  </button>
                  <button 
                    onClick={() => setSuspendType('Suspended')}
                    className={cn(
                      "flex-1 py-3 rounded-2xl text-sm font-bold border transition-all",
                      suspendType === 'Suspended' ? "bg-rose-50 border-rose-200 text-rose-600" : "bg-slate-50 border-slate-200 text-slate-500"
                    )}
                  >
                    Suspend
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 px-1">
                  {suspendType === 'Restricted' ? 'Restricted users can view but not post or message.' : 'Suspended users are completely blocked from the platform.'}
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Reason</label>
                <select 
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all"
                >
                  <option value="Violation of Terms">Violation of Terms</option>
                  <option value="Repeated Misleading Listings">Repeated Misleading Listings</option>
                  <option value="Unprofessional Conduct">Unprofessional Conduct</option>
                  <option value="Suspicious Activity">Suspicious Activity</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              {suspendReason === 'Other' && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Custom Reason</label>
                  <textarea 
                    placeholder="Enter custom reason..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all min-h-[100px]"
                    onChange={(e) => setSuspendReason(e.target.value)}
                  />
                </div>
              )}
            </div>
            <div className="p-8 bg-slate-50 flex items-center justify-end gap-3">
              <button 
                onClick={() => {
                  setIsSuspendModalOpen(false);
                  setSelectedLandlord(null);
                }}
                className="px-6 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmSuspendLandlord}
                className={cn(
                  "px-6 py-2.5 text-white text-sm font-bold rounded-xl transition-all shadow-lg",
                  suspendType === 'Restricted' ? "bg-amber-500 hover:bg-amber-600 shadow-amber-500/20" : "bg-rose-500 hover:bg-rose-600 shadow-rose-500/20"
                )}
              >
                Confirm {suspendType}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
