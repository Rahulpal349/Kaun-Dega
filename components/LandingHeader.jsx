import Link from 'next/link';
import { Users } from 'lucide-react';

export default function LandingHeader() {
  return (
    <header className="w-full py-6 px-8 lg:px-16 flex items-center justify-between bg-white z-50">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2">
        <Users size={28} className="text-primary" />
        <h1 className="font-display font-bold text-2xl tracking-tight">
          <span className="text-ink">Kaun</span>
          <span className="text-primary">Dega</span>
        </h1>
      </Link>

      {/* Center Links (Hidden on mobile) */}
      <nav className="hidden lg:flex items-center gap-8">
        <Link href="#features" className="text-ink/80 hover:text-primary font-semibold text-sm transition-colors">
          Features
        </Link>
        <Link href="#how-it-works" className="text-ink/80 hover:text-primary font-semibold text-sm transition-colors">
          How it Works
        </Link>
        <Link href="#about" className="text-ink/80 hover:text-primary font-semibold text-sm transition-colors">
          About Us
        </Link>
        <Link href="#blog" className="text-ink/80 hover:text-primary font-semibold text-sm transition-colors">
          Blog
        </Link>
      </nav>

      {/* CTA Button */}
      <Link
        href="/signup"
        className="bg-primary text-white font-semibold px-6 py-2.5 rounded-md hover:bg-primary/90 transition-colors shadow-sm"
      >
        Get Started
      </Link>
    </header>
  );
}
