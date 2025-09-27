import React from 'react';
import Sidebar from './Sidebar';
import DashboardTour from './DashboardTour';
import MarketMarquee from './MarketMarquee';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <DashboardTour>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <div className="ml-64">
          {/* Global Market Marquee - News Channel Style */}
          <MarketMarquee height="100px" />
          {children}
        </div>
      </div>
    </DashboardTour>
  );
};

export default DashboardLayout; 