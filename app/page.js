'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import LandingHeader from '../components/LandingHeader';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Play, Receipt, Users, ArrowRightLeft, ShieldCheck } from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  // If user is already logged in, go straight to dashboard
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
    return <main className="min-h-screen bg-white flex items-center justify-center text-gray-400">Loading...</main>;
  }

  return (
    <main className="min-h-screen flex flex-col bg-green-50 overflow-x-hidden">
      <LandingHeader />

      {/* Hero Section */}
      <section className="w-full max-w-7xl mx-auto px-4 md:px-8 lg:px-16 py-12 lg:py-20 flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
        {/* Left Content */}
        <div className="w-full lg:w-1/2 flex flex-col items-start">
          <h1 className="font-display font-bold text-4xl md:text-5xl lg:text-7xl text-ink leading-[1.1] tracking-tight mb-5 md:mb-6">
            Track expenses.<br />
            Split bills.<br />
            <span className="text-primary">Stay stress-free.</span>
          </h1>
          
          <p className="font-body text-base md:text-lg text-ink/70 mb-8 md:mb-10 max-w-lg leading-relaxed">
            Kaun Dega helps you split expenses with friends, trips, flatmates or groups in just a few taps.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 mb-10 md:mb-12 w-full sm:w-auto">
            <Link
              href="/signup"
              className="w-full sm:w-auto bg-primary text-white font-semibold px-6 py-3.5 md:px-8 md:py-3.5 rounded-full hover:bg-primary/90 transition-colors shadow-lg text-center"
            >
              Get Started – It's Free
            </Link>
            <Link
              href="#how-it-works"
              className="w-full sm:w-auto flex items-center justify-center gap-2 border-2 border-ink/20 text-ink font-semibold px-6 py-3.5 md:px-8 md:py-3.5 rounded-full hover:bg-ink/5 transition-colors"
            >
              See How It Works <Play size={18} fill="currentColor" />
            </Link>
          </div>
        </div>

        {/* Right Content / Illustration */}
        <div className="w-full lg:w-1/2 relative flex justify-center">
          <img src="/hero_illustration.jpg" alt="Kaun Dega App Illustration" className="w-full max-w-lg object-contain drop-shadow-2xl rounded-2xl" />
        </div>
      </section>

      {/* Why Kaun Dega? Section */}
      <section id="features" className="w-full max-w-7xl mx-auto px-4 md:px-8 lg:px-16 py-24 border-t border-gray-100">
        <h2 className="font-display font-bold text-3xl md:text-4xl text-center text-ink mb-12 md:mb-16">Why Kaun Dega?</h2>
        
        <div className="relative">
          {/* Roadmap connecting lines (Visible only on lg desktop: 4 columns) */}
          <div className="hidden lg:block absolute top-10 left-[12%] right-[12%] h-0.5 border-t-2 border-dashed border-primary/20 z-0"></div>
          
          {/* Roadmap connecting lines (Mobile & tablet: 2x2 grid) */}
          <div className="block lg:hidden absolute top-8 left-[25%] right-[25%] h-0.5 border-t-2 border-dashed border-primary/20 z-0"></div>
          <div className="block lg:hidden absolute top-8 right-[25%] bottom-[calc(50%+2rem)] w-0.5 border-r-2 border-dashed border-primary/20 z-0"></div>
          <div className="block lg:hidden absolute top-[calc(50%+2rem)] left-[25%] right-[25%] h-0.5 border-t-2 border-dashed border-primary/20 z-0"></div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-12 md:gap-12 text-center relative z-10">
            {/* Feature 1 */}
            <div className="flex flex-col items-center group">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-soft-green flex items-center justify-center text-primary mb-4 md:mb-6 shadow-sm group-hover:scale-110 transition-transform">
                <Receipt className="w-7 h-7 md:w-8 md:h-8" />
              </div>
              <h3 className="font-bold text-sm md:text-xl text-ink mb-2 md:mb-3">Easy Tracking</h3>
              <p className="text-xs md:text-base text-ink/60 leading-relaxed px-1 md:px-4">Add expenses in seconds and keep track.</p>
            </div>

            {/* Feature 2 */}
            <div className="flex flex-col items-center group">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-soft-green flex items-center justify-center text-primary mb-4 md:mb-6 shadow-sm group-hover:scale-110 transition-transform">
                <Users className="w-7 h-7 md:w-8 md:h-8" />
              </div>
              <h3 className="font-bold text-sm md:text-xl text-ink mb-2 md:mb-3">Split Any Way</h3>
              <p className="text-xs md:text-base text-ink/60 leading-relaxed px-1 md:px-4">Split equally, unevenly, or by exact share.</p>
            </div>

            {/* Feature 3 (On mobile, we make the roadmap flow right-to-left here visually, but content-wise it's 3) */}
            <div className="flex flex-col items-center group">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-soft-green flex items-center justify-center text-primary mb-4 md:mb-6 shadow-sm group-hover:scale-110 transition-transform">
                <ArrowRightLeft className="w-7 h-7 md:w-8 md:h-8" />
              </div>
              <h3 className="font-bold text-sm md:text-xl text-ink mb-2 md:mb-3">Settle Easily</h3>
              <p className="text-xs md:text-base text-ink/60 leading-relaxed px-1 md:px-4">Get clear balances and settle up inside.</p>
            </div>

            {/* Feature 4 */}
            <div className="flex flex-col items-center group">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-soft-green flex items-center justify-center text-primary mb-4 md:mb-6 shadow-sm group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-7 h-7 md:w-8 md:h-8" />
              </div>
              <h3 className="font-bold text-sm md:text-xl text-ink mb-2 md:mb-3">Secure & Private</h3>
              <p className="text-xs md:text-base text-ink/60 leading-relaxed px-1 md:px-4">Your data is safe and never shared.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="w-full bg-green-50 py-12 md:py-24">
        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16">
          <h2 className="font-display font-bold text-3xl md:text-4xl text-center text-ink mb-8 md:mb-20">How It Works</h2>
          
          <div className="flex flex-row justify-between md:justify-center gap-2 md:gap-8 relative w-full">
            {/* Step 1 */}
            <div className="flex-1 min-w-0 flex flex-col items-center text-center relative z-10">
              <div className="w-4 h-4 md:w-8 md:h-8 text-[10px] md:text-base rounded-full bg-soft-green text-primary font-bold flex items-center justify-center absolute -top-2 -left-2 md:-top-4 md:left-[calc(50%-1rem)] shadow-sm z-20">1</div>
              <div className="bg-white p-2 md:p-8 rounded-xl md:rounded-2xl shadow-sm w-full h-auto min-h-[5rem] md:h-48 flex items-center justify-center text-primary mb-2 md:mb-6 relative">
                <Users className="w-6 h-6 md:w-16 md:h-16" />
              </div>
              <h3 className="font-bold text-[11px] leading-tight md:text-xl text-ink mb-1 md:mb-3">Create a Group</h3>
              <p className="text-[9px] leading-[1.2] md:text-base text-ink/60 px-0 md:px-4">Create a group for your trip, home, office or anything you're sharing.</p>
            </div>

            {/* Step 2 */}
            <div className="flex-1 min-w-0 flex flex-col items-center text-center relative z-10">
              <div className="w-4 h-4 md:w-8 md:h-8 text-[10px] md:text-base rounded-full bg-soft-green text-primary font-bold flex items-center justify-center absolute -top-2 -left-2 md:-top-4 md:left-[calc(50%-1rem)] shadow-sm z-20">2</div>
              <div className="bg-white p-2 md:p-8 rounded-xl md:rounded-2xl shadow-sm w-full h-auto min-h-[5rem] md:h-48 flex items-center justify-center text-primary mb-2 md:mb-6 relative">
                <Receipt className="w-6 h-6 md:w-16 md:h-16" />
              </div>
              <h3 className="font-bold text-[11px] leading-tight md:text-xl text-ink mb-1 md:mb-3">Add Expenses</h3>
              <p className="text-[9px] leading-[1.2] md:text-base text-ink/60 px-0 md:px-4">Add expenses as they happen and let everyone stay in the loop.</p>
            </div>

            {/* Step 3 */}
            <div className="flex-1 min-w-0 flex flex-col items-center text-center relative z-10">
              <div className="w-4 h-4 md:w-8 md:h-8 text-[10px] md:text-base rounded-full bg-soft-green text-primary font-bold flex items-center justify-center absolute -top-2 -left-2 md:-top-4 md:left-[calc(50%-1rem)] shadow-sm z-20">3</div>
              <div className="bg-white p-2 md:p-8 rounded-xl md:rounded-2xl shadow-sm w-full h-auto min-h-[5rem] md:h-48 flex items-center justify-center text-primary mb-2 md:mb-6 relative">
                <div className="w-6 h-6 md:w-16 md:h-16 rounded-full border-2 md:border-8 border-primary border-r-transparent rotate-45"></div>
              </div>
              <h3 className="font-bold text-[11px] leading-tight md:text-xl text-ink mb-1 md:mb-3">See Who Owes What</h3>
              <p className="text-[9px] leading-[1.2] md:text-base text-ink/60 px-0 md:px-4">Instantly see who owes what and settle up hassle-free.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA Section */}
      <section className="hidden md:block w-full max-w-7xl mx-auto px-4 sm:px-8 lg:px-16 py-24">
        <div className="bg-soft-green rounded-3xl p-8 lg:p-16 flex flex-col lg:flex-row items-center justify-between gap-12 overflow-hidden relative">
          
          <div className="w-full lg:w-1/2 flex flex-col items-start z-10">
            <h2 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl text-ink leading-tight tracking-tight mb-6">
              Ready to stop calculating in your head?
            </h2>
            <p className="font-body text-lg text-ink/70 mb-10 max-w-md">
              Join Kaun Dega and make every split simple, transparent and friendly.
            </p>
            <Link
              href="/signup"
              className="bg-primary text-white font-semibold px-8 py-4 rounded-full hover:bg-primary/90 transition-colors shadow-lg"
            >
              Get Started – It's Free
            </Link>
          </div>

          <div className="w-full lg:w-1/2 relative flex justify-center lg:justify-end z-10">
            <img src="/cta_illustration.jpg" alt="Expense Splitter App" className="w-full max-w-md object-contain mix-blend-multiply drop-shadow-xl rounded-2xl" />
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="w-full bg-green-50 border-t border-green-100 py-12 px-8 lg:px-16 flex flex-col md:flex-row items-center justify-between gap-8">
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="Kaun Dega Logo" className="w-8 h-8 rounded-full border border-gray-100" />
          <h2 className="font-display font-bold text-xl tracking-tight">
            <span className="text-ink">Kaun</span>
            <span className="text-primary">Dega</span>
          </h2>
        </Link>

        <nav className="flex flex-wrap items-center justify-center gap-8">
          <Link href="#about" className="text-sm text-ink/70 hover:text-primary font-medium transition-colors">About Us</Link>
          <Link href="#contact" className="text-sm text-ink/70 hover:text-primary font-medium transition-colors">Contact</Link>
          <Link href="/privacy" className="text-sm text-ink/70 hover:text-primary font-medium transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="text-sm text-ink/70 hover:text-primary font-medium transition-colors">Terms of Use</Link>
        </nav>

        <div className="flex items-center gap-4">
          <Link href="#" className="text-ink/40 hover:text-primary transition-colors text-sm font-medium">Twitter</Link>
          <Link href="#" className="text-ink/40 hover:text-primary transition-colors text-sm font-medium">Instagram</Link>
          <Link href="#" className="text-ink/40 hover:text-primary transition-colors text-sm font-medium">Facebook</Link>
        </div>
      </footer>
    </main>
  );
}

