'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../archive/deprecated-utils/supabaseClient';
import { api } from '../../../archive/deprecated-utils/api';
import ExpenseForm from '../../../components/ExpenseForm';
import BalanceBoard from '../../../components/BalanceBoard';
import { ArrowLeft, Share2, MoreVertical, Settings, Plus, Receipt, Scale } from 'lucide-react';

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

  // Tabs and overlays
  const [activeTab, setActiveTab] = useState('expenses'); // 'expenses' | 'balance'
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expandedExpenseId, setExpandedExpenseId] = useState(null);

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

  // Determine total expenses
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col font-body" style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))' }}>
      {/* Header - Clean Modern Theme */}
      <header className="w-full h-16 px-4 flex items-center justify-between bg-gray-50 text-gray-900 sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/dashboard')} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <ArrowLeft size={24} strokeWidth={2.5} />
          </button>
          <div className="flex flex-col">
            <h1 className="font-bold text-lg tracking-tight">
              {group ? group.name : 'Group'}
            </h1>
            {group && <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{group.emoji} Expenses</p>}
          </div>
        </div>
        <button className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400">
          <MoreVertical size={20} strokeWidth={2.5} />
        </button>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 w-full mx-auto bg-white">
        {error && <p className="text-red-500 text-sm p-4">{error}</p>}

        {activeTab === 'expenses' && (
          <div className="flex flex-col">
            {expenses.length === 0 ? (
              <div className="p-8 text-center text-gray-400">No expenses logged yet.</div>
            ) : (
              <div className="flex flex-col">
                {expenses.map((e) => {
                  const date = new Date(e.created_at || new Date());
                  const dateStr = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                  const isExpanded = expandedExpenseId === e.id;
                  
                  return (
                    <div key={e.id} className="border-b border-gray-100 flex flex-col bg-white">
                      <div 
                        onClick={() => setExpandedExpenseId(isExpanded ? null : e.id)}
                        className="px-4 py-3 flex justify-between cursor-pointer hover:bg-gray-50"
                      >
                        <div className="flex flex-col">
                          <p className="text-gray-800 font-medium text-[15px]">{e.description}</p>
                          <p className="text-gray-400 text-[13px] mt-0.5">Paid by {e.payer?.name || 'Someone'}</p>
                        </div>
                        <div className="flex flex-col items-end">
                          <p className="text-gray-800 font-medium text-[15px]">{Number(e.amount).toFixed(2)} INR</p>
                          <p className="text-gray-400 text-[13px] mt-0.5">{dateStr}</p>
                        </div>
                      </div>
                      
                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="px-4 pb-3 pt-1 bg-gray-50 text-[13px]">
                          <p className="font-semibold text-gray-500 mb-2 uppercase tracking-wide text-[10px]">Split Details</p>
                          {e.expense_shares?.map(share => {
                            const member = members.find(m => m.id === share.user_id);
                            return (
                              <div key={share.user_id} className="flex justify-between items-center mb-1">
                                <span className="text-gray-600">{member?.name || 'Unknown'} owes</span>
                                <span className="text-gray-800 font-medium">{Number(share.share_amount).toFixed(2)} INR</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'balance' && (
          <div className="bg-gray-100 min-h-full pb-8">
            <BalanceBoard
              groupId={id}
              balances={balanceData.balances}
              moves={balanceData.moves}
              currentUserId={userId}
              totalExpenses={totalExpenses}
              onSettled={loadAll}
              members={members}
            />
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      {activeTab === 'expenses' && (
        <button 
          onClick={() => setShowExpenseForm(true)}
          className="fixed bottom-24 right-6 w-14 h-14 bg-[#145C4B] hover:bg-[#145C4B]/90 text-white rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 z-40"
        >
          <Plus size={28} strokeWidth={2.5} />
        </button>
      )}

      {/* Group Bottom Navigation (Clean Theme) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around items-center h-20 px-2 sm:px-8 z-50 rounded-t-3xl shadow-[0_-4px_24px_rgba(0,0,0,0.02)]">
        <button 
          onClick={() => setActiveTab('expenses')}
          className="flex flex-col items-center justify-center w-full h-full"
        >
          <div className={`px-5 py-1.5 rounded-full transition-colors ${activeTab === 'expenses' ? 'bg-[#e6f4ed] text-[#145C4B]' : 'text-gray-400 hover:text-gray-600'}`}>
            <Receipt size={24} strokeWidth={activeTab === 'expenses' ? 2.5 : 2} />
          </div>
          <span className={`text-[11px] mt-1.5 font-medium ${activeTab === 'expenses' ? 'text-gray-800 font-semibold' : 'text-gray-500'}`}>Expenses</span>
        </button>
        <button 
          onClick={() => setActiveTab('balance')}
          className="flex flex-col items-center justify-center w-full h-full"
        >
          <div className={`px-5 py-1.5 rounded-full transition-colors ${activeTab === 'balance' ? 'bg-[#e6f4ed] text-[#145C4B]' : 'text-gray-400 hover:text-gray-600'}`}>
            <Scale size={24} strokeWidth={activeTab === 'balance' ? 2.5 : 2} />
          </div>
          <span className={`text-[11px] mt-1.5 font-medium ${activeTab === 'balance' ? 'text-gray-800 font-semibold' : 'text-gray-500'}`}>Balance</span>
        </button>
        <button 
          onClick={shareOnWhatsapp}
          className="flex flex-col items-center justify-center w-full h-full"
        >
          <div className="px-5 py-1.5 rounded-full transition-colors text-gray-400 hover:text-gray-600 hover:bg-gray-50">
            <Share2 size={24} strokeWidth={2} />
          </div>
          <span className="text-[11px] mt-1.5 font-medium text-gray-500">Share</span>
        </button>
        <button 
          onClick={() => router.push(`/groups/${id}/report`)}
          className="flex flex-col items-center justify-center w-full h-full"
        >
          <div className="px-5 py-1.5 rounded-full transition-colors text-gray-400 hover:text-gray-600 hover:bg-gray-50">
            <Settings size={24} strokeWidth={2} />
          </div>
          <span className="text-[11px] mt-1.5 font-medium text-gray-500">Report</span>
        </button>
      </div>

      {/* Add Expense Overlay Modal */}
      {showExpenseForm && (
        <div className="fixed inset-0 bg-gray-50 z-[60] flex flex-col">
          <header className="w-full h-16 px-4 flex items-center justify-between bg-white border-b border-gray-200 shrink-0">
            <button onClick={() => setShowExpenseForm(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-900">
              <ArrowLeft size={24} strokeWidth={2.5} />
            </button>
            <h2 className="font-bold text-lg text-gray-900">Add New Expense</h2>
            <div className="w-10"></div>
          </header>
          <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
            <ExpenseForm 
              groupId={id} 
              members={members} 
              currentUserId={userId} 
              onAdded={() => {
                setShowExpenseForm(false);
                loadAll();
              }} 
            />
          </div>
        </div>
      )}
    </main>
  );
}
