'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LandingHeader from '../components/LandingHeader';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Play, Receipt, Users, ArrowRightLeft, ShieldCheck, Sparkles, Smartphone, CheckCircle, ArrowRight, Wallet } from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.replace('/dashboard');
      } else {
        setReady(true);
      }
    });
    return () => unsubscribe();
  }, [router]);

  if (!ready) {
    return (
      <div className="w-full min-h-screen bg-[#F4FBF7] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#145C4B]/20 border-t-[#145C4B] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F4FBF7] overflow-x-hidden">
      <LandingHeader />

      {/* Hero Section */}
      <section className="w-full max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-12 lg:py-20 flex flex-col lg:flex-row items-center gap-12">
        {/* Left Content */}
        <div className="w-full lg:w-1/2 flex flex-col items-start space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#145C4B]/10 text-[#145C4B] text-xs font-bold border border-[#E2EFE9]">
            <Sparkles className="w-4 h-4 text-[#25D366]" />
            <span>Smart Expense Ledger & Settle Up</span>
          </div>

          <h1 className="font-extrabold text-4xl sm:text-5xl lg:text-6xl text-gray-900 leading-[1.1] tracking-tight">
            Track expenses.<br />
            Split fair.<br />
            <span className="text-[#145C4B]">Settle over WhatsApp.</span>
          </h1>
          
          <p className="text-base sm:text-lg text-gray-600 font-medium max-w-lg leading-relaxed">
            Kaun Dega helps you split trip bills, flatmate rent, and group dinners in seconds without awkward math or manual reminders.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto pt-2">
            <Link
              href="/signup"
              className="px-8 py-4 rounded-2xl bg-[#145C4B] hover:bg-[#0E382F] text-white font-extrabold text-sm transition-all shadow-lg shadow-[#145C4B]/25 flex items-center justify-center gap-2 active:scale-95"
            >
              <span>Get Started — It's Free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="#how-it-works"
              className="px-6 py-4 rounded-2xl bg-white border border-[#E2EFE9] text-gray-800 font-bold text-sm hover:bg-[#F0F7F4] transition-all flex items-center justify-center gap-2"
            >
              <span>See How It Works</span>
              <Play className="w-4 h-4 text-[#145C4B] fill-[#145C4B]" />
            </Link>
          </div>

          <div className="pt-4 flex items-center gap-6 text-xs text-gray-500 font-semibold">
            <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-[#0D9488]" /> 1-Tap Google Login</span>
            <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-[#0D9488]" /> Auto UPI Deep Link</span>
          </div>
        </div>

        {/* Right Content / App Card Visual */}
        <div className="w-full lg:w-1/2 flex justify-center">
          <div className="relative w-full max-w-md bg-white border border-[#E2EFE9] rounded-[32px] p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#145C4B] text-white flex items-center justify-center font-bold">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-gray-900">Manali Trip 🏔️</h3>
                  <p className="text-xs text-gray-500 font-medium">4 members · 12 expenses</p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-[#E6F4ED] text-[#0D9488] font-bold text-xs">Active</span>
            </div>

            <div className="bg-[#F0F7F4] rounded-2xl p-4 border border-[#E2EFE9] space-y-2">
              <span className="text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">Your Position</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-extrabold text-[#0D9488]">+₹1,450</span>
                <span className="text-xs font-bold text-[#0D9488] bg-[#E6F4ED] px-2.5 py-0.5 rounded-full">You get back</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 border border-gray-100 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#145C4B]/10 text-[#145C4B] font-bold flex items-center justify-center">R</div>
                  <span className="font-bold text-gray-800">Rahul pays You</span>
                </div>
                <span className="font-extrabold text-[#145C4B]">₹850.00</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 border border-gray-100 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#145C4B]/10 text-[#145C4B] font-bold flex items-center justify-center">A</div>
                  <span className="font-bold text-gray-800">Aman pays You</span>
                </div>
                <span className="font-extrabold text-[#145C4B]">₹600.00</span>
              </div>
            </div>

            <div className="pt-2">
              <div className="w-full py-3 rounded-2xl bg-[#25D366] text-[#0E382F] font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm">
                <span>Remind Group on WhatsApp</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Kaun Dega? Section */}
      <section id="features" className="w-full max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-20 border-t border-[#E2EFE9]">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-2">
          <h2 className="font-extrabold text-3xl sm:text-4xl text-gray-900">Why Kaun Dega?</h2>
          <p className="text-sm text-gray-500 font-medium">Built for roommates, trip groups, and friends who want zero hassle.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white border border-[#E2EFE9] rounded-[24px] p-6 shadow-sm hover:shadow-md transition-all space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#F0F7F4] text-[#145C4B] flex items-center justify-center">
              <Receipt className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-lg text-gray-900">Instant Expense Log</h3>
            <p className="text-xs text-gray-500 leading-relaxed font-medium">Add bills on the fly with custom splits, percentages, or equal shares.</p>
          </div>

          <div className="bg-white border border-[#E2EFE9] rounded-[24px] p-6 shadow-sm hover:shadow-md transition-all space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#F0F7F4] text-[#145C4B] flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-lg text-gray-900">1-on-1 Khatabook</h3>
            <p className="text-xs text-gray-500 leading-relaxed font-medium">Keep private personal ledgers with friends without creating heavy groups.</p>
          </div>

          <div className="bg-white border border-[#E2EFE9] rounded-[24px] p-6 shadow-sm hover:shadow-md transition-all space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#F0F7F4] text-[#145C4B] flex items-center justify-center">
              <ArrowRightLeft className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-lg text-gray-900">Smart Settle Path</h3>
            <p className="text-xs text-gray-500 leading-relaxed font-medium">Algorithm minimizes total transactions required to get everyone settled.</p>
          </div>

          <div className="bg-white border border-[#E2EFE9] rounded-[24px] p-6 shadow-sm hover:shadow-md transition-all space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#F0F7F4] text-[#145C4B] flex items-center justify-center">
              <Smartphone className="w-6 h-6" />
            </div>
            <h3 className="font-extrabold text-lg text-gray-900">WhatsApp & UPI Integration</h3>
            <p className="text-xs text-gray-500 leading-relaxed font-medium">Deep-link straight into GPay/PhonePe and share settlement links via WhatsApp.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full bg-white border-t border-[#E2EFE9] py-10 px-6 lg:px-12 flex flex-col md:flex-row items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#145C4B] text-white font-extrabold flex items-center justify-center text-sm">
            KD
          </div>
          <span className="font-extrabold text-lg text-gray-900">Kaun Dega?</span>
        </Link>

        <nav className="flex flex-wrap items-center justify-center gap-6 text-xs font-bold text-gray-600">
          <Link href="/privacy" className="hover:text-[#145C4B] transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-[#145C4B] transition-colors">Terms of Use</Link>
        </nav>

        <p className="text-xs text-gray-400 font-medium">
          &copy; {new Date().getFullYear()} Kaun Dega? All rights reserved.
        </p>
      </footer>
    </div>
  );
}


