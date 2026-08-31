'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../archive/deprecated-utils/supabaseClient';

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

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setMessage('Password reset instructions have been sent to your email.');
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="bg-white rounded-2xl w-full max-w-sm p-8 shadow-sm border border-gray-100">
        <h1 className="font-display font-bold text-2xl text-ink mb-1">Reset Password</h1>
        <p className="text-sm text-ink/60 mb-6 font-medium">We'll send you a link to reset it</p>

        {message ? (
          <div className="bg-soft-green text-primary px-4 py-3 rounded-xl text-sm font-medium mb-6">
            {message}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-ink/80 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
            {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-primary text-white font-semibold py-3 hover:bg-primary/90 disabled:opacity-60 transition-colors shadow-sm"
            >
              {loading ? 'Sending...' : 'Send reset link'}
            </button>
          </form>
        )}

        <p className="text-sm text-ink/60 mt-6 text-center font-medium">
          Remember your password?{' '}
          <Link href="/login" className="text-primary hover:text-primary/80 transition-colors">Log in</Link>
        </p>
      </div>
    </main>
  );
}
