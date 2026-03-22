import React from 'react';
import { Activity, Cpu, Database, Globe, Zap, ShieldCheck, AlertCircle, Clock, Facebook } from 'lucide-react';
import { motion } from 'motion/react';

export const SystemHealth = () => {
  const services = [
    { name: 'API Gateway', status: 'Operational', latency: '45ms', uptime: '99.99%', icon: <Zap className="text-emerald-500" /> },
    { name: 'Auth Service', status: 'Operational', latency: '12ms', uptime: '100%', icon: <ShieldCheck className="text-emerald-500" /> },
    { name: 'Supabase DB', status: 'Operational', latency: '82ms', uptime: '99.95%', icon: <Database className="text-emerald-500" /> },
    { name: 'AI Verification Engine', status: 'Degraded', latency: '1.2s', uptime: '98.4%', icon: <Cpu className="text-orange-500" /> },
    { name: 'CDN / Assets', status: 'Operational', latency: '8ms', uptime: '100%', icon: <Globe className="text-emerald-500" /> },
    { name: 'Facebook Auth', status: 'Pending Setup', latency: 'N/A', uptime: '0%', icon: <Facebook className="text-orange-500" /> },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="col-span-2 bg-white p-10 rounded-[48px] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-xl font-bold text-slate-900">Service Status</h3>
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-widest">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              All Systems Go
            </div>
          </div>

          <div className="space-y-4">
            {services.map((service, idx) => (
              <div key={idx} className="p-6 bg-slate-50/50 rounded-3xl border border-slate-100 flex items-center justify-between group hover:bg-white hover:shadow-lg transition-all">
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                    {service.icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{service.name}</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{service.status}</p>
                  </div>
                </div>
                <div className="flex items-center gap-12">
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Latency</p>
                    <p className={`text-sm font-black ${service.latency.includes('s') ? 'text-orange-500' : 'text-slate-900'}`}>{service.latency}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Uptime</p>
                    <p className="text-sm font-black text-slate-900">{service.uptime}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-[#0F172A] p-10 rounded-[48px] shadow-2xl relative overflow-hidden">
            <h3 className="text-xl font-bold text-white mb-8 relative z-10">System Load</h3>
            <div className="space-y-8 relative z-10">
              {[
                { label: 'CPU Usage', value: 42 },
                { label: 'Memory', value: 68 },
                { label: 'Disk I/O', value: 15 },
              ].map((metric, idx) => (
                <div key={idx}>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{metric.label}</span>
                    <span className="text-sm font-black text-white">{metric.value}%</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${metric.value}%` }}
                      className={`h-full rounded-full ${metric.value > 80 ? 'bg-red-500' : metric.value > 50 ? 'bg-orange-500' : 'bg-emerald-500'}`}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 blur-[80px] rounded-full -mr-20 -mt-20"></div>
          </div>

          <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <AlertCircle className="w-5 h-5 text-orange-500" />
              <h3 className="text-lg font-bold text-slate-900">Recent Incidents</h3>
            </div>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-1 h-10 bg-orange-500 rounded-full shrink-0" />
                <div>
                  <p className="text-xs font-bold text-slate-900">AI Verification Latency Spike</p>
                  <p className="text-[10px] text-slate-400 font-medium mt-1">Resolved • 2 hours ago</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-1 h-10 bg-emerald-500 rounded-full shrink-0" />
                <div>
                  <p className="text-xs font-bold text-slate-900">Database Maintenance</p>
                  <p className="text-[10px] text-slate-400 font-medium mt-1">Completed • 1 day ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
