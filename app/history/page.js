'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../archive/deprecated-utils/supabaseClient';
import { api } from '../../archive/deprecated-utils/api';
import TopHeader from '../../components/TopHeader';

export default function HistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      try {
        setHistory(await api.getAllHistory());
      } catch (err) {
        setError(err.message);
      }
    })();
  }, [router]);

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col pb-24">
      {/* Sticky Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/dashboard')} className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <h1 className="font-display font-bold text-xl text-gray-900 tracking-tight">History</h1>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-4 sm:px-6 py-8">
        <div className="mb-8">
          <p className="text-gray-500 font-medium">A global timeline of your expenses.</p>
        </div>

        {error && <p className="text-red-500 text-sm font-medium mb-4">{error}</p>}

        {history === null ? (
          <p className="text-gray-400 text-center py-20 font-medium">Loading…</p>
        ) : history.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center -mt-10">
            <p className="text-gray-500 mb-4 font-medium">No expenses found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((expense) => (
              <div key={expense.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-shadow hover:shadow-md">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-xl shrink-0">
                    {expense.group?.emoji || '🧾'}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">{expense.description}</h3>
                    <p className="text-sm text-gray-500 font-medium">
                      Paid by <span className="text-gray-700 font-semibold">{expense.payer?.name}</span> in {expense.group?.name}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(expense.created_at).toLocaleDateString(undefined, {
                        month: 'short', day: 'numeric', year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <p className="font-bold text-xl text-gray-900">₹{expense.amount.toFixed(2)}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-1">Total Amount</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
