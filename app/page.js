import Link from 'next/link';
import TopHeader from '../components/TopHeader';
import { PenLine, Plus, Stamp } from 'lucide-react';

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col bg-paper relative overflow-hidden">
      <TopHeader showNav={true} />

      <div className="flex-1 flex flex-col lg:flex-row relative z-10">
        {/* Left Column */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 lg:px-16 xl:px-24 pt-10 pb-24 border-r border-ink/10 relative">
          <h1 className="font-display font-bold text-6xl sm:text-7xl lg:text-8xl text-ink leading-[0.9] tracking-tight mb-8">
            Kaun Dega?
          </h1>
          
          <h2 className="font-display italic text-2xl sm:text-3xl text-ink/70 leading-snug mb-8 max-w-md">
            The digital khata for your chai-tapri hisaab-kitab.
          </h2>

          <p className="font-body text-lg text-ink/80 mb-12 max-w-md leading-relaxed">
            Stop chasing loose change. Track, split, and settle debts with the simplicity of a paper chit and the speed of digital.
          </p>

          <div className="flex items-center gap-6 mb-16">
            <Link
              href="/signup"
              className="flex items-center gap-3 rounded-sm bg-marigold text-ink font-semibold px-8 py-4 text-lg hover:brightness-95 transition-all shadow-[4px_4px_0px_rgba(11,43,38,1)] border-2 border-ink active:translate-y-1 active:translate-x-1 active:shadow-[0px_0px_0px_rgba(11,43,38,1)]"
            >
              Start your Ledger <PenLine size={20} strokeWidth={2.5} />
            </Link>
            <Link
              href="/#how-it-works"
              className="font-body font-semibold text-ink hover:underline underline-offset-4"
            >
              How it works
            </Link>
          </div>

          <div className="mt-auto flex items-center gap-3 text-ink/50 border border-ink/10 w-fit p-3 rounded-lg bg-white/40 backdrop-blur-sm">
            <Stamp size={20} strokeWidth={1.5} />
            <span className="font-mono text-[10px] tracking-widest uppercase font-semibold">
              Estd. 2024 • Local Commerce Ready
            </span>
          </div>
        </div>

        {/* Right Column / Decorative Graphic */}
        <div className="w-full lg:w-1/2 bg-offwhite relative hidden lg:flex flex-col">
          {/* Faded Chits Background Graphic */}
          <div className="absolute inset-0 flex flex-col items-center justify-center opacity-30 gap-8 pointer-events-none transform -rotate-3 scale-110 mix-blend-multiply">
             {/* We'll use CSS shapes to mimic chits for decoration */}
             <div className="w-[400px] h-16 bg-white border border-ink/20 shadow-sm relative chit rotate-2 translate-x-8"></div>
             <div className="w-[480px] h-20 bg-white border border-ink/20 shadow-sm relative chit -rotate-1 -translate-x-4"></div>
             <div className="w-[380px] h-16 bg-white border border-ink/20 shadow-sm relative chit rotate-3 translate-x-12"></div>
          </div>

          <div className="absolute top-24 right-16 rotate-12 bg-marigold text-ink font-display font-bold italic px-4 py-2 border border-ink shadow-[2px_2px_0px_rgba(11,43,38,1)] text-xl z-20 transform hover:scale-105 transition-transform">
            MUST SETTLE!
          </div>

          {/* Bottom Fixed Banner Graphic */}
          <div className="absolute bottom-0 left-0 right-0 h-32 border-t border-ink/10 bg-offwhite/80 backdrop-blur-md px-12 flex items-center justify-between z-30">
             <div>
                <p className="font-mono text-xs font-semibold text-ink/60 uppercase tracking-wider mb-1">Grand Total Pending</p>
                <p className="font-mono font-bold text-4xl text-ink">₹14,520.00</p>
             </div>
             <div className="flex gap-12 items-end">
                <div>
                   <p className="font-mono text-[10px] font-semibold text-teal uppercase tracking-widest mb-1">You Get</p>
                   <p className="font-mono font-bold text-2xl text-teal">₹8,400</p>
                </div>
                <div>
                   <p className="font-mono text-[10px] font-semibold text-chili uppercase tracking-widest mb-1">You Owe</p>
                   <p className="font-mono font-bold text-2xl text-chili">₹6,120</p>
                </div>
                <button className="w-16 h-16 bg-marigold border-2 border-ink shadow-[4px_4px_0px_rgba(11,43,38,1)] flex items-center justify-center hover:brightness-95 active:translate-y-1 active:translate-x-1 active:shadow-[0px_0px_0px_rgba(11,43,38,1)] transition-all">
                  <Plus size={32} strokeWidth={2.5} className="text-ink" />
                </button>
             </div>
          </div>
        </div>
      </div>
    </main>
  );
}
