'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../archive/deprecated-utils/supabaseClient';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Redirect if already logged in
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const pendingCode = localStorage.getItem('pending_invite_code');
        if (pendingCode) {
          localStorage.removeItem('pending_invite_code');
          router.replace(`/join/${pendingCode}`);
        } else {
          router.replace('/dashboard');
        }
      } else {
        setCheckingAuth(false);
      }
    })();
  }, [router]);

  if (checkingAuth) {
    return <main className="min-h-screen bg-green-50 flex items-center justify-center text-gray-400">Loading...</main>;
  }

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

    // Check if user came from an invite link
    const pendingCode = localStorage.getItem('pending_invite_code');
    if (pendingCode) {
      localStorage.removeItem('pending_invite_code');
      router.push(`/join/${pendingCode}`);
    } else {
      router.push('/dashboard');
    }
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

      <div className="bg-white rounded-[2rem] w-full max-w-sm p-8 shadow-2xl shadow-gray-200/50 border border-gray-100 relative z-10 mt-12">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-white shadow-sm overflow-hidden border border-gray-100">
            <img src="/logo.png" alt="Kaun Dega Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="font-display font-bold text-3xl text-ink mb-1 text-center">Kaun Dega?</h1>
          <p className="text-sm text-ink/60 font-medium text-center">Welcome back</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink/70 mb-1.5 ml-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-2xl border border-gray-200 bg-green-50/50 px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium text-ink placeholder:text-ink/40"
              placeholder="you@example.com"
            />
          </div>
          <div className="relative">
            <div className="flex items-center justify-between mb-1.5 ml-1">
               <label className="block text-sm font-medium text-ink/70">Password</label>
               <Link href="/forgot-password" className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors">
                 Forgot?
               </Link>
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-2xl border border-gray-200 bg-green-50/50 px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium text-ink placeholder:text-ink/40"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-[38px] text-ink/40 hover:text-ink/70 transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {error && <p className="text-red-500 text-sm font-medium text-center bg-red-50 py-2 rounded-lg border border-red-100">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-primary text-white font-semibold py-3.5 mt-2 hover:bg-primary/90 disabled:opacity-60 transition-colors shadow-lg shadow-primary/20 active:scale-[0.98]"
          >
            {loading ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        <p className="text-sm text-ink/60 mt-8 text-center font-medium">
          New here?{' '}
          <Link href="/signup" className="text-primary font-bold hover:underline underline-offset-4 decoration-primary/30">Create an account</Link>
        </p>
      </div>
    </main>
  );
}

