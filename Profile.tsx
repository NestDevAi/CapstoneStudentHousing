import React from 'react';
import { User, Mail, Phone, Shield, Bell, Lock, Camera, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

export const Profile = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Profile Header */}
      <div className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex items-center gap-10">
          <div className="relative group">
            <div className="w-40 h-40 rounded-[40px] bg-orange-500 flex items-center justify-center text-white text-5xl font-black shadow-2xl shadow-slate-200">
              AD
            </div>
            <button className="absolute bottom-2 right-2 p-3 bg-orange-500 text-white rounded-2xl shadow-lg hover:bg-orange-600 transition-all opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100">
              <Camera className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-4xl font-black text-slate-900 tracking-tight">Admin User</h2>
              <span className="px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-[10px] font-bold uppercase tracking-widest border border-orange-100">
                Super Admin
              </span>
            </div>
            <p className="text-slate-500 mb-6 font-medium">Platform Security & Infrastructure Management</p>
            
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2 text-slate-400">
                <Mail className="w-4 h-4" />
                <span className="text-sm font-bold">admin@safestaybaguio.com</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <Shield className="w-4 h-4" />
                <span className="text-sm font-bold">System Level Access</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50/50 blur-[60px] rounded-full -mr-20 -mt-20"></div>
      </div>

      {/* Settings Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Admin Info */}
        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-slate-50 rounded-xl text-slate-900">
              <User className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Administrative Details</h3>
          </div>
          
          <div className="space-y-4">
            {[
              { label: 'Admin ID', value: 'ADM-001-ALPHA' },
              { label: 'Access Level', value: 'Full Access (Root)' },
              { label: 'Last Login', value: 'March 11, 2026 • 12:45 UTC' },
              { label: 'Security Clearance', value: 'Level 5' },
            ].map((field, idx) => (
              <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group cursor-pointer hover:bg-white hover:shadow-md transition-all">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{field.label}</p>
                  <p className="text-sm font-bold text-slate-900">{field.value}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-orange-500 transition-all" />
              </div>
            ))}
          </div>
        </div>

        {/* Security & System Settings */}
        <div className="space-y-8">
          <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-slate-50 rounded-xl text-slate-900">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Security & Auth</h3>
            </div>
            
            <div className="space-y-3">
              <button className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between hover:bg-white hover:shadow-md transition-all group">
                <div className="flex items-center gap-3">
                  <Shield className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-bold text-slate-900">2FA Settings</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-orange-500 transition-all" />
              </button>
              
              <button className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between hover:bg-white hover:shadow-md transition-all group">
                <div className="flex items-center gap-3">
                  <Bell className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-bold text-slate-900">Alert Preferences</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-orange-500 transition-all" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
