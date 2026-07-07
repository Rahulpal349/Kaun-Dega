'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReceiptText, Users, History, User } from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();

  if (['/', '/login', '/signup'].includes(pathname)) {
    return null;
  }

  const navItems = [
    { name: 'Chits', href: '/dashboard', icon: ReceiptText, activeMatch: '/dashboard' },
    { name: 'Groups', href: '/groups', icon: Users, activeMatch: '/groups' },
    { name: 'History', href: '/history', icon: History, activeMatch: '/history' },
    { name: 'Profile', href: '/profile', icon: User, activeMatch: '/profile' },
  ];

  // We highlight the Groups tab if we are in /groups OR /groups/new OR /groups/[id]
  const isActive = (item) => {
    if (item.name === 'Groups' && pathname?.startsWith('/groups')) return true;
    if (item.name === 'Chits' && pathname === '/dashboard') return true;
    return pathname === item.activeMatch;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-offwhite border-t border-ink/10 flex justify-around items-center h-20 px-2 sm:px-6 z-50 rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item);
        return (
          <Link
            key={item.name}
            href={item.href}
            className="flex flex-col items-center justify-center w-full h-full"
          >
            <div className={`p-1.5 rounded-lg transition-colors ${active ? 'bg-sage text-ink' : 'text-ink/60 hover:text-ink hover:bg-ink/5'}`}>
              <Icon size={24} strokeWidth={active ? 2.5 : 2} />
            </div>
            <span className={`text-[11px] mt-1 font-body ${active ? 'font-semibold text-ink' : 'font-medium text-ink/60'}`}>
              {item.name}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
