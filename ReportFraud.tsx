import React from 'react';
import { AlertTriangle, ShieldAlert, FileWarning, HelpCircle, ArrowRight, Upload } from 'lucide-react';
import { motion } from 'motion/react';

export const ReportFraud = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header Warning */}
      <div className="bg-red-50 border border-red-100 p-8 rounded-[40px] flex items-center gap-6">
        <div className="w-16 h-16 bg-red-500 rounded-3xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-red-500/20">
          <ShieldAlert className="w-8 h-8 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-red-900 mb-1">Suspicious Activity?</h2>
          <p className="text-red-700/80 text-sm">If you suspect a listing is fraudulent or a landlord is acting suspiciously, please report it immediately. Your safety is our top priority.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Form */}
        <div className="md:col-span-2 bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm space-y-6">
          <h3 className="text-xl font-bold text-slate-900 mb-6">Fraud Report Form</h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2">Type of Issue</label>
              <select className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-red-500 transition-all appearance-none">
                <option>Fake Listing / Photos</option>
                <option>Suspicious Payment Request</option>
                <option>Identity Theft Suspected</option>
                <option>Harassment / Safety Concern</option>
                <option>Other</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2">Listing URL or Landlord Name</label>
              <input 
                type="text" 
                placeholder="Enter details..."
                className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-red-500 transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2">Description of Incident</label>
              <textarea 
                rows={4}
                placeholder="Please provide as much detail as possible..."
                className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-red-500 transition-all resize-none"
              ></textarea>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2">Evidence (Screenshots, Emails)</label>
              <div className="border-2 border-dashed border-slate-100 rounded-3xl p-8 text-center hover:border-red-200 hover:bg-red-50/30 transition-all cursor-pointer group">
                <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2 group-hover:text-red-400 transition-all" />
                <p className="text-sm font-bold text-slate-500">Click to upload or drag & drop</p>
                <p className="text-[10px] text-slate-400 mt-1">PNG, JPG or PDF (max 10MB)</p>
              </div>
            </div>

            <button className="w-full py-4 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 flex items-center justify-center gap-2">
              Submit Report <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sidebar Tips */}
        <div className="space-y-6">
          <div className="bg-slate-900 p-8 rounded-[40px] text-white">
            <HelpCircle className="w-10 h-10 text-orange-500 mb-6" />
            <h4 className="text-lg font-bold mb-4">Common Scams to Watch For:</h4>
            <ul className="space-y-4">
              {[
                "Requests for payment via wire transfer or crypto.",
                "Landlords who claim to be 'out of the country'.",
                "Listings that are 'too good to be true' for the price.",
                "Pressure to pay a deposit before seeing the property."
              ].map((tip, idx) => (
                <li key={idx} className="flex gap-3 text-xs text-slate-400 leading-relaxed">
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-1 flex-shrink-0" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white p-8 rounded-[40px] border border-slate-100">
            <h4 className="font-bold text-slate-900 mb-2">Need Immediate Help?</h4>
            <p className="text-xs text-slate-500 mb-6">If you are in immediate danger, please contact local authorities first.</p>
            <button className="w-full py-3 border-2 border-slate-100 text-slate-900 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all">
              Call Emergency Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
