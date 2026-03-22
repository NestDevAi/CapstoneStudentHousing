import React from 'react';
import { Shield, Home, Search, ShieldCheck, Star, ArrowRight, MapPin, Users } from 'lucide-react';
import { motion } from 'motion/react';

export const LandingPage = ({ onGetStarted }: { onGetStarted: (role: 'student' | 'landlord' | 'admin') => void }) => {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="h-24 px-10 flex items-center justify-between border-b border-slate-50 sticky top-0 bg-white/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-2">
          <div className="bg-orange-500 p-1.5 rounded-lg">
            <Shield className="w-6 h-6 text-white" fill="currentColor" />
          </div>
          <span className="text-2xl font-black text-slate-900 tracking-tighter">VerifiedStudentShousing</span>
        </div>
        
        <div className="hidden md:flex items-center gap-10">
          <a href="#" className="text-sm font-bold text-slate-600 hover:text-orange-500 transition-all">Browse</a>
          <a href="#" className="text-sm font-bold text-slate-600 hover:text-orange-500 transition-all">How it Works</a>
          <a href="#" className="text-sm font-bold text-slate-600 hover:text-orange-500 transition-all">For Landlords</a>
          <a href="#" className="text-sm font-bold text-slate-600 hover:text-orange-500 transition-all">Safety</a>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => onGetStarted('student')}
            className="px-6 py-3 text-sm font-bold text-slate-900 hover:text-orange-500 transition-all"
          >
            Login
          </button>
          <button 
            onClick={() => onGetStarted('student')}
            className="px-8 py-3 bg-[#0F172A] text-white rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10"
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-32 px-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 rounded-full mb-8">
              <ShieldCheck className="w-4 h-4 text-orange-500" />
              <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Baguio's #1 Verified Housing</span>
            </div>
            <h1 className="text-7xl font-black text-slate-900 leading-[1.1] tracking-tighter mb-8">
              Find your <span className="text-orange-500">Safe Haven</span> in the City of Pines.
            </h1>
            <p className="text-xl text-slate-500 font-medium leading-relaxed mb-12 max-w-xl">
              The first AI-powered student housing platform in Baguio. Every listing is verified, every landlord is screened, and every stay is protected.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => onGetStarted('student')}
                className="px-10 py-5 bg-orange-500 text-white rounded-[24px] font-bold text-lg hover:bg-orange-600 transition-all shadow-2xl shadow-orange-500/30 flex items-center justify-center gap-3"
              >
                Find a Room <ArrowRight className="w-6 h-6" />
              </button>
              <button 
                onClick={() => onGetStarted('landlord')}
                className="px-10 py-5 border-2 border-slate-100 text-slate-900 rounded-[24px] font-bold text-lg hover:bg-slate-50 transition-all flex items-center justify-center gap-3"
              >
                List Property
              </button>
            </div>

            <div className="mt-16 flex items-center gap-10">
              <div>
                <p className="text-3xl font-black text-slate-900">2.8K+</p>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Students</p>
              </div>
              <div className="w-px h-10 bg-slate-100" />
              <div>
                <p className="text-3xl font-black text-slate-900">430+</p>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Verified Rooms</p>
              </div>
              <div className="w-px h-10 bg-slate-100" />
              <div>
                <p className="text-3xl font-black text-slate-900">4.9/5</p>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">User Rating</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="aspect-[4/5] rounded-[60px] overflow-hidden shadow-2xl">
              <img 
                src="https://images.unsplash.com/photo-1555854811-80e3244a441a?auto=format&fit=crop&q=80&w=1000" 
                alt="Baguio Student Housing"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            
            {/* Floating Cards */}
            <div className="absolute -left-10 top-20 bg-white p-6 rounded-3xl shadow-2xl border border-slate-50 flex items-center gap-4 animate-bounce-slow">
              <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-black text-slate-900">Verified Listing</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase">AI Scanned & Approved</p>
              </div>
            </div>

            <div className="absolute -right-10 bottom-20 bg-[#0F172A] p-8 rounded-[40px] shadow-2xl border border-white/10">
              <div className="flex items-center gap-2 mb-4">
                {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-3 h-3 text-orange-400 fill-current" />)}
              </div>
              <p className="text-white text-sm font-medium italic mb-4">"Found the perfect studio near SLU in just 2 days. The verification gave me peace of mind!"</p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-[10px] font-bold text-white">MS</div>
                <p className="text-xs font-bold text-white">Maria Santos</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-32 bg-slate-50 px-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-black text-slate-900 tracking-tighter mb-6">Built for the Baguio Student.</h2>
            <p className="text-lg text-slate-500 font-medium max-w-2xl mx-auto">We've reimagined the housing search process to make it safer, faster, and more transparent.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: 'AI Verification', desc: 'Our AI scans property photos and documents to detect potential fraud before you even see the listing.', icon: <Shield className="text-orange-500" /> },
              { title: 'Student-Only', desc: 'Exclusive access for students from SLU, UB, UC, UP, and BSU. Build a community with your peers.', icon: <Users className="text-blue-500" /> },
              { title: 'Direct Chat', desc: 'Communicate directly with verified landlords through our secure messaging system.', icon: <Search className="text-emerald-500" /> },
            ].map((feature, idx) => (
              <div key={idx} className="bg-white p-12 rounded-[48px] border border-slate-100 hover:shadow-xl transition-all group">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">{feature.title}</h3>
                <p className="text-slate-500 font-medium leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Admin Access (Hidden/Small) */}
      <footer className="py-10 px-10 border-t border-slate-100 flex justify-between items-center">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">© 2025 VerifiedStudentShousing. All rights reserved.</p>
        <button 
          onClick={() => onGetStarted('admin')}
          className="text-[10px] font-bold text-slate-300 hover:text-slate-900 transition-all uppercase tracking-widest"
        >
          Admin Access
        </button>
      </footer>
    </div>
  );
};
