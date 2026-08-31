'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../../archive/deprecated-utils/supabaseClient';
import { api } from '../../../archive/deprecated-utils/api';
import ExpenseForm from '../../../components/ExpenseForm';
import BalanceBoard from '../../../components/BalanceBoard';
import BottomNav from '../../../components/BottomNav';
import { ArrowLeft, User, Share2, Users, MoreVertical, Coffee, Wallet } from 'lucide-react';

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
    return <main className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">Loading...</main>;
  }

  // Calculate Net Balance
  let netBalanceStr = '0.00';
  if (userId && balanceData.balances) {
    const myBal = balanceData.balances.find(b => b.user_id === userId || b.userId === userId);
    if (myBal) {
      const amt = myBal.net_balance || myBal.netBalance || 0;
      netBalanceStr = (amt > 0 ? '+' : '') + amt.toFixed(2);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col pb-32 font-body">
      {/* Header */}
      <header className="w-full h-20 px-4 sm:px-8 flex items-center justify-between border-b border-gray-200 bg-white sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/dashboard')} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-700">
            <ArrowLeft size={20} strokeWidth={2.5} />
          </button>
          <div className="flex items-center gap-2">
            <Users size={28} className="text-primary hidden sm:block" />
            <h1 className="font-display font-bold text-xl tracking-tight text-gray-900 flex items-center gap-2">
              <span className="text-ink hidden sm:inline">Kaun</span>
              <span className="text-primary hidden sm:inline">Dega</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <button 
            onClick={shareOnWhatsapp} 
            disabled={sharing}
            className="flex items-center gap-2 px-4 py-2 hover:bg-soft-green rounded-full transition-colors text-sm font-semibold text-primary border border-primary/30 disabled:opacity-60"
          >
            <Share2 size={16} /> 
            <span className="hidden sm:inline">{sharing ? 'Preparing...' : 'Share to WhatsApp'}</span>
          </button>
          <Link href="/profile" className="p-2 hover:bg-gray-100 rounded-full transition-colors border border-gray-200 bg-gray-50 flex items-center justify-center text-gray-500">
            <User size={20} />
          </Link>
        </div>
      </header>

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {error && <p className="text-red-500 text-sm font-medium mb-4">{error}</p>}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column: Net Balance & Add a Chit */}
          <div className="lg:col-span-5 lg:sticky lg:top-28 flex flex-col gap-6">
            
            {/* Net Balance (Dark Green SaaS style) */}
            <div className="bg-[#145C4B] text-white p-6 rounded-xl flex justify-between items-center relative overflow-hidden shadow-md">
              <div className="relative z-10">
                <p className="text-xs font-bold uppercase tracking-widest mb-1 text-white/70">Your Next Balance</p>
                <p className="font-mono font-bold text-3xl">₹{netBalanceStr}</p>
              </div>
              <button 
                onClick={() => document.getElementById('balance-board')?.scrollIntoView({ behavior: 'smooth' })}
                className="relative z-10 bg-white text-[#145C4B] text-xs font-bold uppercase tracking-widest px-5 py-2.5 rounded-full hover:bg-gray-50 transition-colors shadow-sm"
              >
                Settle Up &gt;
              </button>
              {/* Decorative Wallet Icon Background */}
              <Wallet size={120} className="absolute -right-6 -bottom-6 text-white/5 rotate-[-15deg] pointer-events-none" />
            </div>

            <ExpenseForm groupId={id} members={members} currentUserId={userId} onAdded={loadAll} />
          </div>

          {/* Right Column: Balances and Chits */}
          <div className="lg:col-span-7 flex flex-col gap-8">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3 ml-1">Group Balances</h3>
              <div id="balance-board" className="scroll-mt-24">
                <BalanceBoard
                  groupId={id}
                  balances={balanceData.balances}
                  moves={balanceData.moves}
                  currentUserId={userId}
                  onSettled={loadAll}
                />
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3 ml-1 mt-4">Recent Expenses</h3>
              {expenses.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-500">
                  No expenses logged yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {expenses.map((e) => {
                    const date = new Date(e.created_at || new Date());
                    const dateStr = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                    
                    return (
                      <div key={e.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5 flex items-center justify-between hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-soft-green text-primary flex items-center justify-center flex-shrink-0">
                            <Coffee size={24} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-900 mb-0.5">{dateStr}</p>
                            <p className="text-sm font-medium text-gray-700 leading-tight mb-1">{e.description}</p>
                            <p className="text-xs text-gray-400">
                              Paid by {e.payer?.name || 'someone'} · {e.split_type === 'equal' ? 'Split equally' : 'Custom split'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-lg text-gray-900">₹{Number(e.amount).toFixed(2)}</span>
                          <button className="text-gray-400 hover:text-gray-600 p-1">
                            <MoreVertical size={20} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </main>
  );
}
