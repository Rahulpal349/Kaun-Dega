'use client';

import { useState } from 'react';
import Link from 'next/link';
import { auth } from '../../lib/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setLoading(false);
      setMessage('Password reset instructions have been sent to your email.');
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Failed to send reset email');
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

      <div className="bg-white rounded-[2rem] w-full max-w-sm p-8 shadow-2xl shadow-gray-200/50 border border-gray-100 relative z-10 mt-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-white shadow-sm overflow-hidden border border-gray-100">
            <img src="/logo.png" alt="Kaun Dega Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="font-display font-bold text-3xl text-ink mb-1 text-center">Reset Password</h1>
          <p className="text-sm text-ink/60 font-medium text-center">We'll send you a link to reset it</p>
        </div>

        {message ? (
          <div className="bg-soft-green/30 border border-primary/20 rounded-2xl p-6 text-center mb-4">
            <p className="text-ink text-sm font-medium">
              {message}
            </p>
          </div>
        ) : (
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
            {error && <p className="text-red-500 text-sm font-medium text-center bg-red-50 py-2 rounded-lg border border-red-100">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-primary text-white font-semibold py-3.5 mt-2 hover:bg-primary/90 disabled:opacity-60 transition-colors shadow-lg shadow-primary/20 active:scale-[0.98]"
            >
              {loading ? 'Sending...' : 'Send reset link'}
            </button>
          </form>
        )}

        <p className="text-sm text-ink/60 mt-8 text-center font-medium">
          Remember your password?{' '}
          <Link href="/login" className="text-primary font-bold hover:underline underline-offset-4 decoration-primary/30">Log in</Link>
        </p>
      </div>
    </main>
  );
}
