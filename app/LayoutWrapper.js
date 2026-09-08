'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import BottomNav from '../components/BottomNav';
import DesktopSidebar from '../components/DesktopSidebar';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

const PUBLIC_PATHS = ['/', '/login', '/signup', '/forgot-password', '/reset-password', '/privacy', '/terms'];

export default function LayoutWrapper({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  
  // Marketing pages should be full width responsive
  const isMarketing = ['/', '/privacy', '/terms'].includes(pathname);
  const isAuth = ['/login', '/signup', '/forgot-password', '/reset-password'].includes(pathname);

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
    return (
      <div className="w-full min-h-screen bg-[#F4FBF7] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#145C4B]/20 border-t-[#145C4B] rounded-full animate-spin" />
      </div>
    );
  }

  if (isMarketing || isAuth) {
    return (
      <div className="w-full min-h-screen bg-[#F4FBF7] relative flex flex-col overflow-x-hidden selection:bg-[#145C4B]/20 selection:text-[#145C4B]">
        {children}
      </div>
    );
  }

  // App pages: Responsive Desktop & Mobile layout
  return (
    <div className="w-full min-h-screen bg-[#F4FBF7] flex flex-col md:flex-row relative">
      <DesktopSidebar />
      <main className="flex-1 min-w-0 min-h-screen pb-24 md:pb-8 flex flex-col">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}

