'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import { api } from '../../lib/api';
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
    <main className="min-h-screen bg-dotted flex flex-col pb-24">
      <TopHeader />

      <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-6 py-10">
        <div className="mb-12">
          <h2 className="font-display text-2xl text-ink font-medium">History</h2>
          <p className="font-display italic text-ink/70">A global timeline of your expenses.</p>
        </div>

        {error && <p className="text-chili text-sm mb-4">{error}</p>}

        {history === null ? (
          <p className="text-ink/50 text-center py-20">Loading…</p>
        ) : history.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center -mt-10">
            <p className="text-ink/60 mb-4 font-body">No expenses found.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {history.map((expense) => (
              <div key={expense.id} className="bg-white border border-ink/10 rounded-lg p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-ink/5 flex items-center justify-center text-xl shrink-0">
                    {expense.group?.emoji || '🧾'}
                  </div>
                  <div>
                    <h3 className="font-display text-lg text-ink font-semibold">{expense.description}</h3>
                    <p className="text-sm text-ink/60 font-medium">
                      Paid by <span className="text-ink">{expense.payer?.name}</span> in {expense.group?.name}
                    </p>
                    <p className="text-xs text-ink/40 mt-1">
                      {new Date(expense.created_at).toLocaleDateString(undefined, {
                        month: 'short', day: 'numeric', year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <p className="font-mono text-xl font-bold text-teal">₹{expense.amount.toFixed(2)}</p>
                  <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-ink/40">Total Amount</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
