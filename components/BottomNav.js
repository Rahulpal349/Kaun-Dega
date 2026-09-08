'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, Activity, User } from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();

  if (
    ['/', '/login', '/signup', '/forgot-password', '/reset-password'].includes(pathname) ||
    pathname?.startsWith('/groups/') ||
    pathname?.startsWith('/join/')
  ) {
    return null;
  }

  const navItems = [
    { name: 'Ledgers', href: '/dashboard', icon: LayoutGrid, activeMatch: '/dashboard' },
    { name: 'Activity', href: '/history', icon: Activity, activeMatch: '/history' },
    { name: 'Profile', href: '/profile', icon: User, activeMatch: '/profile' },
  ];

  const getActiveIndex = () => {
    if (pathname === '/history') return 1;
    if (pathname === '/profile') return 2;
    return 0; // Default to Ledgers
  };

  const activeIndex = getActiveIndex();

  return (
    <div className="md:hidden fixed bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm bg-white/95 backdrop-blur-xl border border-[#E2EFE9] rounded-[28px] p-1.5 z-50 shadow-[0_10px_35px_rgba(20,92,75,0.15)] transition-all">
      <div className="relative inline-grid grid-cols-3 w-full">
        {/* Sliding Active Pill Background */}
        <div
          className="absolute top-0 bottom-0 rounded-[22px] bg-[#145C4B]/10 shadow-xs transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{
            width: '33.333%',
            left: `${activeIndex * 33.333}%`,
          }}
        />

        {navItems.map((item, index) => {
          const Icon = item.icon;
          const active = activeIndex === index;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`relative z-10 flex flex-col items-center justify-center py-2 px-3 rounded-[22px] transition-colors duration-200 ${
                active
                  ? 'text-[#145C4B] font-black'
                  : 'text-gray-400 hover:text-gray-700 font-medium'
              }`}
            >
              <Icon
                className={`w-5 h-5 transition-transform duration-300 ${
                  active ? 'stroke-[2.5] scale-110 text-[#145C4B]' : 'stroke-[1.8]'
                }`}
              />
              <span className={`text-[11px] mt-1 tracking-tight transition-all duration-300 ${
                active ? 'font-black text-[#145C4B]' : 'font-semibold text-gray-400'
              }`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}


