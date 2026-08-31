'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, History, User } from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();

  if (['/', '/login', '/signup'].includes(pathname)) {
    return null;
  }

  const navItems = [
    { name: 'Home', href: '/dashboard', icon: Home, activeMatch: '/dashboard' },
    { name: 'Groups', href: '/groups', icon: Users, activeMatch: '/groups' },
    { name: 'Activity', href: '/history', icon: History, activeMatch: '/history' },
    { name: 'Profile', href: '/profile', icon: User, activeMatch: '/profile' },
  ];

  const isActive = (item) => {
    if (item.name === 'Groups' && pathname?.startsWith('/groups')) return true;
    if (item.name === 'Home' && pathname === '/dashboard') return true;
    return pathname === item.activeMatch;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around items-center h-20 px-4 sm:px-8 z-50 rounded-t-3xl shadow-[0_-4px_24px_rgba(0,0,0,0.02)]">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item);
        return (
          <Link
            key={item.name}
            href={item.href}
            className="flex flex-col items-center justify-center w-full h-full"
          >
            <div className={`px-5 py-1.5 rounded-full transition-colors ${active ? 'bg-soft-green text-primary' : 'text-gray-400 hover:text-gray-600'}`}>
              <Icon size={24} strokeWidth={active ? 2.5 : 2} />
            </div>
            <span className={`text-[11px] mt-1.5 font-medium ${active ? 'text-gray-800 font-semibold' : 'text-gray-500'}`}>
              {item.name}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
