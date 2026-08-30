'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../archive/deprecated-utils/supabaseClient';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push('/dashboard');
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="chit rounded-sm w-full max-w-sm p-8">
        <h1 className="font-display text-2xl italic text-ink mb-1">Kaun Dega?</h1>
        <p className="text-sm text-ink/60 mb-6">Welcome back</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink/70 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-sm border border-ink/15 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink/70 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-sm border border-ink/15 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal"
            />
          </div>
          {error && <p className="text-chili text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-sm bg-marigold text-ink font-semibold py-2.5 hover:brightness-95 disabled:opacity-60"
          >
            {loading ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        <p className="text-sm text-ink/60 mt-6 text-center">
          New here?{' '}
          <Link href="/signup" className="text-teal font-medium">Create an account</Link>
        </p>
      </div>
    </main>
  );
}
