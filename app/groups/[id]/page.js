'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { auth } from '../../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { api } from '../../../lib/firebaseApi';
import GroupIcon from '../../../components/GroupIcon';
import { GroupDetailSkeleton } from '../../../components/Skeleton';
import ExpenseForm from '../../../components/ExpenseForm';
import BalanceBoard from '../../../components/BalanceBoard';
import { ArrowLeft, Share2, MoreVertical, Settings, Plus, Receipt, Scale, Trash2, Edit3, Link2, Check, Users, LogOut, Copy, X, Crown, UserPlus, UserCheck, Sparkles } from 'lucide-react';

export default function GroupDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const menuRef = useRef(null);

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
  const [dismissedEmptyState, setDismissedEmptyState] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [newMemberInput, setNewMemberInput] = useState('');
  const [addingMember, setAddingMember] = useState(false);
  const [addMemberMessage, setAddMemberMessage] = useState(null);
  
  const isAdmin = userRole === 'admin';

  async function handleEditGroupName() {
    const newName = window.prompt("Enter new group name:", group?.name || '');
    if (!newName || !newName.trim() || newName.trim() === group?.name) return;
    try {
      const cleanName = newName.trim();
      await api.updateGroupName(id, cleanName);
      setGroup((prev) => (prev ? { ...prev, name: cleanName } : prev));
      await loadAll();
    } catch (err) {
      alert("Failed to update group name: " + err.message);
    }
  }

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

  function handleAddShadowMember() {
    setShowMenu(false);
    setNewMemberInput('');
    setAddMemberMessage(null);
    setShowAddMemberModal(true);
  }

  async function handleAddMemberSubmit(e) {
    if (e) e.preventDefault();
    if (!newMemberInput || !newMemberInput.trim()) return;
    setAddingMember(true);
    setAddMemberMessage(null);
    try {
      const addedMember = await api.addShadowMember(id, newMemberInput.trim());
      await loadAll();
      const isAppUser = addedMember && !addedMember.isShadow;
      setAddMemberMessage({
        type: 'success',
        text: isAppUser
          ? `Connected app user "${addedMember.name}"!`
          : `Added "${addedMember?.name || newMemberInput}" to group.`,
      });
      setNewMemberInput('');
      setTimeout(() => {
        setShowAddMemberModal(false);
        setAddMemberMessage(null);
      }, 1400);
    } catch (err) {
      setAddMemberMessage({ type: 'error', text: err.message || 'Failed to add member' });
    } finally {
      setAddingMember(false);
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

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    }
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  if (loading) {
    return <GroupDetailSkeleton />;
  }

  // Filter financial expenses (exclude 0-amount system activity logs)
  const financialExpenses = expenses.filter(e => Number(e.amount) > 0);
  const totalExpenses = financialExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div className="flex-1 flex flex-col w-full bg-[#F4FBF7] min-h-screen">
      {/* Header - Clean Modern Theme */}
      <header className="w-full bg-[#F4FBF7]/95 backdrop-blur-md text-gray-900 border-b border-[#E2EFE9] sticky top-0 z-40 px-4 sm:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="p-2 hover:bg-gray-100 text-gray-700 rounded-2xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white border border-[#E2EFE9] flex items-center justify-center text-xl shadow-xs">
              <GroupIcon icon={group?.icon || group?.emoji} size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base sm:text-lg text-gray-900 tracking-tight leading-none">
                  {group ? group.name : 'Group Ledger'}
                </h1>
                <button 
                  onClick={handleEditGroupName} 
                  className="p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                  title="Edit Group Name"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                {isAdmin && (
                  <span className="text-[10px] font-extrabold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
                    Admin
                  </span>
                )}
              </div>
              <p className="text-xs font-semibold text-gray-500 mt-0.5">
                {members.length} members · Total ₹{totalExpenses.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 relative" ref={menuRef}>
          {isAdmin && (
            <button
              onClick={handleGenerateInvite}
              className="hidden sm:flex px-3.5 py-2 rounded-2xl bg-[#145C4B]/10 text-[#145C4B] hover:bg-[#145C4B]/20 font-bold text-xs transition-all items-center gap-1.5"
            >
              <Link2 className="w-4 h-4" />
              <span>Invite</span>
            </button>
          )}

          <button 
            onClick={() => setShowMenu(!showMenu)} 
            className="p-2 hover:bg-gray-100 rounded-2xl transition-colors text-gray-500"
          >
            <MoreVertical className="w-5 h-5 stroke-[2]" />
          </button>

          {/* Dropdown Menu */}
          {showMenu && (
            <div className="absolute right-0 top-12 w-64 bg-white rounded-[24px] shadow-2xl border border-[#E2EFE9] p-3 z-50 overflow-hidden space-y-2 animate-pop-in">
              <div className="px-3 py-2 border-b border-[#E2EFE9]">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mb-2">Group Members</p>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {members.map((m) => (
                    <div key={m.id} className="flex items-center justify-between gap-2 py-1">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#F0F7F4] border border-[#E2EFE9] text-[#145C4B] font-extrabold text-xs flex items-center justify-center">
                          {m.name?.charAt(0)?.toUpperCase() || 'M'}
                        </div>
                        <span className="text-xs font-bold text-gray-800 truncate">{m.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {m.role === 'admin' && <Crown className="w-3.5 h-3.5 text-amber-500" />}
                        {isAdmin && m.id !== userId && (
                          <button 
                            onClick={() => handleRemoveMember(m.id, m.name)}
                            className="p-1 hover:bg-rose-50 text-gray-400 hover:text-rose-600 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <button 
                  onClick={handleAddShadowMember}
                  className="w-full flex items-center justify-center gap-1.5 mt-2 py-2 text-xs font-bold text-[#145C4B] bg-[#F0F7F4] hover:bg-[#E2EFE9] rounded-xl transition-all"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Add Member</span>
                </button>
              </div>

              {/* Actions */}
              <div className="space-y-0.5 pt-1">
                <button
                  onClick={() => { setShowMenu(false); handleEditGroupName(); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Edit3 className="w-4 h-4 text-[#145C4B]" />
                  <span>Rename Group</span>
                </button>

                {isAdmin && (
                  <button
                    onClick={() => { setShowMenu(false); handleGenerateInvite(); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Link2 className="w-4 h-4 text-[#145C4B]" />
                    <span>Generate Invite Link</span>
                  </button>
                )}

                <button
                  onClick={() => { setShowMenu(false); shareOnWhatsapp(); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-[#25D366] hover:bg-[#25D366]/10 transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share Summary via WhatsApp</span>
                </button>

                <button
                  onClick={() => { setShowMenu(false); router.push(`/groups/${id}/report`); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Settings className="w-4 h-4 text-gray-400" />
                  <span>Analytics & Report</span>
                </button>
              </div>

              <div className="border-t border-[#E2EFE9] pt-1">
                {isAdmin ? (
                  <button
                    onClick={() => { setShowMenu(false); handleDeleteGroup(); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Group Ledger</span>
                  </button>
                ) : (
                  <button
                    onClick={() => { setShowMenu(false); handleLeaveGroup(); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Leave Group</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content & Tab Container */}
      <div className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-6 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center p-1 bg-white border border-[#E2EFE9] rounded-2xl shadow-xs w-full max-w-md">
          <button
            onClick={() => setActiveTab('expenses')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'expenses'
                ? 'bg-[#145C4B] text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Expenses ({financialExpenses.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('balance')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'balance'
                ? 'bg-[#145C4B] text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>Settlement Balances</span>
          </button>
        </div>

        {error && <p className="bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold p-4 rounded-2xl">{error}</p>}

        {activeTab === 'expenses' && (
          <div className="space-y-4">
            {financialExpenses.length === 0 ? (
              <div className="bg-white border border-[#E2EFE9] rounded-[28px] p-12 text-center shadow-sm">
                <div className="w-16 h-16 rounded-full bg-[#145C4B]/10 text-[#145C4B] flex items-center justify-center mx-auto mb-4">
                  <Receipt className="w-8 h-8 stroke-[1.8]" />
                </div>
                <h3 className="font-extrabold text-xl text-gray-900 mb-1">No expenses logged yet</h3>
                <p className="text-gray-500 text-sm max-w-sm mx-auto mb-6">
                  Add dinner bills, travel fare, rent, or groceries to auto-calculate everyone's share.
                </p>
                <button
                  onClick={() => {
                    setEditingExpense(null);
                    setShowExpenseForm(true);
                  }}
                  className="px-6 py-3 rounded-2xl bg-[#145C4B] text-white text-xs font-extrabold hover:bg-[#0E382F] transition-all shadow-md active:scale-95 inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Add First Expense</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between px-2">
                  <span className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">Expense Feed</span>
                  <select 
                    value={expenseSort} 
                    onChange={e => setExpenseSort(e.target.value)}
                    className="text-xs bg-white border border-[#E2EFE9] font-bold text-gray-700 rounded-xl px-3 py-1.5 focus:outline-none focus:border-[#145C4B]"
                  >
                    <option value="recent">Sort: Most Recent</option>
                    <option value="highest">Sort: Highest Amount</option>
                    <option value="lowest">Sort: Lowest Amount</option>
                  </select>
                </div>

                {[...financialExpenses].sort((a, b) => {
                  if (expenseSort === 'highest') return Number(b.amount) - Number(a.amount);
                  if (expenseSort === 'lowest') return Number(a.amount) - Number(b.amount);
                  return new Date(b.created_at || 0) - new Date(a.created_at || 0);
                }).map((e) => {
                  const date = new Date(e.created_at || new Date());
                  const dateStr = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
                  const isExpanded = expandedExpenseId === e.id;
                  
                  const payerId = e.paid_by || e.paidBy || e.payer?.id;
                  const isPayer = Boolean(userId && payerId && payerId === userId);
                  const canEditExpense = isPayer;
                  const payerName = e.payer?.name || members.find(m => m.id === payerId)?.name || 'Someone';

                  return (
                    <div key={e.id} className="bg-white border border-[#E2EFE9] rounded-[24px] overflow-hidden shadow-xs hover:border-[#145C4B]/30 transition-all">
                      <div 
                        onClick={() => setExpandedExpenseId(isExpanded ? null : e.id)}
                        className="p-5 flex items-center justify-between cursor-pointer hover:bg-gray-50/50 transition-colors"
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="w-11 h-11 rounded-2xl bg-[#F0F7F4] border border-[#E2EFE9] flex items-center justify-center text-[#145C4B] font-extrabold text-sm shrink-0">
                            {e.description?.charAt(0)?.toUpperCase() || 'E'}
                          </div>
                          <div>
                            <h4 className="font-extrabold text-base text-gray-900 leading-tight">{e.description}</h4>
                            <p className="text-xs text-gray-500 font-medium mt-0.5">
                              Paid by <span className="font-bold text-gray-700">{payerName}</span> · {dateStr}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="font-extrabold text-base text-[#145C4B]">
                            ₹{Number(e.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                          <p className="text-[11px] text-gray-400 font-bold mt-0.5">
                            {isExpanded ? 'Tap to close' : 'Tap for split'}
                          </p>
                        </div>
                      </div>
                      
                      {/* Expanded Split Details */}
                      {isExpanded && (
                        <div className="px-5 pb-5 pt-3 bg-[#F0F7F4]/50 border-t border-[#E2EFE9] text-xs space-y-3 animate-slide-up">
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-gray-400 uppercase tracking-wider text-[10px]">Split Shares</span>
                            {canEditExpense && (
                              <button
                                onClick={() => {
                                  setEditingExpense(e);
                                  setShowExpenseForm(true);
                                }}
                                className="text-xs font-bold text-[#145C4B] hover:underline"
                              >
                                Edit Expense ✎
                              </button>
                            )}
                          </div>

                          <div className="space-y-1.5 bg-white p-3.5 rounded-2xl border border-[#E2EFE9]">
                            {(e.expense_shares || e.shares || []).map(share => {
                              const uId = share.user_id || share.userId;
                              const member = members.find(m => m.id === uId);
                              const shareAmt = share.share_amount || share.amount;
                              return (
                                <div key={uId} className="flex justify-between items-center">
                                  <span className="text-gray-700 font-medium">{member?.name || 'Member'} owes</span>
                                  <span className="text-gray-900 font-extrabold">₹{Number(shareAmt).toFixed(2)}</span>
                                </div>
                              );
                            })}
                          </div>

                          {canEditExpense ? (
                            <button
                              onClick={() => handleDeleteExpense(e.id)}
                              className="w-full flex items-center justify-center gap-2 text-rose-600 text-xs font-bold py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>Delete Expense</span>
                            </button>
                          ) : (
                            <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 p-2.5 rounded-xl font-medium text-center">
                              🔒 Only {payerName} can edit or delete this expense.
                            </p>
                          )}
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
          <div className="space-y-4">
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

      {/* Floating Action Button for Adding Expense */}
      {activeTab === 'expenses' && (
        <div className="fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom,0px))] right-4 sm:right-8 z-40">
          <button 
            onClick={() => {
              setEditingExpense(null);
              setShowExpenseForm(true);
            }}
            className="w-14 h-14 bg-[#145C4B] hover:bg-[#0E382F] text-white rounded-full flex items-center justify-center shadow-xl shadow-[#145C4B]/30 transition-all active:scale-95"
          >
            <Plus className="w-7 h-7 stroke-[3]" />
          </button>
        </div>
      )}

      {/* Add/Edit Expense Overlay Modal */}
      {showExpenseForm && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-lg bg-white rounded-t-[32px] sm:rounded-[32px] shadow-2xl border border-[#E2EFE9] overflow-hidden max-h-[92vh] flex flex-col animate-pop-in">
            <header className="px-6 py-4 bg-[#F4FBF7] border-b border-[#E2EFE9] flex items-center justify-between shrink-0">
              <h2 className="font-extrabold text-lg text-gray-900">{editingExpense ? 'Edit Expense' : 'Add New Expense'}</h2>
              <button onClick={() => { setShowExpenseForm(false); setEditingExpense(null); }} className="p-1.5 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </header>
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
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
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <div
          className="fixed inset-0 z-[80] bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => { setShowAddMemberModal(false); setAddMemberMessage(null); }}
        >
          <div
            className="w-full max-w-md bg-white rounded-[28px] shadow-2xl p-6 border border-[#E2EFE9] space-y-4 animate-pop-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#F0F7F4] border border-[#E2EFE9] flex items-center justify-center text-[#145C4B]">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-gray-900">Add Member</h3>
                  <p className="text-xs font-medium text-gray-500">App users & offline friends</p>
                </div>
              </div>
              <button
                onClick={() => { setShowAddMemberModal(false); setAddMemberMessage(null); }}
                className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-[#F0F7F4]/70 rounded-2xl p-3.5 border border-[#E2EFE9] space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#145C4B]">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Auto-links App Accounts</span>
              </div>
              <p className="text-[11px] text-gray-600 leading-relaxed font-medium">
                Enter an <strong>Email ID</strong>, <strong>Phone Number</strong>, or <strong>Name</strong>. If they already use Kaun-Dega, their app account will link automatically!
              </p>
            </div>

            <form onSubmit={handleAddMemberSubmit} className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-400 mb-1.5">
                  Email, Phone, or Name
                </label>

                <input
                  type="text"
                  value={newMemberInput}
                  onChange={(e) => setNewMemberInput(e.target.value)}
                  placeholder="e.g. rahul@gmail.com or 9876543210"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#145C4B] focus:bg-white transition-all placeholder:text-gray-400"
                  autoFocus
                />
              </div>

              {addMemberMessage && (
                <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                  addMemberMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}>
                  {addMemberMessage.type === 'success' && <UserCheck className="w-4 h-4 shrink-0 text-emerald-600" />}
                  <span>{addMemberMessage.text}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={addingMember || !newMemberInput.trim()}
                className="w-full py-3.5 bg-[#145C4B] text-white rounded-2xl font-bold text-xs hover:bg-[#0E4337] transition-all disabled:opacity-50 shadow-md active:scale-[0.99] flex items-center justify-center gap-2"
              >
                {addingMember ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Searching & Adding...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Add to Group</span>
                  </>
                )}
              </button>
            </form>

            <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-gray-400">Prefer sending invite?</span>
              <button
                onClick={() => {
                  setShowAddMemberModal(false);
                  handleGenerateInvite();
                }}
                className="text-xs font-extrabold text-[#145C4B] hover:underline flex items-center gap-1"
              >
                <Link2 className="w-3.5 h-3.5" />
                <span>Share Group Link</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Link Modal */}
      {showInviteModal && (
        <div
          className="fixed inset-0 z-[80] bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowInviteModal(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-[28px] shadow-2xl p-6 border border-[#E2EFE9] space-y-4 animate-pop-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-lg text-gray-900">Invite Members</h3>
              <button
                onClick={() => setShowInviteModal(false)}
                className="p-1.5 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-gray-500 font-medium leading-relaxed">
              Share this invite link with friends to join <strong>{group?.name}</strong>.
            </p>
            
            <div className="bg-[#F0F7F4] rounded-2xl p-3.5 border border-[#E2EFE9] font-mono text-xs text-gray-800 break-all select-all font-bold">
              {inviteLink}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={copyInviteLink}
                className="py-3 px-3 rounded-2xl bg-[#F0F7F4] border border-[#E2EFE9] font-bold text-xs text-[#145C4B] hover:bg-[#E2EFE9] transition-all flex items-center justify-center gap-1.5 min-w-0"
              >
                {inviteCopied ? <Check className="w-4 h-4 shrink-0 text-[#0D9488]" /> : <Copy className="w-4 h-4 shrink-0" />}
                <span className="truncate">{inviteCopied ? 'Copied!' : 'Copy Link'}</span>
              </button>
              <button
                onClick={shareInviteWhatsApp}
                className="py-3 px-3 rounded-2xl bg-[#25D366] text-[#0E382F] font-extrabold text-xs hover:bg-[#20b859] transition-all flex items-center justify-center gap-1.5 shadow-sm min-w-0"
              >
                <Share2 className="w-4 h-4 shrink-0" />
                <span className="truncate">WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
