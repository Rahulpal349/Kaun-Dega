'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { api } from '../../lib/firebaseApi';
import GroupIcon from '../../components/GroupIcon';
import TopHeader from '../../components/TopHeader';
import { TransactionSkeleton } from '../../components/Skeleton';
import { ArrowLeft, Activity, Filter, Receipt } from 'lucide-react';

export default function HistoryPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [history, setHistory] = useState(null);
  const [selectedGroupId, setSelectedGroupId] = useState('all');
  const [error, setError] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }
      setCurrentUser(user);
      try {
        const [prof, data] = await Promise.all([
          api.getProfile(user.uid).catch(() => null),
          api.getAllHistory()
        ]);
        if (prof) setUserProfile(prof);
        setHistory(data);
      } catch (err) {
        setError(err.message || 'Failed to load activity feed');
      }
    });

    return () => unsubscribe();
  }, [router]);

  const filteredHistory = history
    ? selectedGroupId === 'all'
      ? history
      : history.filter((e) => e.groupId === selectedGroupId)
    : [];

  return (
    <div className="flex-1 flex flex-col w-full bg-[#F4FBF7] min-h-screen">
      <TopHeader title="Activity Timeline" userName={userProfile?.name || currentUser?.displayName || currentUser?.email} />

      <div className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-extrabold text-2xl text-gray-900 tracking-tight">Recent Activity</h2>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Chronological log of all transactions and split expenses across ledgers
            </p>
          </div>

          {history && history.length > 0 && (
            <div className="flex items-center gap-2 bg-white border border-[#E2EFE9] px-3 py-1.5 rounded-2xl shadow-xs">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                className="bg-transparent text-xs font-bold text-gray-800 focus:outline-none cursor-pointer"
              >
                <option value="all">All Groups</option>
                {Array.from(new Map(history.map((e) => [e.groupId, { id: e.groupId, name: e.group?.name }])).values())
                  .filter((g) => g?.id)
                  .map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
              </select>
            </div>
          )}
        </div>

        {error && <p className="bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold p-4 rounded-2xl">{error}</p>}

        {history === null ? (
          <TransactionSkeleton count={5} />
        ) : filteredHistory.length === 0 ? (
          <div className="bg-white border border-[#E2EFE9] rounded-[28px] p-12 text-center shadow-sm flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-[#145C4B]/10 text-[#145C4B] flex items-center justify-center mb-4">
              <Activity className="w-8 h-8 stroke-[1.8]" />
            </div>
            <h3 className="font-extrabold text-xl text-gray-900 mb-1">No transactions found</h3>
            <p className="text-gray-500 text-sm max-w-sm">
              Expenses and settlements will automatically appear in your timeline as you log them.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredHistory.map((expense) => {
              const date = new Date(expense.created_at || new Date());
              const dateStr = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
              return (
                <div
                  key={expense.id}
                  className="bg-white border border-[#E2EFE9] rounded-[24px] p-4 sm:p-5 shadow-xs hover:shadow-md hover:border-[#145C4B]/30 transition-all flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-[#F0F7F4] border border-[#E2EFE9] flex items-center justify-center text-[#145C4B] text-xl shrink-0">
                      <GroupIcon icon={expense.group?.icon || expense.group?.emoji} size={20} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-base text-gray-900 truncate leading-tight">
                        {expense.description}
                      </h4>
                      <p className="text-xs text-gray-500 font-medium mt-0.5 truncate">
                        Paid by <span className="font-bold text-gray-700">{expense.payer?.name || 'Member'}</span> in{' '}
                        <span className="font-bold text-[#145C4B]">{expense.group?.name || 'Group'}</span> · {dateStr}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-extrabold text-base text-[#145C4B]">
                      ₹{Number(expense.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

