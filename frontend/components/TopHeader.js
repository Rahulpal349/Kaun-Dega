'use client';

import Link from 'next/link';
import { History, Bell, User } from 'lucide-react';

export default function TopHeader({ title = 'Kaun Dega?', showNav = false }) {
  return (
    <header className="w-full h-20 px-6 flex items-center justify-between">
      <div className="flex items-center gap-8">
        <Link href="/">
          <h1 className="font-display font-bold text-xl text-ink tracking-tight">{title}</h1>
        </Link>
        {showNav && (
          <nav className="hidden md:flex items-center gap-6 text-sm font-body font-medium text-ink/70">
            <Link href="/dashboard" className="hover:text-ink">Chits</Link>
            <Link href="/groups" className="hover:text-ink">Groups</Link>
            <Link href="/history" className="hover:text-ink">History</Link>
          </nav>
        )}
      </div>

      <div className="flex items-center gap-4 text-ink">
        <button className="p-2 hover:bg-ink/5 rounded-full transition-colors hidden sm:block">
          <History size={20} strokeWidth={2} />
        </button>
        <button className="p-2 hover:bg-ink/5 rounded-full transition-colors hidden sm:block">
          <Bell size={20} strokeWidth={2} />
        </button>
        <button className="p-1 hover:bg-ink/5 rounded-full transition-colors border border-ink/10 overflow-hidden bg-ink/5">
          <User size={24} strokeWidth={1.5} className="text-ink/60" />
        </button>
      </div>
    </header>
  );
}
