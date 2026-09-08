'use client';

import Link from 'next/link';
import { Wallet, LogOut, Plus, User } from 'lucide-react';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';

export default function TopHeader({ title = 'Kaun Dega?', userName, onOpenNewGroup, onOpenJoinGroup }) {
  const handleSignOut = async () => {
    if (confirm('Are you sure you want to sign out?')) {
      await signOut(auth);
    }
  };

  const displayName = userName
    ? userName.includes('@')
      ? userName.split('@')[0]
      : userName.split(' ')[0]
    : 'Friend';

  return (
    <header className="w-full bg-[#F4FBF7]/90 backdrop-blur-md border-b border-[#E2EFE9] sticky top-0 z-20 px-4 sm:px-8 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {/* Mobile Brand Link */}
        <Link href="/dashboard" className="flex items-center gap-2.5 md:hidden">
          <div className="w-10 h-10 rounded-full bg-white border border-[#E2EFE9] flex items-center justify-center shadow-sm">
            <Wallet className="w-5 h-5 text-[#145C4B]" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg text-gray-900 tracking-tight leading-none">
              {title}
            </h1>
            <p className="text-xs font-semibold text-gray-500 mt-0.5">
              Hi, {displayName} 👋
            </p>
          </div>
        </Link>

        {/* Desktop Page Title (No duplicate logo) */}
        <div className="hidden md:flex flex-col">
          <h1 className="font-extrabold text-xl text-gray-900 tracking-tight leading-none">
            {title === 'Kaun Dega?' ? 'Dashboard' : title}
          </h1>
          <p className="text-xs font-semibold text-gray-500 mt-1">
            Welcome back, {displayName} 👋
          </p>
        </div>
      </div>

      <div className="hidden md:flex items-center gap-2 sm:gap-3">
        {onOpenJoinGroup && (
          <button
            onClick={onOpenJoinGroup}
            className="px-3.5 py-2 rounded-2xl bg-white border border-[#E2EFE9] text-xs font-bold text-[#145C4B] hover:bg-[#F0F7F4] transition-all flex items-center gap-1.5"
          >
            Join Group
          </button>
        )}
        {onOpenNewGroup && (
          <button
            onClick={onOpenNewGroup}
            className="px-4 py-2 rounded-2xl bg-[#145C4B] text-white text-xs font-bold hover:bg-[#0E382F] transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Group</span>
          </button>
        )}

        <button
          onClick={handleSignOut}
          title="Sign Out"
          className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-colors"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}

