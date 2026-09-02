'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../archive/deprecated-utils/supabaseClient';
import { api } from '../../archive/deprecated-utils/api';
import { LogOut, ArrowLeft } from 'lucide-react';

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
    <main className="min-h-screen bg-green-50 flex flex-col pb-24">
      {/* Sticky Header */}
      <header className="sticky top-0 z-30 bg-green-50/80 backdrop-blur-md border-b border-green-100/50">
        <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/dashboard')} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600">
              <ArrowLeft size={20} />
            </button>
            <h1 className="font-display font-bold text-xl text-gray-900 tracking-tight">Your Profile</h1>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-4 sm:px-6 py-8">
        {error && <p className="text-red-500 text-sm font-medium mb-4">{error}</p>}

        {profile === null ? (
          <p className="text-gray-400 text-center py-20 font-medium">Loading…</p>
        ) : (
          <div className="space-y-6">
            <div className="bg-white p-6 sm:p-8 border border-gray-100 rounded-2xl shadow-sm">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 rounded-full bg-primary/10 text-primary font-bold text-2xl flex items-center justify-center shrink-0">
                  {profile.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="font-bold text-2xl text-gray-900">{profile.name}</h2>
                  <p className="text-gray-500">{profile.email}</p>
                </div>
              </div>
              
              <div className="pt-6 border-t border-gray-100">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Member Since</label>
                <p className="text-gray-700 font-medium">
                  {new Date(profile.created_at).toLocaleDateString(undefined, {
                    month: 'long', day: 'numeric', year: 'numeric'
                  })}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-red-50 text-red-600 border border-red-100 font-semibold hover:bg-red-100 hover:border-red-200 transition-all flex items-center justify-center gap-2 shadow-sm"
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

