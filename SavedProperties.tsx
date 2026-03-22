import React, { useState, useEffect } from 'react';
import { Heart, MapPin, Star, Trash2, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { db as supabase } from '../../../lib/db';
import { useNotification } from '../../../contexts/NotificationContext';

export const SavedProperties = ({ user }: { user: any }) => {
  const { showNotification } = useNotification();
  const [saved, setSaved] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    const fetchSaved = async () => {
      const { data, error } = await supabase
        .from('saved_properties')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching saved properties:', error);
      } else {
        setSaved(data || []);
      }
      setLoading(false);
    };

    fetchSaved();

    const subscription = supabase
      .channel('public_saved_properties')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'saved_properties',
        filter: `user_id=eq.${user.id}`
      }, fetchSaved)
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id]);

  const handleRemove = async (id: string) => {
    try {
      const { error } = await supabase.from('saved_properties').delete().eq('id', id);
      if (error) throw error;
    } catch (error) {
      console.error('Error removing saved property:', error);
    }
  };

  const handleClearAll = async () => {
    showNotification(
      'Are you sure you want to clear all saved properties?',
      'info',
      {
        label: 'Clear All',
        onClick: async () => {
          try {
            const { error } = await supabase.from('saved_properties').delete().eq('user_id', user.id);
            if (error) throw error;
            showNotification('All saved properties cleared.', 'success');
          } catch (error) {
            console.error('Error clearing saved properties:', error);
            showNotification('Failed to clear saved properties.', 'error');
          }
        }
      }
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-2xl font-bold text-slate-900">Saved Properties ({saved.length})</h2>
        {saved.length > 0 && (
          <button 
            onClick={handleClearAll}
            className="text-sm font-bold text-slate-400 hover:text-red-500 transition-all"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {saved.map((property, idx) => (
          <motion.div 
            key={property.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
            className="group bg-white rounded-[32px] overflow-hidden border border-slate-100 hover:shadow-xl transition-all"
          >
            <div className="relative aspect-[4/3]">
              <img src={property.listing_image} alt={property.listing_title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              <button 
                onClick={() => handleRemove(property.id)}
                className="absolute top-4 right-4 p-3 bg-red-500 text-white rounded-2xl shadow-lg hover:bg-red-600 transition-all"
              >
                <Heart className="w-5 h-5 fill-current" />
              </button>
            </div>
            
            <div className="p-6">
              <h3 className="font-bold text-slate-900 mb-1">{property.listing_title}</h3>
              <div className="flex items-center gap-1 text-slate-500 text-sm mb-4">
                <MapPin className="w-4 h-4" />
                <span>{property.listing_location}</span>
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                <div>
                  <span className="text-xl font-black text-slate-900">₱{property.listing_price?.toLocaleString()}</span>
                  <span className="text-slate-400 text-xs font-bold">/mo</span>
                </div>
                <button 
                  onClick={() => handleRemove(property.id)}
                  className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}

        {saved.length === 0 && (
          <div className="col-span-full py-20 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="w-10 h-10 text-slate-200" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No saved properties yet</h3>
            <p className="text-slate-400 max-w-xs mx-auto text-sm">Start browsing and click the heart icon to save properties you like.</p>
          </div>
        )}
      </div>
    </div>
  );
};
