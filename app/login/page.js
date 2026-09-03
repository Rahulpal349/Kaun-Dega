'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth } from '../../lib/firebase';
import { signInWithEmailAndPassword, onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { api } from '../../lib/firebaseApi';
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
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
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
    });
    
    return () => unsubscribe();
  }, [router]);

  if (checkingAuth) {
    return <main className="min-h-screen bg-green-50 flex items-center justify-center text-gray-400">Loading...</main>;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      await api.ensureUserProfile(result.user);
      setLoading(false);
      
      const pendingCode = localStorage.getItem('pending_invite_code');
      if (pendingCode) {
        localStorage.removeItem('pending_invite_code');
        router.push(`/join/${pendingCode}`);
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Login failed');
    }
  }

  async function handleGoogleLogin() {
    setError('');
    setLoading(true);
    const provider = new GoogleAuthProvider();
    
    try {
      const result = await signInWithPopup(auth, provider);
      await api.ensureUserProfile(result.user);
      setLoading(false);
      
      const pendingCode = localStorage.getItem('pending_invite_code');
      if (pendingCode) {
        localStorage.removeItem('pending_invite_code');
        router.push(`/join/${pendingCode}`);
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Google sign in failed');
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

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink-0 mx-4 text-ink/40 text-sm font-medium">Or</span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-white border border-gray-200 text-ink font-semibold py-3.5 hover:bg-gray-50 disabled:opacity-60 transition-colors shadow-sm active:scale-[0.98]"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
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
