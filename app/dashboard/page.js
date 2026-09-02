'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../archive/deprecated-utils/supabaseClient';
import { api } from '../../archive/deprecated-utils/api';
import { Plus, Trash2, User, Users, ChevronRight, Wallet, LogOut } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [groups, setGroups] = useState(null);
  const [error, setError] = useState('');
  const [consolidatedBalance, setConsolidatedBalance] = useState(0);
  const [netBalanceLoading, setNetBalanceLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      try {
        const fetchedGroups = await api.getGroups();
        setGroups(fetchedGroups);
        
        let total = 0;
        await Promise.all(fetchedGroups.map(async (g) => {
          try {
            const balanceData = await api.getBalances(g.id);
            const myBal = balanceData.balances.find(b => b.id === session.user.id);
            if (myBal) {
              total += (myBal.amount || 0);
            }
          } catch (e) {
            console.error('Error fetching balance for group', g.id, e);
          }
        }));
        setConsolidatedBalance(total);
      } catch (err) {
        setError(err.message);
      } finally {
        setNetBalanceLoading(false);
      }
    })();
  }, [router]);

  return (
    <main className="min-h-screen bg-green-50 flex flex-col">
      {/* SaaS Style Header */}
      <header className="w-full bg-green-50/80 backdrop-blur-md border-b border-green-100/50 sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-ink leading-tight">
            Dashboard
          </h1>
          <p className="text-sm text-ink/50 mt-0.5 font-medium">
            Your active ledgers
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={async () => {
              if (confirm('Sign out of Kaun Dega?')) {
                await api.logout();
                router.push('/login');
              }
            }}
            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200 hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-colors text-ink/40"
            title="Sign Out"
          >
            <LogOut size={18} />
          </button>
          <Link href="/profile" className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200 hover:bg-gray-200 transition-colors">
            <User size={20} className="text-ink/60" />
          </Link>
        </div>
      </header>

      <div className="flex-1 flex flex-col w-full max-w-3xl mx-auto px-6 py-8 pb-32">
        {/* Consolidated Net Balance Card */}
        <div className="bg-ink text-white rounded-2xl p-6 shadow-lg mb-8 relative overflow-hidden">
          {/* Background pattern */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
          
          <div className="flex items-center gap-3 mb-1 opacity-80">
            <Wallet size={18} />
            <p className="font-medium text-sm tracking-wide">Consolidated Net Balance</p>
          </div>
          <div className="flex items-end justify-between relative z-10">
            {netBalanceLoading ? (
              <h2 className="font-display font-bold text-4xl mt-2 tracking-tight text-white/50">...</h2>
            ) : (
              <h2 className="font-display font-bold text-4xl mt-2 tracking-tight">
                {consolidatedBalance > 0 ? '+' : ''}₹{Math.abs(consolidatedBalance).toFixed(2)}
              </h2>
            )}
            <p className="text-sm font-medium text-white/60 mb-1">
              {consolidatedBalance >= 0 ? 'You are owed' : 'You owe'}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display font-bold text-xl text-ink">Your Groups</h3>
          <Link href="/groups/new" className="text-primary font-semibold text-sm flex items-center gap-1 hover:text-primary/80 transition-colors">
            <Plus size={16} /> New Group
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm font-medium mb-6">
            {error}
          </div>
        )}

        {groups === null ? (
          <div className="flex flex-col items-center justify-center py-20 text-ink/40">
            <div className="w-8 h-8 border-4 border-ink/20 border-t-primary rounded-full animate-spin mb-4"></div>
            <p className="font-medium text-sm">Loading ledgers...</p>
          </div>
        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center bg-white border border-gray-100 rounded-2xl p-12 text-center shadow-sm">
            <div className="w-16 h-16 bg-soft-green text-primary rounded-full flex items-center justify-center mb-4">
              <Users size={32} />
            </div>
            <h3 className="font-display font-bold text-xl text-ink mb-2">No ledgers yet</h3>
            <p className="text-ink/60 mb-6 max-w-xs text-sm">
              Create a group to start splitting expenses with friends, family, or flatmates.
            </p>
            <Link href="/groups/new" className="bg-primary text-white font-semibold px-6 py-2.5 rounded-full hover:bg-primary/90 transition-colors shadow-sm inline-flex items-center gap-2">
              <Plus size={18} /> Create Group
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {groups.map((g) => (
              <Link key={g.id} href={`/groups/${g.id}`} className="block group">
                <div className="bg-white border border-gray-100 rounded-2xl p-5 flex items-center justify-between shadow-sm hover:shadow-md hover:border-gray-200 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-green-50 border border-gray-100 flex items-center justify-center text-2xl shadow-sm">
                      {g.emoji}
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-lg text-ink group-hover:text-primary transition-colors">
                        {g.name}
                      </h4>
                      <p className="text-xs text-ink/50 font-medium flex items-center gap-1 mt-0.5">
                        <Users size={12} /> Tap to view details
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={async (e) => {
                        e.preventDefault();
                        if (confirm('Remove this ledger from your dashboard?')) {
                          try {
                            await api.deleteGroup(g.id);
                            setGroups(groups.filter(group => group.id !== g.id));
                          } catch (err) {
                            alert('Failed to delete: ' + err.message);
                          }
                        }
                      }}
                      className="w-10 h-10 rounded-full hover:bg-red-50 flex items-center justify-center text-gray-300 hover:text-red-500 transition-colors z-10"
                      title="Delete Group"
                    >
                      <Trash2 size={18} />
                    </button>
                    <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-gray-400 group-hover:bg-soft-green group-hover:text-primary transition-colors">
                      <ChevronRight size={18} />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button for mobile */}
      <div className="fixed max-w-md w-full bottom-24 z-40 md:hidden flex justify-end px-6 left-1/2 -translate-x-1/2 pointer-events-none">
        <Link href="/groups/new" className="pointer-events-auto w-14 h-14 bg-primary text-white rounded-full shadow-lg shadow-primary/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-all">
          <Plus size={24} strokeWidth={2.5} />
        </Link>
      </div>
    </main>
  );
}

