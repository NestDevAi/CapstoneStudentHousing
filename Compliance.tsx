import React from 'react';
import { ShieldCheck, FileCheck, Scale, AlertCircle, CheckCircle2, ChevronRight, Download } from 'lucide-react';
import { motion } from 'motion/react';

const COMPLIANCE_ITEMS = [
  {
    id: 1,
    title: "Fire Safety Certification",
    description: "Annual fire safety inspection and certification for all properties.",
    status: "Compliant",
    expiry: "Dec 31, 2025",
    icon: <ShieldCheck className="text-emerald-500" />
  },
  {
    id: 2,
    title: "Local Business Permit",
    description: "Baguio City business permit for property rental services.",
    status: "Compliant",
    expiry: "Jan 20, 2026",
    icon: <FileCheck className="text-blue-500" />
  },
  {
    id: 3,
    title: "Tax Compliance (BIR)",
    description: "Quarterly tax filings and annual registration renewal.",
    status: "Compliant",
    expiry: "Jun 30, 2025",
    icon: <Scale className="text-purple-500" />
  },
  {
    id: 4,
    title: "Sanitary Permit",
    description: "Health and sanitation clearance for shared accommodation spaces.",
    status: "Expiring Soon",
    expiry: "May 30, 2025",
    icon: <AlertCircle className="text-orange-500" />
  }
];

export const Compliance = () => {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Compliance & Legal</h2>
        <p className="text-slate-500 text-sm">Ensure your properties meet all local regulations and legal requirements</p>
      </div>

      <div className="bg-emerald-50 border border-emerald-100 p-8 rounded-[40px] flex items-center gap-6">
        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm">
          <ShieldCheck className="w-8 h-8 text-emerald-500" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-emerald-900">Overall Compliance Status: Excellent</h3>
          <p className="text-sm text-emerald-700 font-medium">You are currently meeting 95% of the required legal standards for the Baguio City area.</p>
        </div>
        <button className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-bold text-sm hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20">
          Download Full Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {COMPLIANCE_ITEMS.map((item, idx) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex items-start gap-5">
              <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                {item.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-slate-900">{item.title}</h4>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    item.status === 'Compliant' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'
                  }`}>
                    {item.status}
                  </span>
                </div>
                <p className="text-sm text-slate-500 mb-4">{item.description}</p>
                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Expires: <span className="text-slate-900">{item.expiry}</span>
                  </div>
                  <button className="flex items-center gap-1 text-xs font-bold text-orange-500 hover:gap-2 transition-all">
                    Renew Now <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-[#0F172A] p-10 rounded-[48px] text-white relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <h3 className="text-2xl font-bold mb-4">Legal Resources for Landlords</h3>
          <p className="text-slate-400 text-sm leading-relaxed mb-8">
            Access our library of lease agreement templates, local ordinances, and legal guides specifically curated for property owners in Baguio City.
          </p>
          <div className="flex flex-wrap gap-4">
            <button className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold transition-all border border-white/10">
              <Download className="w-4 h-4" />
              Lease Template
            </button>
            <button className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold transition-all border border-white/10">
              <Download className="w-4 h-4" />
              Tenant Handbook
            </button>
            <button className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold transition-all border border-white/10">
              <Download className="w-4 h-4" />
              Local Ordinances
            </button>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-orange-500/20 to-transparent pointer-events-none" />
      </div>
    </div>
  );
};
