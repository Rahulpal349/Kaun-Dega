'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../archive/deprecated-utils/supabaseClient';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      router.push('/dashboard');
    }
  }

  if (!session) {
    return (
      <main className="min-h-screen bg-green-50 flex items-center justify-center px-6">
        <div className="bg-white rounded-2xl w-full max-w-sm p-8 shadow-sm border border-gray-100 text-center">
           <div className="w-8 h-8 border-4 border-gray-200 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
           <p className="font-medium text-sm text-ink/60">Verifying link...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-green-50 flex items-center justify-center px-6 relative overflow-hidden">
      {/* Premium Green Header Background */}
      <div className="absolute top-0 left-0 w-full h-[45%] bg-primary rounded-b-[2.5rem]">
        {/* Soft decorative elements */}
        <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute top-[20%] right-[-10%] w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 left-1/4 w-32 h-32 bg-soft-green/20 rounded-full blur-2xl"></div>
      </div>

      <div className="bg-white rounded-[2rem] w-full max-w-sm p-8 shadow-2xl shadow-gray-200/50 border border-gray-100 relative z-10 mt-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-white shadow-sm overflow-hidden border border-gray-100">
            <img src="/logo.png" alt="Kaun Dega Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="font-display font-bold text-3xl text-ink mb-1 text-center">New Password</h1>
          <p className="text-sm text-ink/60 font-medium text-center">Please enter your new password</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink/70 mb-1.5 ml-1">New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-2xl border border-gray-200 bg-green-50/50 px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium text-ink placeholder:text-ink/40"
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-red-500 text-sm font-medium text-center bg-red-50 py-2 rounded-lg border border-red-100">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-primary text-white font-semibold py-3.5 mt-2 hover:bg-primary/90 disabled:opacity-60 transition-colors shadow-lg shadow-primary/20 active:scale-[0.98]"
          >
            {loading ? 'Updating...' : 'Update password'}
          </button>
        </form>
      </div>
    </main>
  );
}

