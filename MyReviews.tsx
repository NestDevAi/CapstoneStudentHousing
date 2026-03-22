import React from 'react';
import { Star, MessageSquare, ThumbsUp, MoreVertical, Edit2, Trash2, Plus } from 'lucide-react';
import { motion } from 'motion/react';

const REVIEWS = [
  {
    id: 1,
    property: "Modern Studio near University",
    rating: 5,
    date: "2 months ago",
    comment: "The place was exactly as described. The landlord was very helpful and the location is unbeatable for students. Highly recommend!",
    likes: 12,
    image: "https://picsum.photos/seed/studio1/100/100"
  },
  {
    id: 2,
    property: "Cozy Shared Apartment",
    rating: 4,
    date: "5 months ago",
    comment: "Great value for money. The roommates were friendly and the common areas were always clean. A bit noisy at night though.",
    likes: 5,
    image: "https://picsum.photos/seed/apt2/100/100"
  }
];

export const MyReviews = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Summary Stats */}
      <div className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div className="text-center">
            <p className="text-5xl font-black text-slate-900 mb-1">4.5</p>
            <div className="flex items-center gap-1 text-orange-500 justify-center mb-2">
              {[1, 2, 3, 4, 5].map(i => (
                <Star key={i} className={`w-4 h-4 ${i <= 4 ? 'fill-current' : ''}`} />
              ))}
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Average Rating</p>
          </div>
          <div className="h-16 w-px bg-slate-100" />
          <div>
            <p className="text-3xl font-black text-slate-900 mb-1">12</p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Reviews</p>
          </div>
          <div>
            <p className="text-3xl font-black text-slate-900 mb-1">48</p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Helpful Votes</p>
          </div>
        </div>
        
        <button className="px-8 py-4 bg-orange-500 text-white rounded-2xl font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20 flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Write a Review
        </button>
      </div>

      {/* Reviews List */}
      <div className="space-y-6">
        {REVIEWS.map((review, idx) => (
          <motion.div 
            key={review.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <img src={review.image} alt={review.property} className="w-16 h-16 rounded-2xl object-cover" referrerPolicy="no-referrer" />
                <div>
                  <h3 className="font-bold text-slate-900 text-lg mb-1">{review.property}</h3>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-orange-500">
                      {[1, 2, 3, 4, 5].map(i => (
                        <Star key={i} className={`w-3.5 h-3.5 ${i <= review.rating ? 'fill-current' : ''}`} />
                      ))}
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{review.date}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                <button className="p-2.5 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all"><Edit2 className="w-4 h-4" /></button>
                <button className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>

            <p className="text-slate-600 leading-relaxed mb-6 text-sm italic">"{review.comment}"</p>

            <div className="flex items-center justify-between pt-6 border-t border-slate-50">
              <div className="flex items-center gap-6">
                <button className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-orange-500 transition-all">
                  <ThumbsUp className="w-4 h-4" />
                  {review.likes} Helpful
                </button>
                <button className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-orange-500 transition-all">
                  <MessageSquare className="w-4 h-4" />
                  2 Comments
                </button>
              </div>
              <button className="text-xs font-bold text-slate-900 hover:underline">View Property</button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
