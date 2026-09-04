'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import BottomNav from '../components/BottomNav';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

const PUBLIC_PATHS = ['/', '/login', '/signup', '/forgot-password', '/reset-password', '/privacy', '/terms'];

export default function LayoutWrapper({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  
  // Marketing pages should be full width responsive
  const isMarketing = ['/', '/privacy', '/terms'].includes(pathname);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const isPublic = PUBLIC_PATHS.includes(pathname) || pathname?.startsWith('/join/');
      if (!user && !isPublic) {
        router.replace('/login');
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [pathname, router]);

  if (loading) {
    return <div className="w-full min-h-screen bg-green-50" />;
  }

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
