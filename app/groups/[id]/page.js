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

  // Modals state
  const [showHistory, setShowHistory] = useState(false);
  const [showBalances, setShowBalances] = useState(false);

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
    const myBal = balanceData.balances.find(b => b.id === userId);
    if (myBal) {
      const amt = myBal.amount || 0;
      netBalanceStr = (amt > 0 ? '+' : '') + amt.toFixed(2);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col font-body">
      {/* Header */}
      <header className="w-full h-16 px-4 flex items-center justify-between bg-gray-50 sticky top-0 z-40">
        <button onClick={() => router.push('/dashboard')} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-900">
          <ArrowLeft size={24} strokeWidth={2.5} />
        </button>
        
        <div className="flex flex-col items-center">
          <h1 className="font-bold text-lg tracking-tight text-gray-900">Add Expense</h1>
          {group && (
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              {group.name} {group.emoji}
            </p>
          )}
        </div>

        <button onClick={() => setShowHistory(true)} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-900">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        </button>
      </header>

      <div className="flex-1 w-full max-w-3xl mx-auto px-4 pb-8">
        {error && <p className="text-red-500 text-sm font-medium mb-4">{error}</p>}

        <div className="flex flex-col gap-4">
          
          {/* Net Balance (Light Green App style) */}
          <div className="bg-[#e6f4ed] rounded-2xl flex justify-between items-center relative overflow-hidden shadow-sm p-5 border border-[#d3ebd9]">
            <div className="relative z-10">
              <p className="text-[10px] font-bold uppercase tracking-widest mb-1 text-gray-600 flex items-center gap-1">
                YOUR NEXT BALANCE
                <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </p>
              <p className="font-mono font-bold text-3xl text-[#145C4B]">₹{netBalanceStr}</p>
            </div>
            
            {/* Centered Decorative Wallet Icon */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-60 pointer-events-none">
              <Wallet size={64} className="text-[#145C4B] rotate-12 drop-shadow-md" strokeWidth={1.5} />
            </div>

            <button 
              onClick={() => setShowBalances(true)}
              className="relative z-10 bg-[#145C4B] text-white text-[11px] font-bold uppercase tracking-widest px-4 py-2.5 rounded-lg hover:bg-[#145C4B]/90 transition-colors shadow-sm"
            >
              SETTLE UP
            </button>
          </div>

          {/* Expense Form */}
          <ExpenseForm groupId={id} members={members} currentUserId={userId} onAdded={loadAll} />
          
        </div>
      </div>

      {/* MODALS / OVERLAYS */}

      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col overflow-hidden">
          <header className="w-full h-16 px-4 flex items-center justify-between border-b border-gray-200 bg-white shrink-0">
            <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-900">
              <ArrowLeft size={24} strokeWidth={2.5} />
            </button>
            <h2 className="font-bold text-lg text-gray-900">Recent Expenses</h2>
            <div className="w-10"></div>
          </header>
          <div className="flex-1 overflow-y-auto p-4 max-w-3xl mx-auto w-full">
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
                    <div key={e.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center justify-between hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-soft-green text-primary flex items-center justify-center flex-shrink-0">
                          <Coffee size={20} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-900 mb-0.5">{dateStr}</p>
                          <p className="text-sm font-medium text-gray-700 leading-tight mb-1">{e.description}</p>
                          <p className="text-[11px] text-gray-400">
                            Paid by {e.payer?.name || 'someone'} · {e.split_type === 'equal' ? 'Split equally' : 'Custom split'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-base text-gray-900">₹{Number(e.amount).toFixed(2)}</span>
                        <button className="text-gray-400 hover:text-gray-600 p-1">
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Balances Modal */}
      {showBalances && (
        <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col overflow-hidden">
          <header className="w-full h-16 px-4 flex items-center justify-between border-b border-gray-200 bg-white shrink-0">
            <button onClick={() => setShowBalances(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-900">
              <ArrowLeft size={24} strokeWidth={2.5} />
            </button>
            <h2 className="font-bold text-lg text-gray-900">Group Balances</h2>
            <button 
              onClick={shareOnWhatsapp} 
              disabled={sharing}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors text-[#145C4B] disabled:opacity-50"
            >
              <Share2 size={20} />
            </button>
          </header>
          <div className="flex-1 overflow-y-auto p-4 max-w-3xl mx-auto w-full">
            <BalanceBoard
              groupId={id}
              balances={balanceData.balances}
              moves={balanceData.moves}
              currentUserId={userId}
              onSettled={loadAll}
            />
          </div>
        </div>
      )}

    </main>
  );
}
