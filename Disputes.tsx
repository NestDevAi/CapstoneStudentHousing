import React from 'react';
import { AlertTriangle, MessageSquare, Clock, CheckCircle2, ShieldAlert, ChevronRight, User } from 'lucide-react';
import { motion } from 'motion/react';

const DISPUTES = [
  {
    id: 1,
    tenant: "Roberto Santos",
    property: "Cozy Bedspace in Shared House",
    issue: "Maintenance Delay",
    description: "The tenant claims the heater repair is taking too long. It has been 3 days since the initial report.",
    status: "Active",
    priority: "High",
    date: "May 20, 2025"
  },
  {
    id: 2,
    tenant: "Lisa Chen",
    property: "Spacious 2BR Apartment with Mountain View",
    issue: "Noise Complaint",
    description: "Neighbor reported loud music from the unit after 10 PM. Tenant has been notified.",
    status: "Resolved",
    priority: "Medium",
    date: "May 15, 2025"
  }
];

export const Disputes = () => {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Dispute Resolution</h2>
        <p className="text-slate-500 text-sm">Manage and resolve tenant issues and complaints</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Active Disputes', value: '1', icon: <AlertTriangle className="text-orange-500" />, bg: 'bg-orange-50' },
          { label: 'Resolved', value: '12', icon: <CheckCircle2 className="text-emerald-500" />, bg: 'bg-emerald-50' },
          { label: 'Average Resolution', value: '2.4 Days', icon: <Clock className="text-blue-500" />, bg: 'bg-blue-50' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white p-8 rounded-[40px] border border-slate-100 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{stat.label}</p>
              <p className="text-4xl font-black text-slate-900">{stat.value}</p>
            </div>
            <div className={`w-14 h-14 ${stat.bg} rounded-2xl flex items-center justify-center`}>
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-6">
        {DISPUTES.map((dispute, idx) => (
          <motion.div
            key={dispute.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex flex-col md:flex-row gap-8">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    dispute.status === 'Active' ? 'bg-orange-50 text-orange-600' : 'bg-emerald-50 text-emerald-600'
                  }`}>
                    {dispute.status}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    dispute.priority === 'High' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                  }`}>
                    {dispute.priority} Priority
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{dispute.issue}</h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-6">{dispute.description}</p>
                
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                    <User className="w-4 h-4" />
                    Tenant: {dispute.tenant}
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                    <ShieldAlert className="w-4 h-4" />
                    Property: {dispute.property}
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                    <Clock className="w-4 h-4" />
                    Filed on: {dispute.date}
                  </div>
                </div>
              </div>

              <div className="flex flex-col justify-center gap-3 min-w-[200px]">
                <button className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#0F172A] text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10">
                  <MessageSquare className="w-4 h-4" />
                  Open Chat
                </button>
                <button className="w-full flex items-center justify-center gap-2 px-6 py-3 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all">
                  Mark as Resolved
                </button>
                <button className="w-full flex items-center justify-center gap-2 px-6 py-3 text-red-500 text-xs font-bold hover:bg-red-50 rounded-xl transition-all">
                  Escalate to Support
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
