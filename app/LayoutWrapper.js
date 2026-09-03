'use client';

import { usePathname } from 'next/navigation';
import BottomNav from '../components/BottomNav';

export default function LayoutWrapper({ children }) {
  const pathname = usePathname();
  
  // Marketing pages should be full width responsive
  const isMarketing = ['/', '/privacy', '/terms'].includes(pathname);

  if (isMarketing) {
    return (
      <div className="w-full min-h-screen bg-green-50 relative flex flex-col overflow-x-hidden">
        {children}
      </div>
    );
  }

  // App pages are constrained to mobile view
  return (
    <div className="w-full max-w-md min-h-screen bg-green-50 relative shadow-2xl shadow-gray-400/20 flex flex-col overflow-x-hidden">
      {children}
      <BottomNav />
    </div>
  );
}
