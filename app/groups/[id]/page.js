'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { auth } from '../../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { api } from '../../../lib/firebaseApi';
import GroupIcon from '../../../components/GroupIcon';
import ExpenseForm from '../../../components/ExpenseForm';
import BalanceBoard from '../../../components/BalanceBoard';
import { ArrowLeft, Share2, MoreVertical, Settings, Plus, Receipt, Scale, Trash2, Edit3, Link2, Check, Users, LogOut, Copy, X, Crown } from 'lucide-react';

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
  const [copiedLink, setCopiedLink] = useState(false);
  const [userRole, setUserRole] = useState(null); // 'admin' | 'member'

  // Tabs and overlays
  const [activeTab, setActiveTab] = useState('expenses'); // 'expenses' | 'balance'
  const [expenseSort, setExpenseSort] = useState('recent'); // 'recent' | 'highest' | 'lowest'
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [expandedExpenseId, setExpandedExpenseId] = useState(null);
  const [editingPayerExpenseId, setEditingPayerExpenseId] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [inviteCopied, setInviteCopied] = useState(false);

  const isAdmin = userRole === 'admin';

  async function handleChangePayer(expenseId, newPayerId) {
    try {
      await api.updateExpensePayer(expenseId, newPayerId);
      setEditingPayerExpenseId(null);
      await loadAll();
    } catch (err) {
      alert('Failed to update payer: ' + err.message);
    }
  }

  async function handleDeleteExpense(expenseId) {
    if (!confirm('Delete this expense? This cannot be undone.')) return;
    try {
      await api.deleteExpense(expenseId);
      setExpandedExpenseId(null);
      await loadAll();
    } catch (err) {
      alert('Failed to delete: ' + err.message);
    }
  }

  async function shareOnWhatsapp() {
    setSharing(true);
    try {
      const { text } = await api.getWhatsappText(id);
      const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank');
    } catch (err) {
      alert(err.message || 'Failed to generate WhatsApp share text');
    } finally {
      setSharing(false);
    }
  }

  // Invite generation
  function handleGenerateInvite() {
    const link = `${window.location.origin}/join/${id}`;
    setInviteLink(link);
    setShowInviteModal(true);
  }

  function copyInviteLink() {
    navigator.clipboard.writeText(inviteLink).then(() => {
      setInviteCopied(true);
      setTimeout(() => setInviteCopied(false), 2000);
    }).catch(() => {
      prompt('Copy this invite link:', inviteLink);
    });
  }

  function shareInviteWhatsApp() {
    const text = `Join my group "${group?.name}" on Kaun Dega!\n${inviteLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  }

  async function handleDeleteGroup() {
    if (!confirm(`Are you sure you want to delete "${group?.name}"? This will permanently remove all expenses, balances, and member data. This cannot be undone.`)) return;
    try {
      await api.deleteGroup(id);
      router.push('/dashboard');
    } catch (err) {
      alert(err.message || 'Failed to delete group');
    }
  }

  async function handleLeaveGroup() {
    if (!confirm(`Are you sure you want to leave "${group?.name}"? You'll lose access to this group's expenses and balances.`)) return;
    try {
      await api.leaveGroup(id);
      router.push('/dashboard');
    } catch (err) {
      alert(err.message || 'Failed to leave group');
    }
  }

  async function handleRemoveMember(memberId, memberName) {
    if (!confirm(`Remove ${memberName} from this group?`)) return;
    try {
      await api.removeMember(id, memberId);
      await loadAll();
    } catch (err) {
      alert('Failed to remove member: ' + err.message);
    }
  }

  async function handleAddShadowMember() {
    setShowMenu(false);
    const input = window.prompt("Enter the name of the new member (e.g. Rahul):");
    if (!input || !input.trim()) return;
    try {
      await api.addShadowMember(id, input.trim());
      await loadAll();
    } catch (err) {
      alert("Failed to add member: " + err.message);
    }
  }

  const loadAll = useCallback(async () => {
    try {
      const [membersData, expensesData, balances, groupData] = await Promise.all([
        api.getMembers(id),
        api.getExpenses(id),
        api.getBalances(id),
        api.getGroup(id),
      ]);
      setMembers(membersData);
      setExpenses(expensesData);
      setBalanceData(balances);
      setGroup(groupData);
      
      const currentUid = auth.currentUser?.uid;
      const myMember = membersData.find(m => m.id === currentUid);
      setUserRole(myMember?.role || null);
    } catch (err) {
      setError(err.message || 'Failed to load group');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    let unsubscribeExpenses = null;
    let unsubscribeSettlements = null;
    let unsubscribeGroup = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }
      setUserId(user.uid);
      await loadAll();

      // Realtime subscriptions
      unsubscribeGroup = api.subscribeGroup(id, (updatedGroup) => {
        if (!updatedGroup) {
          router.push('/dashboard');
          return;
        }
        setGroup(updatedGroup);
        const mems = Object.values(updatedGroup.members || {});
        setMembers(mems);
        const myMember = mems.find(m => m.id === user.uid);
        setUserRole(myMember?.role || null);
      });

      unsubscribeExpenses = api.subscribeExpenses(id, () => {
        loadAll();
      });

      unsubscribeSettlements = api.subscribeSettlements(id, () => {
        loadAll();
      });
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeGroup) unsubscribeGroup();
      if (unsubscribeExpenses) unsubscribeExpenses();
      if (unsubscribeSettlements) unsubscribeSettlements();
    };
  }, [id, loadAll, router]);

  if (loading) {
    return <main className="min-h-screen bg-green-50 flex items-center justify-center text-gray-400">Loading...</main>;
  }

  // Determine total expenses
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <main className="min-h-screen bg-green-50 flex flex-col font-body" style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))' }}>
      {/* Header - Clean Modern Theme */}
      <header className="w-full h-16 px-4 flex items-center justify-between bg-green-50/80 backdrop-blur-md text-gray-900 border-b border-green-100/50 sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/dashboard')} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <ArrowLeft size={24} strokeWidth={2.5} />
          </button>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg tracking-tight">
                {group ? group.name : 'Group'}
              </h1>
              {isAdmin && (
                <span className="text-[9px] font-bold uppercase tracking-widest bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Admin</span>
              )}
            </div>
            {group && (
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
                <GroupIcon icon={group.icon || group.emoji} size={13} className="text-[#145C4B]" />
                <span>{members.length} members</span>
              </p>
            )}
          </div>
        </div>
        <div className="relative">
          <button 
            onClick={() => setShowMenu(!showMenu)} 
            className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400"
          >
            <MoreVertical size={20} strokeWidth={2.5} />
          </button>

          {/* Dropdown Menu */}
          {showMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-12 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 overflow-hidden">
                {/* Members */}
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Members</p>
                  {members.map(m => (
                    <div key={m.id} className="flex items-center gap-2 py-1">
                      <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500">
                        {m.name?.charAt(0)?.toUpperCase() || 'M'}
                      </div>
                      <span className="text-sm text-gray-700 flex-1 truncate">{m.name}</span>
                      {m.role === 'admin' && <Crown size={12} className="text-amber-500" />}
                      {isAdmin && m.id !== userId && (
                        <button 
                          onClick={() => handleRemoveMember(m.id, m.name)}
                          className="p-1 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded transition-colors"
                          title={`Remove ${m.name}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button 
                    onClick={handleAddShadowMember}
                    className="w-full flex items-center gap-2 mt-2 px-2 py-1.5 text-xs font-semibold text-[#145C4B] bg-[#145C4B]/10 hover:bg-[#145C4B]/20 rounded-lg transition-colors"
                  >
                    <Plus size={14} /> Add Offline Member
                  </button>
                </div>

                {/* Actions */}
                {isAdmin && (
                  <button
                    onClick={() => { setShowMenu(false); handleGenerateInvite(); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Link2 size={16} className="text-[#145C4B]" />
                    Generate Invite Link
                  </button>
                )}

                <button
                  onClick={() => { setShowMenu(false); shareOnWhatsapp(); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Share2 size={16} className="text-green-600" />
                  Share on WhatsApp
                </button>

                <button
                  onClick={() => { setShowMenu(false); router.push(`/groups/${id}/report`); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Settings size={16} className="text-gray-400" />
                  View Report
                </button>

                <div className="border-t border-gray-100 mt-1 pt-1">
                  {isAdmin ? (
                    <button
                      onClick={() => { setShowMenu(false); handleDeleteGroup(); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={16} />
                      Delete Group
                    </button>
                  ) : (
                    <button
                      onClick={() => { setShowMenu(false); handleLeaveGroup(); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <LogOut size={16} />
                      Leave Group
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
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
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between sticky top-16 z-20">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Transactions</span>
                  <select 
                    value={expenseSort} 
                    onChange={e => setExpenseSort(e.target.value)}
                    className="text-xs bg-white border border-gray-200 text-gray-700 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#145C4B]"
                  >
                    <option value="recent">Recent First</option>
                    <option value="highest">Highest Amount</option>
                    <option value="lowest">Lowest Amount</option>
                  </select>
                </div>
                {[...expenses].sort((a, b) => {
                  if (expenseSort === 'highest') return Number(b.amount) - Number(a.amount);
                  if (expenseSort === 'lowest') return Number(a.amount) - Number(b.amount);
                  return new Date(b.created_at || 0) - new Date(a.created_at || 0);
                }).map((e) => {
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
                        <div className="px-4 pb-4 pt-2 bg-gray-50 text-[13px] border-t border-gray-100">
                          {/* Edit Payer */}
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Edit3 size={14} className="text-gray-400" />
                              <span className="font-semibold text-gray-500 uppercase tracking-wide text-[10px]">Paid by</span>
                            </div>
                            {editingPayerExpenseId === e.id ? (
                              <select
                                className="text-[13px] bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#145C4B]/30"
                                defaultValue={e.paid_by || e.paidBy}
                                onChange={(ev) => handleChangePayer(e.id, ev.target.value)}
                              >
                                {members.map(m => (
                                  <option key={m.id} value={m.id}>{m.name}</option>
                                ))}
                              </select>
                            ) : (
                              <button
                                onClick={() => setEditingPayerExpenseId(e.id)}
                                className="text-[13px] text-[#145C4B] font-semibold underline underline-offset-2 decoration-dashed"
                              >
                                {e.payer?.name || 'Someone'} ✎
                              </button>
                            )}
                          </div>

                          {/* Split Breakdown */}
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-semibold text-gray-500 uppercase tracking-wide text-[10px]">Split Details</p>
                            <button
                              onClick={() => {
                                setEditingExpense(e);
                                setShowExpenseForm(true);
                              }}
                              className="text-[13px] text-[#145C4B] font-semibold underline underline-offset-2 decoration-dashed"
                            >
                              Edit ✎
                            </button>
                          </div>
                          {(e.expense_shares || e.shares || []).map(share => {
                            const uId = share.user_id || share.userId;
                            const member = members.find(m => m.id === uId);
                            const shareAmt = share.share_amount || share.amount;
                            return (
                              <div key={uId} className="flex justify-between items-center mb-1">
                                <span className="text-gray-600">{member?.name || 'Unknown'} owes</span>
                                <span className="text-gray-800 font-medium">{Number(shareAmt).toFixed(2)} INR</span>
                              </div>
                            );
                          })}

                          {/* Delete Expense */}
                          <button
                            onClick={() => handleDeleteExpense(e.id)}
                            className="mt-3 w-full flex items-center justify-center gap-2 text-red-500 text-[12px] font-semibold py-2 rounded-lg border border-red-200 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 size={14} />
                            Delete Expense
                          </button>
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
        <div className="fixed bottom-24 w-full max-w-md left-1/2 -translate-x-1/2 z-40 pointer-events-none flex justify-end px-6">
          <button 
            onClick={() => {
              setEditingExpense(null);
              setShowExpenseForm(true);
            }}
            className="pointer-events-auto w-14 h-14 bg-[#145C4B] hover:bg-[#145C4B]/90 text-white rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95"
          >
            <Plus size={28} strokeWidth={2.5} />
          </button>
        </div>
      )}

      {/* Group Bottom Navigation (Clean Theme) */}
      <div className="fixed bottom-0 w-full max-w-md left-1/2 -translate-x-1/2 bg-white border-t border-gray-100 flex justify-around items-center h-20 px-2 sm:px-8 z-50 rounded-t-3xl shadow-[0_-4px_24px_rgba(0,0,0,0.02)]">
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
        {isAdmin && (
          <button 
            onClick={handleGenerateInvite}
            className="flex flex-col items-center justify-center w-full h-full"
          >
            <div className={`px-5 py-1.5 rounded-full transition-colors ${copiedLink ? 'bg-[#e6f4ed] text-[#145C4B]' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}>
              {copiedLink ? <Check size={24} strokeWidth={2.5} /> : <Link2 size={24} strokeWidth={2} />}
            </div>
            <span className={`text-[11px] mt-1.5 font-medium ${copiedLink ? 'text-[#145C4B] font-semibold' : 'text-gray-500'}`}>
              {copiedLink ? 'Copied!' : 'Invite'}
            </span>
          </button>
        )}
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

      {/* Add/Edit Expense Overlay Modal */}
      {showExpenseForm && (
        <div className="fixed inset-y-0 w-full max-w-md left-1/2 -translate-x-1/2 bg-green-50 z-[60] flex flex-col shadow-2xl">
          <header className="w-full h-16 px-4 flex items-center justify-between bg-green-50/80 backdrop-blur-md border-b border-green-100/50 shrink-0 sticky top-0 z-10">
            <button onClick={() => { setShowExpenseForm(false); setEditingExpense(null); }} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-900">
              <ArrowLeft size={24} strokeWidth={2.5} />
            </button>
            <h2 className="font-bold text-lg text-gray-900">{editingExpense ? 'Edit Expense' : 'Add New Expense'}</h2>
            <div className="w-10"></div>
          </header>
          <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
            <ExpenseForm 
              groupId={id} 
              members={members} 
              currentUserId={userId} 
              existingExpense={editingExpense}
              onAdded={() => {
                setShowExpenseForm(false);
                setEditingExpense(null);
                loadAll();
              }}
              onUpdated={() => {
                setShowExpenseForm(false);
                setEditingExpense(null);
                loadAll();
              }}
            />
          </div>
        </div>
      )}

      {/* Invite Link Modal */}
      {showInviteModal && (
        <>
          <div className="fixed inset-0 bg-black/40 z-[70]" onClick={() => setShowInviteModal(false)} />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-white rounded-2xl shadow-2xl z-[80] overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg text-gray-900">Invite Members</h3>
                <button onClick={() => setShowInviteModal(false)} className="p-1 hover:bg-gray-100 rounded-full">
                  <X size={18} className="text-gray-400" />
                </button>
              </div>
              <p className="text-gray-500 text-sm mb-4">Share this link with friends to invite them to <strong>{group?.name}</strong>.</p>
              
              <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-2 mb-4 border border-gray-100">
                <p className="text-xs text-gray-600 flex-1 truncate font-mono">{inviteLink}</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={copyInviteLink}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-colors ${
                    inviteCopied 
                      ? 'bg-green-100 text-green-700 border border-green-200' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {inviteCopied ? <Check size={16} /> : <Copy size={16} />}
                  {inviteCopied ? 'Copied!' : 'Copy Link'}
                </button>
                <button
                  onClick={shareInviteWhatsApp}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#145C4B] text-white font-semibold text-sm hover:bg-[#145C4B]/90 transition-colors"
                >
                  <Share2 size={16} />
                  WhatsApp
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
