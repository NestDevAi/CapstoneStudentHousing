import React from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Clock, MapPin } from 'lucide-react';
import { motion } from 'motion/react';

const EVENTS = [
  {
    id: 1,
    title: "Move-in: Juan Dela Cruz",
    property: "Modern Studio near University of Baguio",
    date: "Jun 1, 2025",
    type: "Move-in",
    color: "bg-emerald-500"
  },
  {
    id: 2,
    title: "Lease Expiry: Roberto Santos",
    property: "Cozy Bedspace in Shared House",
    date: "Aug 31, 2025",
    type: "Lease End",
    color: "bg-red-500"
  },
  {
    id: 3,
    title: "Property Inspection",
    property: "Spacious 2BR Apartment with Mountain View",
    date: "Jun 15, 2025",
    type: "Inspection",
    color: "bg-blue-500"
  },
  {
    id: 4,
    title: "Maintenance: Heater Repair",
    property: "Modern Studio near University of Baguio",
    date: "May 25, 2025",
    type: "Maintenance",
    color: "bg-orange-500"
  }
];

export const Calendar = () => {
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Calendar</h2>
          <p className="text-slate-500 text-sm">Manage move-ins, lease expirations, and property inspections</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20">
          <Plus className="w-5 h-5" />
          Add Event
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-[48px] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-slate-900">May 2025</h3>
            <div className="flex items-center gap-2">
              <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-4">
            {weekDays.map(day => (
              <div key={day} className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest py-2">
                {day}
              </div>
            ))}
            {/* Empty slots for first week if needed */}
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}
            {days.map(day => (
              <div 
                key={day} 
                className={`aspect-square rounded-2xl border flex flex-col items-center justify-center relative group cursor-pointer transition-all ${
                  day === 20 ? 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/20' : 
                  day === 25 ? 'bg-blue-50 border-blue-100' : 'bg-white border-slate-50 hover:border-orange-200'
                }`}
              >
                <span className={`text-sm font-bold ${day === 20 ? 'text-white' : 'text-slate-900'}`}>{day}</span>
                {day === 25 && <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-1" />}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Upcoming Events</h3>
            <div className="space-y-4">
              {EVENTS.map((event, idx) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-1.5 ${event.color}`} />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 group-hover:text-orange-500 transition-all">{event.title}</h4>
                      <p className="text-[10px] text-slate-500 font-medium mt-1 line-clamp-1">{event.property}</p>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold mt-2">
                        <CalendarIcon className="w-3 h-3" />
                        {event.date}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Event Types</h3>
            <div className="space-y-3">
              {[
                { label: 'Move-in', color: 'bg-emerald-500' },
                { label: 'Lease End', color: 'bg-red-500' },
                { label: 'Inspection', color: 'bg-blue-500' },
                { label: 'Maintenance', color: 'bg-orange-500' },
              ].map(type => (
                <div key={type.label} className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${type.color}`} />
                  <span className="text-xs font-bold text-slate-500">{type.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
