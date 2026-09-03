'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth } from '../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { api } from '../../lib/firebaseApi';
import GroupIcon from '../../components/GroupIcon';
import { GroupCardSkeleton } from '../../components/Skeleton';
import { Plus, User, Users, ChevronRight, LogOut, Trash2 } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [groups, setGroups] = useState(null);
  const [error, setError] = useState('');
  const [consolidatedBalance, setConsolidatedBalance] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [netBalanceLoading, setNetBalanceLoading] = useState(true);

  async function handleDeleteGroup(group) {
    if (group.myRole === 'admin') {
      if (!confirm(`Are you sure you want to delete "${group.name}"? This will permanently delete all expenses and balances.`)) return;
      try {
        await api.deleteGroup(group.id);
        const fetchedGroups = await api.getGroups();
        setGroups(fetchedGroups);
      } catch (err) {
        alert(err.message);
      }
    } else {
      if (!confirm(`Are you sure you want to leave "${group.name}"?`)) return;
      try {
        await api.leaveGroup(group.id);
        const fetchedGroups = await api.getGroups();
        setGroups(fetchedGroups);
      } catch (err) {
        alert(err.message);
      }
    }
  }

  useEffect(() => {
    let unsubscribeGroups = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }

      try {
        await api.ensureUserProfile(user);

        // Real-time Firestore groups listener
        unsubscribeGroups = api.subscribeGroups(async (fetchedGroups) => {
          setGroups(fetchedGroups);
          
          let total = 0;
          let spent = 0;
          await Promise.all(
            fetchedGroups.map(async (g) => {
              try {
                const balanceData = await api.getBalances(g.id);
                const myBal = balanceData.balances.find((b) => b.id === user.uid);
                if (myBal) {
                  total += (myBal.amount || 0);
                  spent += (myBal.charged || 0);
                }
              } catch (e) {
                console.error('Error fetching balance for group', g.id, e);
              }
            })
          );
          setConsolidatedBalance(total);
          setTotalSpent(spent);
          setNetBalanceLoading(false);
        });
      } catch (err) {
        setError(err.message || 'Failed to load dashboard');
        setGroups([]);
        setNetBalanceLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeGroups) unsubscribeGroups();
    };
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
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display font-bold text-xl text-ink">Your Groups</h3>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm font-medium mb-6">
            {error}
          </div>
        )}

        {groups === null ? (
          <GroupCardSkeleton count={3} />
        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center bg-white border border-gray-100 rounded-2xl p-12 text-center shadow-sm">
            <div className="w-16 h-16 bg-soft-green text-primary rounded-full flex items-center justify-center mb-4">
              <Users size={32} />
            </div>
            <h3 className="font-display font-bold text-xl text-ink mb-2">No ledgers yet</h3>
            <p className="text-ink/60 max-w-xs text-sm">
              Create a group to start splitting expenses with friends, family, or flatmates.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {groups.map((g) => (
              <Link key={g.id} href={`/groups/${g.id}`} className="block group">
                <div className="bg-white border border-gray-100 rounded-2xl p-5 flex items-center justify-between shadow-sm hover:shadow-md hover:border-gray-200 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-green-50 border border-gray-100 flex items-center justify-center shadow-sm">
                      <GroupIcon icon={g.icon || g.emoji} size={22} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-display font-bold text-lg text-ink group-hover:text-primary transition-colors">
                          {g.name}
                        </h4>
                        {g.myRole === 'admin' && (
                          <span className="text-[9px] font-bold uppercase tracking-widest bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">Admin</span>
                        )}
                      </div>
                      <p className="text-xs text-ink/50 font-medium flex items-center gap-1 mt-0.5">
                        <Users size={12} /> Tap to view details
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        await handleDeleteGroup(g);
                      }}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors z-10 relative"
                      title={g.myRole === 'admin' ? 'Delete Group' : 'Leave Group'}
                    >
                      {g.myRole === 'admin' ? <Trash2 size={16} /> : <LogOut size={16} />}
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

      {/* Floating Action Button */}
      <div className="fixed max-w-md w-full bottom-24 z-40 flex justify-end px-6 left-1/2 -translate-x-1/2 pointer-events-none">
        <Link href="/groups/new" className="pointer-events-auto w-14 h-14 bg-primary text-white rounded-full shadow-lg shadow-primary/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-all">
          <Plus size={24} strokeWidth={2.5} />
        </Link>
      </div>
    </main>
  );
}
