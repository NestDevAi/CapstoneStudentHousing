import React, { useState, useRef } from 'react';
import { X, Upload, MapPin, Home, DollarSign, Info, FileText, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db as supabase } from '../../../lib/db';
import { useNotification } from '../../../contexts/NotificationContext';

interface AddPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  editingProperty?: any;
}

export const AddPropertyModal: React.FC<AddPropertyModalProps> = ({ isOpen, onClose, user, editingProperty }) => {
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    title: editingProperty?.title || '',
    location: editingProperty?.location || '',
    address: editingProperty?.address || '',
    price: editingProperty?.price?.toString() || '',
    beds: editingProperty?.beds?.toString() || '1',
    baths: editingProperty?.baths?.toString() || '1',
    amenities: editingProperty?.amenities || [] as string[],
    description: editingProperty?.description || '',
    image: editingProperty?.image || '',
    images: editingProperty?.images || [] as string[]
  });

  // Reset form when editingProperty changes
  React.useEffect(() => {
    if (editingProperty) {
      setFormData({
        title: editingProperty.title || '',
        location: editingProperty.location || '',
        address: editingProperty.address || '',
        price: editingProperty.price?.toString() || '',
        beds: editingProperty.beds?.toString() || '1',
        baths: editingProperty.baths?.toString() || '1',
        amenities: editingProperty.amenities || [],
        description: editingProperty.description || '',
        image: editingProperty.image || '',
        images: editingProperty.images || []
      });
    } else {
      setFormData({
        title: '',
        location: '',
        address: '',
        price: '',
        beds: '1',
        baths: '1',
        amenities: [],
        description: '',
        image: '',
        images: []
      });
    }
  }, [editingProperty, isOpen]);

  const amenitiesList = ['Wifi', 'Kitchen', 'Laundry', 'Gym', 'Pool', 'Security', 'Parking'];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map(async (file: File) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
        const filePath = `listings/${user.id}/${fileName}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage.from('listings').upload(filePath, file);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('listings').getPublicUrl(uploadData.path);
        return publicUrl;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls]
      }));
    } catch (error) {
      console.error('Error uploading files:', error);
      showNotification('Failed to upload one or more files. Please try again.', 'error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setLoading(true);
    try {
      // Use the first image as the main image_url if not set
      const mainImageUrl = formData.image || (formData.images.length > 0 ? formData.images.find(img => !img.toLowerCase().endsWith('.pdf') && !img.toLowerCase().endsWith('.doc') && !img.toLowerCase().endsWith('.docx')) || formData.images[0] : '');

      const propertyData = {
        title: formData.title,
        address: formData.address,
        price: parseFloat(formData.price),
        beds: parseInt(formData.beds),
        baths: parseInt(formData.baths),
        amenities: formData.amenities,
        description: formData.description,
        image_url: mainImageUrl,
        images: formData.images,
        landlord_id: user.id,
        landlord_name: user.full_name || user.email,
        landlord_phone: user.phone || '',
        landlord_email: user.email || '',
        type: 'Apartment'
      };

      if (editingProperty) {
        const { error } = await supabase
          .from('listings')
          .update(propertyData)
          .eq('id', editingProperty.id);
        
        if (error) throw error;
        showNotification('Property updated successfully!', 'success');
      } else {
        const { error } = await supabase
          .from('listings')
          .insert({
            ...propertyData,
            status: 'Pending',
            is_verified: false,
            verification_status: 'Pending',
            rating: 0,
            reviews_count: 0,
            views: 0,
            inquiries: 0,
            bookings: 0
          });
        
        if (error) throw error;
        showNotification('Property listed successfully! It will be visible to students once verified by admin.', 'success');
      }
      onClose();
    } catch (error) {
      console.error('Error saving property:', error);
      showNotification('Failed to save property. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleAmenity = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
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
            className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl overflow-hidden"
          >
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-900">{editingProperty ? 'Edit Property' : 'Add New Property'}</h2>
                <p className="text-slate-500 text-sm">{editingProperty ? 'Update your property details' : 'Fill in the details to list your property'}</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 max-h-[70vh] overflow-y-auto space-y-8">
              {/* Image Upload Placeholder */}
              <div className="space-y-4">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Property Documents & Photos</label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  multiple
                  accept="image/*,.pdf,.doc,.docx"
                  className="hidden"
                />
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`aspect-square bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 group hover:border-orange-500 transition-all cursor-pointer ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    <div className="p-3 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                      {uploading ? (
                        <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />
                      ) : (
                        <Upload className="w-5 h-5 text-orange-500" />
                      )}
                    </div>
                    <p className="text-[10px] font-bold text-slate-900">{uploading ? 'Uploading...' : 'Upload Files'}</p>
                    <p className="text-[8px] text-slate-400">Images, PDF, Docs</p>
                  </div>

                  {formData.images.map((img, idx) => {
                    const isPdf = img.toLowerCase().endsWith('.pdf');
                    const isDoc = img.toLowerCase().endsWith('.doc') || img.toLowerCase().endsWith('.docx');
                    
                    return (
                      <div key={idx} className="aspect-square rounded-3xl overflow-hidden relative group bg-slate-50 border border-slate-100">
                        {isPdf || isDoc ? (
                          <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-4">
                            <FileText className={`w-8 h-8 ${isPdf ? 'text-rose-500' : 'text-blue-500'}`} />
                            <p className="text-[8px] font-bold text-slate-500 truncate w-full text-center">
                              {img.split('/').pop()?.split('_').pop() || 'Document'}
                            </p>
                          </div>
                        ) : (
                          <img src={img} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                        )}
                        <button 
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute top-2 right-2 p-1.5 bg-white/90 backdrop-blur-sm text-rose-500 rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Property Title</label>
                  <div className="relative">
                    <Home className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                    <input
                      required
                      value={formData.title}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g. Modern Studio near UB"
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-orange-500 transition-all text-slate-900 font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Monthly Rent (₱)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                    <input
                      required
                      type="number"
                      value={formData.price}
                      onChange={e => setFormData({ ...formData, price: e.target.value })}
                      placeholder="e.g. 8500"
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-orange-500 transition-all text-slate-900 font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Full Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                    <input
                      required
                      value={formData.address}
                      onChange={e => setFormData({ ...formData, address: e.target.value })}
                      placeholder="e.g. 123 Session Road, Baguio City"
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-orange-500 transition-all text-slate-900 font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Bedrooms</label>
                  <select
                    value={formData.beds}
                    onChange={e => setFormData({ ...formData, beds: e.target.value })}
                    className="w-full px-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-orange-500 transition-all text-slate-900 font-medium"
                  >
                    {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} Bedroom{n > 1 ? 's' : ''}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Bathrooms</label>
                  <select
                    value={formData.baths}
                    onChange={e => setFormData({ ...formData, baths: e.target.value })}
                    className="w-full px-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-orange-500 transition-all text-slate-900 font-medium"
                  >
                    {[1, 2, 3].map(n => <option key={n} value={n}>{n} Bathroom{n > 1 ? 's' : ''}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Amenities</label>
                <div className="flex flex-wrap gap-2">
                  {amenitiesList.map(amenity => (
                    <button
                      key={amenity}
                      type="button"
                      onClick={() => toggleAmenity(amenity)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        formData.amenities.includes(amenity)
                          ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                          : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      {amenity}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your property, rules, and neighborhood..."
                  rows={4}
                  className="w-full px-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-orange-500 transition-all text-slate-900 font-medium resize-none"
                />
              </div>
            </form>

            <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-100 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-[2] py-4 bg-orange-500 text-white rounded-2xl font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (editingProperty ? 'Updating...' : 'Adding...') : (editingProperty ? 'Update Property' : 'List Property Now')}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
