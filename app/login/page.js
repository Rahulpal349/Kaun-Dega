'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth } from '../../lib/firebase';
import { onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { api } from '../../lib/firebaseApi';
import { Shield, Sparkles, ArrowRight, Zap, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
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
    return (
      <main className="min-h-screen bg-[#0E382F] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-emerald-400/20 border-t-emerald-400 rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-emerald-100/70">Connecting to Kaun Dega...</p>
        </div>
      </main>
    );
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
      setError(err.message || 'Google sign in failed. Please try again.');
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0F3E34] via-[#145C4B] to-[#0A2E26] flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden font-body selection:bg-emerald-300 selection:text-[#0E382F]">
      {/* Dynamic Background Glows */}
      <div className="absolute top-[-20%] left-[-15%] w-[500px] h-[500px] bg-emerald-400/15 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-15%] w-[500px] h-[500px] bg-teal-300/10 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg h-[400px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Main Glassmorphic Auth Card */}
      <div className="w-full max-w-[420px] bg-white rounded-[2.5rem] p-7 sm:p-10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.35)] border border-white/80 relative z-10 my-auto">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-50 to-emerald-100 flex items-center justify-center mb-4 p-1 shadow-sm border border-emerald-100">
            <img 
              src="/logo.png" 
              alt="Kaun Dega Logo" 
              className="w-full h-full object-cover rounded-full"
            />
          </div>
          <h1 className="font-display font-bold text-3xl sm:text-4xl text-gray-900 tracking-tight mb-2">
            Kaun Dega?
          </h1>
          <p className="text-sm sm:text-[15px] text-gray-500 font-medium max-w-[280px]">
            Split bills and settle debts with friends in seconds.
          </p>
        </div>

        {/* Feature Badges */}
        <div className="bg-emerald-50/70 border border-emerald-100/80 rounded-2xl p-4 mb-7 space-y-2.5">
          <div className="flex items-center gap-3 text-xs font-semibold text-gray-700">
            <div className="w-5 h-5 rounded-full bg-[#145C4B] text-white flex items-center justify-center shrink-0">
              <Zap size={11} strokeWidth={2.5} />
            </div>
            <span>Instant access with your Google account</span>
          </div>
          <div className="flex items-center gap-3 text-xs font-semibold text-gray-700">
            <div className="w-5 h-5 rounded-full bg-[#145C4B] text-white flex items-center justify-center shrink-0">
              <CheckCircle2 size={11} strokeWidth={2.5} />
            </div>
            <span>No passwords or tedious signup forms</span>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200/80 text-red-600 px-4 py-3 rounded-xl text-xs font-medium mb-6 text-center leading-relaxed">
            {error}
          </div>
        )}

        {/* Google Sign-in Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full relative flex items-center justify-center gap-3.5 rounded-2xl bg-white border border-gray-300 text-gray-800 font-semibold py-4 px-6 hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 active:scale-[0.98] transition-all shadow-sm disabled:opacity-60 group cursor-pointer"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          )}
          <span className="text-[15px] font-semibold text-gray-800">
            {loading ? 'Authenticating...' : 'Continue with Google'}
          </span>
          {!loading && (
            <ArrowRight size={16} className="text-gray-400 group-hover:text-gray-600 group-hover:translate-x-0.5 transition-all ml-auto" />
          )}
        </button>

        {/* Legal Links Footer */}
        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400 leading-relaxed">
            By signing in, you agree to our{' '}
            <Link 
              href="/terms" 
              className="text-[#145C4B] font-semibold hover:underline underline-offset-2 decoration-emerald-600/40"
            >
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link 
              href="/privacy" 
              className="text-[#145C4B] font-semibold hover:underline underline-offset-2 decoration-emerald-600/40"
            >
              Privacy Policy
            </Link>.
          </p>
        </div>

      </div>

      {/* Safe Area & Bottom note */}
      <footer className="mt-6 text-center text-xs text-white/50 relative z-10">
        &copy; {new Date().getFullYear()} Kaun Dega? All rights reserved.
      </footer>
    </main>
  );
}
