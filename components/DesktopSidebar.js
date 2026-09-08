'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, Activity, User, Plus, LogOut, Wallet } from 'lucide-react';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';

export default function DesktopSidebar({ onOpenNewGroup }) {
  const pathname = usePathname();

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

  const handleSignOut = async () => {
    if (confirm('Are you sure you want to sign out?')) {
      await signOut(auth);
    }
  };

  return (
    <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-white border-r border-[#E2EFE9] min-h-screen p-5 sticky top-0 h-screen justify-between z-30 shrink-0">
      <div className="flex flex-col gap-6">
        {/* Brand Header */}
        <Link href="/dashboard" className="flex items-center gap-3 px-2 py-1 group">
          <div className="w-10 h-10 rounded-2xl bg-[#145C4B] text-white flex items-center justify-center shadow-md shadow-[#145C4B]/20 group-hover:scale-105 transition-transform">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg text-gray-900 tracking-tight leading-none">Kaun Dega?</h1>
            <p className="text-xs text-gray-500 font-medium mt-1">Smart Ledger & Splits</p>
          </div>
        </Link>

        {/* Quick Action Button */}
        <div className="flex flex-col gap-2 pt-2">
          <Link
            href="/dashboard"
            onClick={(e) => {
              if (onOpenNewGroup) {
                e.preventDefault();
                onOpenNewGroup();
              }
            }}
            className="w-full bg-[#145C4B] hover:bg-[#0E382F] text-white font-bold text-sm py-3 px-4 rounded-2xl flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Group Ledger</span>
          </Link>
        </div>

        {/* Navigation Section */}
        <nav className="relative flex flex-col gap-1.5 pt-4">
          <span className="text-[11px] font-bold tracking-wider text-gray-400 uppercase px-3 mb-1">
            Menu
          </span>

          {/* Vertical Sliding Active Pill */}
          <div
            className="absolute left-0 right-0 h-11 rounded-2xl bg-[#145C4B]/10 shadow-xs transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
            style={{
              top: `calc(2.25rem + ${activeIndex * 50}px)`,
            }}
          />

          {navItems.map((item, index) => {
            const Icon = item.icon;
            const active = activeIndex === index;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`relative z-10 flex items-center justify-between px-3.5 py-3 rounded-2xl font-semibold text-sm transition-colors duration-200 ${
                  active
                    ? 'text-[#145C4B] font-extrabold'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 transition-transform duration-300 ${active ? 'text-[#145C4B] stroke-[2.5] scale-105' : 'text-gray-400'}`} />
                  <span>{item.name}</span>
                </div>
                {active && (
                  <div className="w-1.5 h-1.5 rounded-full bg-[#145C4B] shadow-sm animate-pulse" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / Account Section */}
      <div className="flex flex-col gap-3 pt-4 border-t border-[#E2EFE9]">
        <div className="bg-[#F4FBF7] rounded-2xl p-3.5 border border-[#E2EFE9] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#145C4B]/10 text-[#145C4B] flex items-center justify-center font-bold text-xs">
              KD
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-gray-900 line-clamp-1">My Account</span>
              <span className="text-[11px] text-gray-500 font-medium">Logged in</span>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            title="Sign Out"
            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
