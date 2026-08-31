'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../archive/deprecated-utils/supabaseClient';
import { api } from '../../archive/deprecated-utils/api';
import { Plus, Trash2, ChevronRight, Users } from 'lucide-react';

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
    <main className="min-h-screen bg-gray-50 flex flex-col pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 h-16 flex items-center justify-between">
          <h1 className="font-display font-bold text-xl text-gray-900 tracking-tight">Your Groups</h1>
          <Link href="/groups/new" className="bg-[#145C4B] text-white px-4 py-2 rounded-xl font-semibold text-sm flex items-center gap-1.5 hover:bg-[#145C4B]/90 transition-colors shadow-sm">
            <Plus size={16} /> New
          </Link>
        </div>
      </header>

      <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-4 sm:px-6 py-6">
        {error && <p className="text-red-500 text-sm font-medium mb-4">{error}</p>}

        {groups === null ? (
          <p className="text-gray-400 text-center py-20 font-medium">Loading…</p>
        ) : groups.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-[#e6f4ed] text-[#145C4B] rounded-full flex items-center justify-center mb-4">
              <Users size={32} />
            </div>
            <p className="text-gray-500 mb-4 font-medium">You aren't in any groups yet.</p>
            <Link href="/groups/new" className="bg-[#145C4B] text-white font-semibold px-6 py-2.5 rounded-full hover:bg-[#145C4B]/90 transition-colors shadow-sm inline-flex items-center gap-2">
              <Plus size={18} /> Create Group
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {groups.map((g) => (
              <Link key={g.id} href={`/groups/${g.id}`} className="block group">
                <div className="bg-white border border-gray-100 rounded-2xl p-5 flex items-center justify-between shadow-sm hover:shadow-md hover:border-gray-200 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-2xl shadow-sm">
                      {g.emoji}
                    </div>
                    <div>
                      <h4 className="font-bold text-lg text-gray-900 group-hover:text-[#145C4B] transition-colors">
                        {g.name}
                      </h4>
                      <p className="text-xs text-gray-400 font-medium flex items-center gap-1 mt-0.5">
                        <Users size={12} /> Tap to view details
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={async (e) => {
                        e.preventDefault();
                        if (confirm('Remove this ledger from your dashboard?')) {
                          try {
                            await api.deleteGroup(g.id);
                            setGroups(groups.filter(group => group.id !== g.id));
                          } catch (err) {
                            alert('Failed to delete: ' + err.message);
                          }
                        }
                      }}
                      className="w-10 h-10 rounded-full hover:bg-red-50 flex items-center justify-center text-gray-300 hover:text-red-500 transition-colors z-10"
                      title="Delete Group"
                    >
                      <Trash2 size={18} />
                    </button>
                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-[#e6f4ed] group-hover:text-[#145C4B] transition-colors">
                      <ChevronRight size={18} />
                    </div>
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
