'use client';
import Link from 'next/link';
import Image from 'next/image';
import LandingHeader from '../components/LandingHeader';
import { Play, Receipt, Users, ArrowRightLeft, ShieldCheck } from 'lucide-react';

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col bg-white overflow-x-hidden">
      <LandingHeader />

      {/* Hero Section */}
      <section className="w-full max-w-7xl mx-auto px-8 lg:px-16 py-16 lg:py-20 flex flex-col lg:flex-row items-center gap-12">
        {/* Left Content */}
        <div className="w-full lg:w-1/2 flex flex-col items-start">
          <div className="bg-soft-green text-primary font-semibold px-4 py-1.5 rounded-full text-sm mb-8">
            Split expenses. Not friendships.
          </div>
          
          <h1 className="font-display font-bold text-5xl lg:text-7xl text-ink leading-[1.1] tracking-tight mb-6">
            Track expenses.<br />
            Split bills.<br />
            <span className="text-primary">Stay stress-free.</span>
          </h1>
          
          <p className="font-body text-lg text-ink/70 mb-10 max-w-lg leading-relaxed">
            Kaun Dega helps you split expenses with friends, trips, flatmates or groups in just a few taps.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 mb-12 w-full sm:w-auto">
            <Link
              href="/signup"
              className="w-full sm:w-auto bg-primary text-white font-semibold px-8 py-3.5 rounded-full hover:bg-primary/90 transition-colors shadow-lg text-center"
            >
              Get Started – It's Free
            </Link>
            <Link
              href="#how-it-works"
              className="w-full sm:w-auto flex items-center justify-center gap-2 border-2 border-ink/20 text-ink font-semibold px-8 py-3.5 rounded-full hover:bg-ink/5 transition-colors"
            >
              See How It Works <Play size={18} fill="currentColor" />
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex -space-x-3">
              {/* Avatars */}
              <div className="w-10 h-10 rounded-full border-2 border-white bg-gray-200 overflow-hidden"><img src="https://i.pravatar.cc/100?img=1" alt="User" /></div>
              <div className="w-10 h-10 rounded-full border-2 border-white bg-gray-200 overflow-hidden"><img src="https://i.pravatar.cc/100?img=2" alt="User" /></div>
              <div className="w-10 h-10 rounded-full border-2 border-white bg-gray-200 overflow-hidden"><img src="https://i.pravatar.cc/100?img=3" alt="User" /></div>
              <div className="w-10 h-10 rounded-full border-2 border-white bg-gray-200 overflow-hidden"><img src="https://i.pravatar.cc/100?img=4" alt="User" /></div>
            </div>
            <p className="text-sm font-semibold text-ink/80 leading-tight">
              Join 10,000+ users<br />
              <span className="font-normal text-ink/60">who split smartly</span>
            </p>
          </div>
        </div>

        {/* Right Content / Illustration */}
        <div className="w-full lg:w-1/2 relative flex justify-center">
          <img src="/hero_illustration.jpg" alt="Kaun Dega App Illustration" className="w-full max-w-lg object-contain drop-shadow-2xl rounded-2xl" />
        </div>
      </section>

      {/* Why Kaun Dega? Section */}
      <section id="features" className="w-full max-w-7xl mx-auto px-8 lg:px-16 py-24 border-t border-gray-100">
        <h2 className="font-display font-bold text-4xl text-center text-ink mb-16">Why Kaun Dega?</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 text-center">
          {/* Feature 1 */}
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-soft-green flex items-center justify-center text-primary mb-6">
              <Receipt size={32} />
            </div>
            <h3 className="font-bold text-xl text-ink mb-3">Easy Expense Tracking</h3>
            <p className="text-ink/60 leading-relaxed">Add expenses in seconds and keep track of every payment.</p>
          </div>

          {/* Feature 2 */}
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-soft-green flex items-center justify-center text-primary mb-6">
              <Users size={32} />
            </div>
            <h3 className="font-bold text-xl text-ink mb-3">Split in Any Way</h3>
            <p className="text-ink/60 leading-relaxed">Split equally, unevenly, or by share – as you like.</p>
          </div>

          {/* Feature 3 */}
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-soft-green flex items-center justify-center text-primary mb-6">
              <ArrowRightLeft size={32} />
            </div>
            <h3 className="font-bold text-xl text-ink mb-3">Settle Up Easily</h3>
            <p className="text-ink/60 leading-relaxed">Get clear balances and settle up within the app.</p>
          </div>

          {/* Feature 4 */}
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-soft-green flex items-center justify-center text-primary mb-6">
              <ShieldCheck size={32} />
            </div>
            <h3 className="font-bold text-xl text-ink mb-3">Secure & Private</h3>
            <p className="text-ink/60 leading-relaxed">Your data is safe with us. We never share your information.</p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="w-full bg-gray-50 py-24">
        <div className="max-w-7xl mx-auto px-8 lg:px-16">
          <h2 className="font-display font-bold text-4xl text-center text-ink mb-20">How It Works</h2>
          
          <div className="flex flex-col md:flex-row items-start justify-center gap-8 relative">
            {/* Step 1 */}
            <div className="flex-1 flex flex-col items-center text-center relative z-10 w-full">
              <div className="w-8 h-8 rounded-full bg-soft-green text-primary font-bold flex items-center justify-center absolute -top-4 -left-4 md:-left-0 shadow-sm z-20">1</div>
              <div className="bg-white p-8 rounded-2xl shadow-sm w-full h-48 flex items-center justify-center text-primary mb-6 relative">
                <Users size={64} />
              </div>
              <h3 className="font-bold text-xl text-ink mb-3">Create a Group</h3>
              <p className="text-ink/60 leading-relaxed px-4">Create a group for your trip, home, office or anything you're sharing.</p>
            </div>

            {/* Arrow 1 */}
            <div className="hidden md:flex flex-1 items-center justify-center mt-24 text-gray-300">
              <span className="text-2xl tracking-[0.5em] font-light">------&gt;</span>
            </div>

            {/* Step 2 */}
            <div className="flex-1 flex flex-col items-center text-center relative z-10 w-full">
              <div className="w-8 h-8 rounded-full bg-soft-green text-primary font-bold flex items-center justify-center absolute -top-4 -left-4 md:-left-0 shadow-sm z-20">2</div>
              <div className="bg-white p-8 rounded-2xl shadow-sm w-full h-48 flex items-center justify-center text-primary mb-6 relative">
                <Receipt size={64} />
              </div>
              <h3 className="font-bold text-xl text-ink mb-3">Add Expenses</h3>
              <p className="text-ink/60 leading-relaxed px-4">Add expenses as they happen and let everyone stay in the loop.</p>
            </div>

            {/* Arrow 2 */}
            <div className="hidden md:flex flex-1 items-center justify-center mt-24 text-gray-300">
              <span className="text-2xl tracking-[0.5em] font-light">------&gt;</span>
            </div>

            {/* Step 3 */}
            <div className="flex-1 flex flex-col items-center text-center relative z-10 w-full">
              <div className="w-8 h-8 rounded-full bg-soft-green text-primary font-bold flex items-center justify-center absolute -top-4 -left-4 md:-left-0 shadow-sm z-20">3</div>
              <div className="bg-white p-8 rounded-2xl shadow-sm w-full h-48 flex items-center justify-center text-primary mb-6 relative">
                <div className="w-16 h-16 rounded-full border-8 border-primary border-r-transparent rotate-45"></div>
              </div>
              <h3 className="font-bold text-xl text-ink mb-3">See Who Owes What</h3>
              <p className="text-ink/60 leading-relaxed px-4">Instantly see who owes what and settle up hassle-free.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA Section */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-8 lg:px-16 py-24">
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
      <footer className="w-full bg-white border-t border-gray-100 py-12 px-8 lg:px-16 flex flex-col md:flex-row items-center justify-between gap-8">
        <Link href="/" className="flex items-center gap-2">
          <Users size={24} className="text-primary" />
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
