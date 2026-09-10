'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth } from '../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { api, isDirectGroup } from '../../lib/firebaseApi';
import GroupIcon from '../../components/GroupIcon';
import TopHeader from '../../components/TopHeader';
import { DashboardSkeleton, GroupCardSkeleton } from '../../components/Skeleton';
import { Plus, Users, ChevronRight, LogOut, Trash2, ArrowUpRight, ArrowDownLeft, Sparkles, Link as LinkIcon, Wallet, UserCheck, Shield } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [groups, setGroups] = useState(null);
  const [error, setError] = useState('');
  const [consolidatedBalance, setConsolidatedBalance] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [netBalanceLoading, setNetBalanceLoading] = useState(true);
  const [ledgerType, setLedgerType] = useState(0); // 0 = Groups, 1 = 1-on-1 Khatabook
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);

  // 1-on-1 Khatabook Modal
  const [showKhatabookModal, setShowKhatabookModal] = useState(false);
  const [khatabookFriendInput, setKhatabookFriendInput] = useState('');
  const [khatabookNameInput, setKhatabookNameInput] = useState('');
  const [creatingKhatabook, setCreatingKhatabook] = useState(false);

  async function handleCreateKhatabookSubmit(e) {
    if (e) e.preventDefault();
    if (!khatabookFriendInput.trim()) return;
    setCreatingKhatabook(true);
    try {
      const friendName = khatabookFriendInput.trim();
      const ledgerName = khatabookNameInput.trim() || `Khatabook: ${friendName}`;
      const newGroup = await api.createGroup({
        name: ledgerName,
        emoji: '👤',
        icon: '👤',
        groupType: 'khatabook',
        memberEmails: [friendName],
      });
      setShowKhatabookModal(false);
      setKhatabookFriendInput('');
      setKhatabookNameInput('');
      if (newGroup && newGroup.id) {
        router.push(`/groups/${newGroup.id}`);
      } else {
        const fetchedGroups = await api.getGroups();
        setGroups(fetchedGroups);
      }
    } catch (err) {
      alert('Failed to create 1-on-1 Khatabook: ' + err.message);
    } finally {
      setCreatingKhatabook(false);
    }
  }

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

  const handleJoinByCode = async (e) => {
    e.preventDefault();
    let input = joinCodeInput.trim();
    if (!input) return;
    if (input.includes('/join/')) {
      input = input.split('/join/').last?.split('?')[0] || input;
    }
    setJoinLoading(true);
    try {
      const joinedGroup = await api.joinGroupByCode(input);
      setShowJoinModal(false);
      setJoinCodeInput('');
      if (joinedGroup?.id) {
        router.push(`/groups/${joinedGroup.id}`);
      } else {
        alert('Group joined successfully!');
      }
    } catch (err) {
      alert(err.message || 'Invalid invite code or group not found.');
    } finally {
      setJoinLoading(false);
    }
  };

  useEffect(() => {
    let unsubscribeGroups = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }
      setCurrentUser(user);

      try {
        const prof = await api.ensureUserProfile(user);
        setUserProfile(prof);

        // Real-time Firestore groups listener
        unsubscribeGroups = api.subscribeGroups(async (fetchedGroups) => {
          setGroups(fetchedGroups);
          
          let total = 0;
          let spent = 0;
          await Promise.all(
            fetchedGroups.map(async (g) => {
              try {
                const balanceData = await api.getBalances(g.id, g);
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

  const groupLedgers = groups ? groups.filter((g) => !isDirectGroup(g)) : [];
  const directLedgers = groups ? groups.filter((g) => isDirectGroup(g)) : [];
  const displayedGroups = ledgerType === 0 ? groupLedgers : directLedgers;

  return (
    <div className="flex-1 flex flex-col w-full bg-[#F4FBF7] min-h-screen">
      {/* SaaS Style Header */}
      <TopHeader
        title="Kaun Dega?"
        userName={userProfile?.name || currentUser?.displayName || currentUser?.email}
        onOpenNewGroup={() => router.push('/groups/new')}
        onOpenJoinGroup={() => setShowJoinModal(true)}
      />

      <div className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-6 space-y-6">
        {/* Consolidated Net Balance Hero Card */}
        <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#145C4B] via-[#0E382F] to-[#082720] text-white p-6 sm:p-8 shadow-xl shadow-[#145C4B]/20 border border-white/10">
          {/* Ambient Decorative Background Glows */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-[#25D366]/15 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-white/5 blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col gap-5">
            {/* Top Row: Label & Status Badge */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full animate-pulse ${
                    consolidatedBalance > 0
                      ? 'bg-[#25D366] shadow-[0_0_8px_#25D366]'
                      : consolidatedBalance < 0
                      ? 'bg-rose-400 shadow-[0_0_8px_#fb7185]'
                      : 'bg-white/70'
                  }`}
                />
                <span className="text-[11px] font-extrabold tracking-widest text-emerald-200/90 uppercase">
                  Consolidated Net Balance
                </span>
              </div>

              {!netBalanceLoading && (
                <div
                  className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold flex items-center gap-1.5 shadow-sm ${
                    consolidatedBalance > 0
                      ? 'bg-[#059669] text-white shadow-emerald-950/40'
                      : consolidatedBalance < 0
                      ? 'bg-[#E11D48] text-white shadow-rose-950/40'
                      : 'bg-white/20 text-white'
                  }`}
                >
                  {consolidatedBalance > 0 ? (
                    <>
                      <ArrowDownLeft className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>You get back</span>
                    </>
                  ) : consolidatedBalance < 0 ? (
                    <>
                      <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>You owe</span>
                    </>
                  ) : (
                    <span>All Settled Up</span>
                  )}
                </div>
              )}
            </div>

            {/* Main Balance Display */}
            <div className="space-y-1">
              {netBalanceLoading ? (
                <div className="h-12 w-48 bg-white/20 animate-pulse rounded-2xl" />
              ) : (
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-bold text-emerald-200/80">₹</span>
                  <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                    {consolidatedBalance >= 0
                      ? `${consolidatedBalance.toLocaleString('en-IN')}`
                      : `${Math.abs(consolidatedBalance).toLocaleString('en-IN')}`}
                  </span>
                </div>
              )}

              <p className="text-xs text-emerald-100/70 font-medium">
                Overall position across all active group ledgers & 1-on-1 khatabook
              </p>
            </div>

            {/* Action Buttons Row */}
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2.5 sm:gap-3 pt-2">
              <button
                onClick={() => setShowJoinModal(true)}
                className="h-12 px-3 sm:px-5 rounded-2xl bg-white hover:bg-gray-50 text-[#0E382F] text-xs font-extrabold transition-all shadow-md border border-[#E2EFE9] flex items-center justify-center gap-1.5 sm:gap-2 active:scale-95 cursor-pointer whitespace-nowrap min-w-0"
              >
                <LinkIcon className="w-4 h-4 shrink-0 stroke-[2.5] text-[#145C4B]" />
                <span>Join with Code</span>
              </button>
              <button
                onClick={() => setShowKhatabookModal(true)}
                className="h-12 px-3 sm:px-5 rounded-2xl bg-white hover:bg-gray-50 text-[#0E382F] text-xs font-extrabold transition-all shadow-md border border-[#E2EFE9] flex items-center justify-center gap-1.5 sm:gap-2 active:scale-95 cursor-pointer whitespace-nowrap min-w-0"
              >
                <UserCheck className="w-4 h-4 shrink-0 text-[#145C4B]" />
                <span>1-on-1 Khatabook</span>
              </button>
              <Link
                href="/groups/new"
                className="col-span-2 sm:col-span-1 h-12 px-5 sm:px-6 rounded-2xl bg-[#25D366] hover:bg-[#20b859] text-[#0E382F] text-xs font-extrabold transition-all shadow-lg shadow-[#25D366]/20 flex items-center justify-center gap-2 active:scale-95 cursor-pointer whitespace-nowrap min-w-0"
              >
                <Plus className="w-4 h-4 shrink-0 stroke-[3]" />
                <span>Create Group</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Segmented Filter Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
          <div className="relative inline-grid grid-cols-2 p-1 bg-white border border-[#E2EFE9] rounded-2xl shadow-sm overflow-hidden w-full sm:w-auto">
            {/* Sliding Active Pill Background */}
            <div
              className="absolute top-1 bottom-1 rounded-xl bg-[#145C4B] shadow-sm transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
              style={{
                width: 'calc(50% - 6px)',
                left: ledgerType === 0 ? '4px' : 'calc(50% + 2px)',
              }}
            />

            <button
              onClick={() => setLedgerType(0)}
              className={`relative z-10 px-4 py-2 rounded-xl text-xs font-bold transition-colors duration-200 flex items-center justify-center gap-2 whitespace-nowrap ${
                ledgerType === 0 ? 'text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Users className="w-4 h-4 shrink-0" />
              <span>Groups ({groupLedgers.length})</span>
            </button>

            <button
              onClick={() => setLedgerType(1)}
              className={`relative z-10 px-4 py-2 rounded-xl text-xs font-bold transition-colors duration-200 flex items-center justify-center gap-2 whitespace-nowrap ${
                ledgerType === 1 ? 'text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <UserCheck className="w-4 h-4 shrink-0" />
              <span>1-on-1 Khatabook ({directLedgers.length})</span>
            </button>
          </div>

          <div className="text-xs font-semibold text-gray-500">
            Showing {displayedGroups.length} {ledgerType === 0 ? 'group' : 'direct'} ledgers
          </div>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl text-sm font-semibold">
            {error}
          </div>
        )}

        {/* Group Cards Grid */}
        {groups === null ? (
          <GroupCardSkeleton count={4} />
        ) : displayedGroups.length === 0 ? (
          <div key={ledgerType} className="animate-tab-switch bg-white border border-[#E2EFE9] rounded-[28px] p-10 sm:p-14 text-center shadow-sm flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-[#145C4B]/10 text-[#145C4B] flex items-center justify-center mb-4">
              <Users className="w-8 h-8 stroke-[1.8]" />
            </div>
            <h3 className="font-extrabold text-xl text-gray-900 mb-1">
              No {ledgerType === 0 ? 'groups' : '1-on-1 ledgers'} found
            </h3>
            <p className="text-gray-500 text-sm max-w-sm mb-6">
              {ledgerType === 0
                ? 'Create a group ledger to start splitting trip expenses, bills, or rent with your crew.'
                : 'Keep track of personal 1-on-1 IOUs without group clutter.'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowJoinModal(true)}
                className="px-5 py-2.5 rounded-2xl bg-white border border-[#E2EFE9] text-[#145C4B] font-bold text-xs hover:bg-[#F0F7F4] transition-all"
              >
                Join via Link
              </button>
              <Link
                href="/groups/new"
                className="px-5 py-2.5 rounded-2xl bg-[#145C4B] text-white font-bold text-xs hover:bg-[#0E382F] transition-all shadow-sm"
              >
                + Create New Ledger
              </Link>
            </div>
          </div>
        ) : (
          <div key={ledgerType} className="animate-tab-switch grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayedGroups.map((g) => (
              <Link
                key={g.id}
                href={`/groups/${g.id}`}
                prefetch={true}
                onMouseEnter={() => api.prefetchGroup(g.id)}
                onTouchStart={() => api.prefetchGroup(g.id)}
                className="group bg-white border border-[#E2EFE9] rounded-[24px] p-5 shadow-sm hover:shadow-md hover:border-[#145C4B]/40 transition-all flex flex-col justify-between relative overflow-hidden cursor-pointer active:scale-[0.99]"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-[#F0F7F4] border border-[#E2EFE9] flex items-center justify-center shadow-sm text-2xl group-hover:scale-105 transition-transform">
                        <GroupIcon icon={g.icon || g.emoji} size={22} />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-base text-gray-900 group-hover:text-[#145C4B] transition-colors line-clamp-1">
                          {g.name}
                        </h4>
                        <span className="text-xs text-gray-500 font-medium flex items-center gap-1 mt-0.5">
                          <Users className="w-3.5 h-3.5 text-gray-400" />
                          <span>
                            {g.memberCount ?? (Array.isArray(g.memberIds) ? g.memberIds.length : (g.members ? Object.keys(g.members).length : 1))} members
                          </span>
                        </span>
                      </div>
                    </div>

                    {g.myRole === 'admin' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-50 text-amber-700 border border-amber-200">
                        <Shield className="w-3 h-3" />
                        Admin
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-[#E2EFE9] flex items-center justify-between">
                  <div className="inline-flex items-center gap-1 text-xs font-bold text-[#145C4B] group-hover:translate-x-0.5 transition-transform">
                    <span>Open Ledger</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>

                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      handleDeleteGroup(g);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.stopPropagation();
                        e.preventDefault();
                        handleDeleteGroup(g);
                      }
                    }}
                    className="p-1.5 rounded-xl text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors z-10 cursor-pointer"
                    title={g.myRole === 'admin' ? 'Delete Group' : 'Leave Group'}
                  >
                    {g.myRole === 'admin' ? <Trash2 className="w-4 h-4" /> : <LogOut className="w-4 h-4" />}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button for Mobile */}
      <div className="md:hidden fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom,0px))] right-4 z-40">
        <Link
          href="/groups/new"
          className="w-14 h-14 bg-[#145C4B] text-white rounded-full shadow-xl shadow-[#145C4B]/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
        >
          <Plus className="w-6 h-6 stroke-[3]" />
        </Link>
      </div>

      {/* 1-on-1 Khatabook Modal */}
      {showKhatabookModal && (
        <div className="fixed inset-0 z-50 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowKhatabookModal(false)}>
          <div className="bg-white border border-[#E2EFE9] rounded-[28px] max-w-md w-full p-6 shadow-2xl space-y-4 animate-pop-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#F0F7F4] border border-[#E2EFE9] flex items-center justify-center text-[#145C4B]">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-gray-900">Start 1-on-1 Khatabook</h3>
                  <p className="text-xs font-medium text-gray-500">Track borrowing & lending</p>
                </div>
              </div>
              <button
                onClick={() => setShowKhatabookModal(false)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-500 font-medium leading-relaxed">
              Create a direct 1-on-1 ledger with a friend. Enter their Email ID, Phone Number, or Name.
            </p>

            <form onSubmit={handleCreateKhatabookSubmit} className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-400 mb-1.5">
                  Friend's Email, Phone, or Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rahul, rahul@gmail.com, or 9876543210"
                  value={khatabookFriendInput}
                  onChange={(e) => setKhatabookFriendInput(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-[#F0F7F4] border border-[#E2EFE9] text-xs font-semibold text-gray-900 focus:outline-none focus:border-[#145C4B] focus:bg-white transition-all placeholder:text-gray-400"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-400 mb-1.5">
                  Ledger Title (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Personal IOU or Lunch Expenses"
                  value={khatabookNameInput}
                  onChange={(e) => setKhatabookNameInput(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-[#F0F7F4] border border-[#E2EFE9] text-xs font-semibold text-gray-900 focus:outline-none focus:border-[#145C4B] focus:bg-white transition-all placeholder:text-gray-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowKhatabookModal(false)}
                  className="py-3 rounded-2xl bg-gray-100 text-gray-700 text-xs font-bold hover:bg-gray-200 transition-all flex items-center justify-center min-w-0"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingKhatabook || !khatabookFriendInput.trim()}
                  className="py-3 rounded-2xl bg-[#145C4B] text-white text-xs font-bold hover:bg-[#0E382F] disabled:opacity-50 transition-all shadow-sm flex items-center justify-center gap-2 min-w-0"
                >
                  {creatingKhatabook ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Create Khatabook</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Join Group Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2EFE9] rounded-[28px] max-w-md w-full p-6 shadow-2xl space-y-4 animate-pop-in">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-lg text-gray-900">Join a Group Ledger</h3>
              <button
                onClick={() => setShowJoinModal(false)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-gray-500 font-medium leading-relaxed">
              Enter or paste an invite code or full invite link to join an existing group.
            </p>
            <form onSubmit={handleJoinByCode} className="space-y-4 pt-2">
              <div>
                <input
                  type="text"
                  placeholder="e.g. g_12345 or paste join link"
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-2xl bg-[#F0F7F4] border border-[#E2EFE9] text-sm text-gray-900 focus:outline-none focus:border-[#145C4B] focus:bg-white font-medium transition-all"
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="py-3 rounded-2xl bg-gray-100 text-gray-700 text-xs font-bold hover:bg-gray-200 transition-all flex items-center justify-center min-w-0"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={joinLoading || !joinCodeInput.trim()}
                  className="py-3 rounded-2xl bg-[#145C4B] text-white text-xs font-bold hover:bg-[#0E382F] disabled:opacity-50 transition-all shadow-sm flex items-center justify-center min-w-0"
                >
                  {joinLoading ? 'Joining...' : 'Join Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

