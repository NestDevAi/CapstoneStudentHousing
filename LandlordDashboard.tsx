import React, { useState } from 'react';
import { LandlordSidebar } from './LandlordSidebar';
import { LandlordHeader } from './LandlordHeader';
import { MyProperties } from './views/MyProperties';
import { BookingRequests } from './views/BookingRequests';
import { TenantScreening } from './views/TenantScreening';
import { Documents } from './views/Documents';
import { Analytics } from './views/Analytics';
import { Calendar } from './views/Calendar';
import { Messages } from '../shared/Messages';
import { Profile } from '../shared/Profile';
import { FeedbackForm } from '../shared/FeedbackForm';
import { Verification } from './views/Verification';
import { ShieldCheck } from 'lucide-react';

export const LandlordDashboard = ({ onLogout, user }: { onLogout: () => void; user: any }) => {
  const [activeTab, setActiveTab] = useState('properties');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const requireVerification = () => setActiveTab('verification');

  const renderContent = () => {
    switch (activeTab) {
      case 'properties': return <MyProperties user={user} onRequireVerification={requireVerification} />;
      case 'requests': return <BookingRequests user={user} onNavigate={setActiveTab} />;
      case 'screening': return <TenantScreening user={user} />;
      case 'documents': return <Documents user={user} />;
      case 'verification': return <Verification user={user} />;
      case 'analytics': return <Analytics user={user} />;
      case 'calendar': return <Calendar />;
      case 'feedback': return <FeedbackForm user={user} />;
      case 'messages': return <Messages user={user} />;
      case 'profile': return <Profile user={user} />;
      default: return <MyProperties user={user} onRequireVerification={requireVerification} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <LandlordSidebar 
        activeTab={activeTab} 
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setIsSidebarOpen(false);
        }} 
        onLogout={onLogout} 
        user={user}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      
      <main className="flex-1 lg:ml-72 w-full">
        <LandlordHeader 
          activeTab={activeTab} 
          setActiveTab={setActiveTab}
          user={user} 
          onMenuClick={() => setIsSidebarOpen(true)}
        />
        <div className="p-4 md:p-10 max-w-7xl mx-auto">
          {!user?.is_verified && activeTab !== 'verification' && (
            <div className="mb-8 bg-orange-50 border border-orange-100 p-4 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Account Verification Required</p>
                  <p className="text-xs text-slate-500">To list properties and accept bookings, you must verify your identity and property ownership.</p>
                </div>
              </div>
              <button 
                onClick={() => setActiveTab('verification')}
                className="px-4 py-2 bg-orange-500 text-white text-xs font-bold rounded-lg hover:bg-orange-600 transition-all"
              >
                Verify Now
              </button>
            </div>
          )}
          {renderContent()}
        </div>
      </main>
    </div>
  );
};
