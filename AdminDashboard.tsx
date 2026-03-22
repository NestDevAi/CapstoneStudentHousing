import React, { useState } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { AdminView } from '../../types';
// import { motion, AnimatePresence } from 'motion/react';
const motion = {
  div: ({ children, className, ...props }: any) => <div className={className} {...props}>{children}</div>,
};
const AnimatePresence = ({ children }: any) => <>{children}</>;

// Import views
import { Overview } from './views/Overview';
import { FraudDetection } from './views/FraudDetection';
import { UserManagement } from './views/UserManagement';
import { AdminDocumentReview } from './views/AdminDocumentReview';
import { SupportTickets } from './views/SupportTickets';
import { ReportedListings } from './views/ReportedListings';
import { Broadcast } from './views/Broadcast';
import { AuditLogs } from './views/AuditLogs';
import { PropertyManagement } from './views/PropertyManagement';
import { FeedbackManagement } from './views/FeedbackManagement';
import { Profile } from '../shared/Profile';

interface AdminDashboardProps {
  onLogout: () => void;
  user: any;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout, user }) => {
  const [activeView, setActiveView] = useState<AdminView>('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const renderView = () => {
    switch (activeView) {
      case 'overview': return <Overview />;
      case 'fraud-detection': return <FraudDetection />;
      case 'user-management': return <UserManagement />;
      case 'verification-queue': return <AdminDocumentReview />;
      case 'support-tickets': return <SupportTickets />;
      case 'reported-listings': return <ReportedListings />;
      case 'property-management': return <PropertyManagement />;
      case 'broadcast': return <Broadcast />;
      case 'audit-logs': return <AuditLogs />;
      case 'feedback': return <FeedbackManagement />;
      case 'profile': return <Profile user={user} />;
      default: return <Overview />;
    }
  };

  const getViewTitle = () => {
    switch (activeView) {
      case 'overview': return 'Admin Dashboard';
      case 'fraud-detection': return 'Fraud Detection';
      case 'user-management': return 'User Management';
      case 'verification-queue': return 'Document Verification';
      case 'support-tickets': return 'Support Tickets';
      case 'reported-listings': return 'Property Reports';
      case 'property-management': return 'Property Management';
      case 'broadcast': return 'Broadcast Center';
      case 'audit-logs': return 'Audit Logs';
      case 'feedback': return 'User Feedback';
      case 'profile': return 'My Profile';
      default: return 'Admin Dashboard';
    }
  };

  const getViewSubtitle = () => {
    switch (activeView) {
      case 'overview': return 'Monitor and manage your platform security';
      case 'fraud-detection': return 'Analyze and respond to suspicious activities';
      case 'user-management': return 'Manage students, landlords, and platform access';
      case 'verification-queue': return 'Review and approve user documents';
      case 'support-tickets': return 'Resolve user inquiries and technical issues';
      case 'reported-listings': return 'Investigate and take action on reported property listings';
      case 'property-management': return 'Monitor and manage all property listings on the platform';
      case 'broadcast': return 'Send platform-wide announcements and alerts';
      case 'audit-logs': return 'Track all administrative and system actions';
      case 'feedback': return 'Review and respond to user suggestions and issue reports';
      case 'profile': return 'View and manage your personal information';
      default: return 'Monitor and manage your platform security';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <AdminSidebar 
        activeView={activeView} 
        setActiveView={(view) => {
          setActiveView(view);
          setIsSidebarOpen(false);
        }} 
        onLogout={onLogout} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      
      <main className="flex-1 lg:ml-72 min-h-screen flex flex-col w-full">
        <AdminHeader 
          title={getViewTitle()} 
          subtitle={getViewSubtitle()} 
          user={user}
          setActiveView={setActiveView}
          onMenuClick={() => setIsSidebarOpen(true)}
        />

        <div className="p-4 md:p-10 max-w-7xl mx-auto w-full flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};
