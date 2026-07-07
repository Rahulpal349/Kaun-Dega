'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';
import { api } from '../../lib/api';
import TopHeader from '../../components/TopHeader';
import { LogOut } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      try {
        setProfile(await api.getProfile());
      } catch (err) {
        setError(err.message);
      }
    })();
  }, [router]);

  async function handleLogout() {
    try {
      await api.logout();
      router.push('/login');
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <main className="min-h-screen bg-dotted flex flex-col pb-24">
      <TopHeader />

      <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-6 py-10">
        <div className="mb-12">
          <h2 className="font-display text-2xl text-ink font-medium">Your Profile</h2>
          <p className="font-display italic text-ink/70">Account settings and details.</p>
        </div>

        {error && <p className="text-chili text-sm mb-4">{error}</p>}

        {profile === null ? (
          <p className="text-ink/50 text-center py-20">Loading…</p>
        ) : (
          <div className="space-y-8">
            <div className="bg-ruled p-8 border border-ink/10 rounded-xl shadow-sm">
              <div className="mb-6">
                <label className="block font-mono text-[10px] font-bold uppercase tracking-widest text-teal mb-1">Name</label>
                <p className="font-display text-xl text-ink font-medium">{profile.name}</p>
              </div>
              <div className="mb-6">
                <label className="block font-mono text-[10px] font-bold uppercase tracking-widest text-teal mb-1">Email</label>
                <p className="font-body text-lg text-ink/80">{profile.email}</p>
              </div>
              <div>
                <label className="block font-mono text-[10px] font-bold uppercase tracking-widest text-teal mb-1">Joined</label>
                <p className="font-body text-ink/60">
                  {new Date(profile.created_at).toLocaleDateString(undefined, {
                    month: 'long', day: 'numeric', year: 'numeric'
                  })}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full sm:w-auto px-6 py-4 rounded-lg bg-chili/10 text-chili border border-chili/20 font-mono text-sm font-bold uppercase tracking-widest hover:bg-chili hover:text-white transition-all flex items-center justify-center gap-3"
            >
              <LogOut size={18} />
              Sign Out
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
