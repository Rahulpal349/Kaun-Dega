'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../archive/deprecated-utils/supabaseClient';
import { api } from '../../archive/deprecated-utils/api';
import TopHeader from '../../components/TopHeader';
import { Plus, PenLine, Trash2 } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [groups, setGroups] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      try {
        setGroups(await api.getGroups());
      } catch (err) {
        setError(err.message);
      }
    })();
  }, [router]);

  return (
    <main className="min-h-screen bg-dotted flex flex-col">
      <TopHeader />

      <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-6 py-10 relative">
        <div className="mb-16">
          <h2 className="font-display text-2xl text-ink font-medium">Active Chits</h2>
          <p className="font-display italic text-ink/70">The running ledger of who owes what.</p>
        </div>

        {error && <p className="text-chili text-sm mb-4">{error}</p>}

        {groups === null ? (
          <p className="text-ink/50 text-center py-20">Loading…</p>
        ) : groups.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center -mt-20">
            {/* Visual representation of empty chits */}
            <div className="flex flex-col items-center justify-center opacity-40 mb-10 pointer-events-none">
              <div className="w-[280px] h-12 bg-white border border-ink/20 shadow-sm relative chit rotate-1 translate-y-4"></div>
              <div className="w-[320px] h-12 bg-white border border-ink/20 shadow-sm relative chit -rotate-1 z-10"></div>
              <div className="w-[300px] h-12 bg-white border border-ink/20 shadow-sm relative chit rotate-2 -translate-y-4 z-20"></div>
            </div>
            
            <Link href="/groups/new" className="flex items-center gap-2 text-ink/60 hover:text-ink font-mono text-xs uppercase tracking-widest font-semibold border-b border-ink/20 hover:border-ink pb-1 transition-colors">
              <Plus size={16} /> Start a new ledger chit
            </Link>
          </div>
        ) : (
          <div className="space-y-4 mb-32">
            {groups.map((g) => (
              <Link key={g.id} href={`/groups/${g.id}`} className="block transform hover:-translate-y-1 transition-transform">
                <div className="chit rounded-sm px-6 py-5 flex items-center justify-between shadow-[0_4px_12px_rgba(11,43,38,0.05)]">
                  <span className="font-display text-xl text-ink">
                    <span className="mr-3 opacity-80">{g.emoji}</span>
                    {g.name}
                  </span>
                  <div className="flex items-center gap-4 text-right">
                    <p className="font-mono font-bold text-ink">View →</p>
                    <button
                      onClick={async (e) => {
                        e.preventDefault();
                        if (confirm('Delete this ledger?')) {
                          try {
                            await api.deleteGroup(g.id);
                            setGroups(groups.filter(group => group.id !== g.id));
                          } catch (err) {
                            alert('Failed to delete: ' + err.message);
                          }
                        }
                      }}
                      className="p-2 hover:bg-chili/10 rounded-full transition-colors text-ink/30 hover:text-chili"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Banner */}
      <div className="fixed bottom-20 left-0 right-0 max-w-3xl mx-auto px-6 pointer-events-none">
        <div className="bg-marigold text-ink shadow-[0_-10px_40px_rgba(242,169,59,0.3)] border-t-2 border-x-2 border-ink p-5 rounded-t-lg flex justify-between items-center pointer-events-auto">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-widest mb-1 opacity-80">Net Balance</p>
            <p className="font-display font-bold text-lg">Consolidated Ledger</p>
          </div>
          <div className="text-right pr-20">
             <p className="font-mono font-bold text-xl">₹0.00</p>
             <p className="font-mono text-[9px] font-bold uppercase tracking-widest opacity-60">Settled</p>
          </div>
        </div>
        
        {/* Floating Action Button overlapping the banner */}
        <Link href="/groups/new" className="absolute right-12 bottom-6 pointer-events-auto">
          <button className="w-14 h-14 bg-marigold border-2 border-ink rounded-xl shadow-[4px_4px_0px_rgba(11,43,38,1)] flex items-center justify-center hover:brightness-95 active:translate-y-1 active:translate-x-1 active:shadow-[0px_0px_0px_rgba(11,43,38,1)] transition-all">
            <PenLine size={24} strokeWidth={2.5} className="text-ink" />
          </button>
        </Link>
      </div>
    </main>
  );
}
