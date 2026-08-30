'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../../archive/deprecated-utils/supabaseClient';
import { api } from '../../../archive/deprecated-utils/api';
import ExpenseForm from '../../../components/ExpenseForm';
import BalanceBoard from '../../../components/BalanceBoard';
import { ArrowLeft, User, Share2 } from 'lucide-react';

export default function GroupDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [userId, setUserId] = useState(null);
  const [members, setMembers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [balanceData, setBalanceData] = useState({ balances: [], moves: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [group, setGroup] = useState(null);
  const [sharing, setSharing] = useState(false);

  async function shareOnWhatsapp() {
    setSharing(true);
    try {
      const { text } = await api.getWhatsappText(id);
      const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank');
    } catch (err) {
      alert(err.message);
    } finally {
      setSharing(false);
    }
  }

  const loadAll = useCallback(async () => {
    try {
      // In a real app, we'd also fetch the group details for the name
      // Here we just fetch members, expenses, balances
      const [membersData, expensesData, balances, groupsData] = await Promise.all([
        api.getMembers(id),
        api.getExpenses(id),
        api.getBalances(id),
        api.getGroups(),
      ]);
      setMembers(membersData);
      setExpenses(expensesData);
      setBalanceData(balances);
      const currentGroup = groupsData.find(g => g.id === id);
      setGroup(currentGroup);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      setUserId(session.user.id);
      await loadAll();
    })();
  }, [loadAll, router]);

  if (loading) {
    return <main className="min-h-screen bg-ruled flex items-center justify-center text-ink/50">Loading the ledger…</main>;
  }

  return (
    <main className="min-h-screen bg-ruled flex flex-col pb-32">
      {/* Header */}
      <header className="w-full h-20 px-4 sm:px-6 flex items-center justify-between border-b border-ink/10 bg-offwhite/90 backdrop-blur-sm sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/dashboard')} className="p-2 hover:bg-ink/5 rounded-full transition-colors">
            <ArrowLeft size={20} strokeWidth={2.5} className="text-ink" />
          </button>
          <h1 className="font-display font-bold text-xl text-ink tracking-tight flex items-center gap-2">
            <span className="opacity-80 text-2xl">{group?.emoji || '🧾'}</span>
            {group?.name || 'Group'}
          </h1>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 text-ink">
          <button 
            onClick={shareOnWhatsapp} 
            disabled={sharing}
            className="flex items-center gap-2 p-2 sm:px-3 sm:py-1.5 hover:bg-ink/5 rounded-md sm:rounded-md transition-colors text-xs font-mono font-bold uppercase tracking-wider text-teal border border-teal/20 sm:border-teal/20 border-transparent bg-teal/5 sm:bg-transparent disabled:opacity-60"
          >
            <Share2 size={16} className="sm:w-[14px] sm:h-[14px]" /> 
            <span className="hidden sm:inline">{sharing ? 'Preparing...' : 'Share to WhatsApp'}</span>
          </button>
          <Link href="/profile" className="p-1 hover:bg-ink/5 rounded-full transition-colors border border-ink/10 overflow-hidden bg-ink/5 flex items-center justify-center">
            <User size={24} strokeWidth={1.5} className="text-ink/60" />
          </Link>
        </div>
      </header>

      <div className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-8">
        {error && <p className="text-chili text-sm mb-4">{error}</p>}

        <h3 className="font-mono text-xs uppercase tracking-widest font-semibold text-ink/50 mb-4 ml-2">Group Balances</h3>
        <div id="balance-board" className="mb-10 shadow-[0_4px_20px_rgba(11,43,38,0.08)] scroll-mt-24">
          <BalanceBoard
            groupId={id}
            balances={balanceData.balances}
            moves={balanceData.moves}
            currentUserId={userId}
            onSettled={loadAll}
          />
        </div>

        <div className="mb-10">
          <ExpenseForm groupId={id} members={members} currentUserId={userId} onAdded={loadAll} />
        </div>

        <div>
          <h3 className="font-mono text-xs uppercase tracking-widest font-semibold text-ink/50 mb-4 ml-2">Recent Chits</h3>
          {expenses.length === 0 ? (
            <p className="text-ink/50 text-sm ml-2">No expenses logged yet.</p>
          ) : (
            <div className="space-y-4">
              {expenses.map((e) => (
                <div key={e.id} className="chit rounded-sm px-5 py-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-display text-lg font-medium text-ink leading-tight">{e.description}</p>
                      <p className="text-xs text-ink/60 font-body mt-1">
                        paid by <span className="font-medium text-ink/80">{e.payer?.name || 'someone'}</span> · {e.split_type === 'equal' ? 'split evenly' : 'custom split'}
                      </p>
                    </div>
                    <span className="font-mono font-bold text-lg text-ink">₹{Number(e.amount).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Fixed Banner (Net Balance) */}
      <div className="fixed bottom-20 left-0 right-0 max-w-3xl mx-auto px-4 sm:px-6 pointer-events-none z-30">
        <div className="bg-sage text-ink shadow-[0_-8px_30px_rgba(163,228,215,0.4)] border-t-2 border-x-2 border-ink p-4 sm:p-5 rounded-t-xl flex justify-between items-center pointer-events-auto">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest mb-1 opacity-70">Your Net Balance</p>
            <p className="font-mono font-bold text-2xl">₹0.00</p>
          </div>
          <button 
            onClick={() => document.getElementById('balance-board')?.scrollIntoView({ behavior: 'smooth' })}
            className="bg-ink text-paper font-mono text-xs sm:text-sm font-bold uppercase tracking-widest px-4 sm:px-6 py-3 rounded-lg hover:bg-ink/90 transition-colors shadow-[2px_2px_0px_rgba(11,43,38,0.2)] active:translate-y-[1px] active:translate-x-[1px] active:shadow-none"
          >
            Settle Up
          </button>
        </div>
      </div>
    </main>
  );
}
