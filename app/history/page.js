'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../archive/deprecated-utils/supabaseClient';
import { api } from '../../archive/deprecated-utils/api';
import { ArrowLeft } from 'lucide-react';

export default function HistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        await api.currentUserId();
        setHistory(await api.getAllHistory());
      } catch (err) {
        if (err.message === 'Not logged in') {
          router.push('/login');
        } else {
          setError(err.message);
        }
      }
    })();
  }, [router]);

  return (
    <main className="min-h-screen bg-green-50 flex flex-col pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-green-50/80 backdrop-blur-md border-b border-green-100/50">
        <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 h-16 flex items-center gap-3">
          <button onClick={() => router.push('/dashboard')} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-display font-bold text-xl text-gray-900 tracking-tight">Activity</h1>
        </div>
      </header>

      <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-4 sm:px-6 py-6">
        <p className="text-gray-400 font-medium text-sm mb-6">A timeline of all your expenses across groups.</p>

        {error && <p className="text-red-500 text-sm font-medium mb-4">{error}</p>}

        {history === null ? (
          <p className="text-gray-400 text-center py-20 font-medium">Loading…</p>
        ) : history.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center -mt-10">
            <p className="text-gray-500 mb-4 font-medium">No expenses found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((expense) => (
              <div key={expense.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-full bg-[#e6f4ed] flex items-center justify-center text-lg shrink-0">
                    {expense.group?.emoji || '🧾'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-[14px] text-gray-900 truncate">{expense.description}</h3>
                    <p className="text-[12px] text-gray-400 font-medium truncate">
                      {expense.payer?.name} · {expense.group?.name} · {new Date(expense.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                    </p>
                  </div>
                </div>
                <span className="font-bold text-[15px] text-gray-900 flex-shrink-0 whitespace-nowrap">
                  ₹{Number(expense.amount).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

