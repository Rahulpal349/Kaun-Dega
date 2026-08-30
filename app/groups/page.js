'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../archive/deprecated-utils/supabaseClient';
import { api } from '../../archive/deprecated-utils/api';
import TopHeader from '../../components/TopHeader';
import { Plus, Trash2 } from 'lucide-react';

export default function GroupsPage() {
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
    <main className="min-h-screen bg-dotted flex flex-col pb-24">
      <TopHeader />

      <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-6 py-10">
        <div className="mb-12 flex justify-between items-end">
          <div>
            <h2 className="font-display text-2xl text-ink font-medium">Your Groups</h2>
            <p className="font-display italic text-ink/70">Manage your ledgers.</p>
          </div>
          <Link href="/groups/new">
            <button className="bg-teal text-paper px-4 py-2 rounded-full font-mono text-xs font-bold uppercase tracking-widest hover:brightness-110 flex items-center gap-2">
              <Plus size={16} /> New Group
            </button>
          </Link>
        </div>

        {error && <p className="text-chili text-sm mb-4">{error}</p>}

        {groups === null ? (
          <p className="text-ink/50 text-center py-20">Loading…</p>
        ) : groups.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center -mt-10">
            <p className="text-ink/60 mb-4 font-body">You aren't in any groups yet.</p>
            <Link href="/groups/new" className="text-teal font-mono text-xs font-bold uppercase tracking-widest border-b border-teal pb-1 hover:brightness-110">
              Create one now
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
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
    </main>
  );
}
