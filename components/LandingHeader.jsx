import Link from 'next/link';
import { Users } from 'lucide-react';

export default function LandingHeader() {
  return (
    <header className="w-full py-4 md:py-6 px-4 md:px-8 lg:px-16 flex items-center justify-between bg-white z-50">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-1 md:gap-2">
        <img src="/logo.png" alt="Kaun Dega Logo" className="w-7 h-7 md:w-9 md:h-9 rounded-full border border-gray-100" />
        <h1 className="font-display font-bold text-xl md:text-2xl tracking-tight">
          <span className="text-ink">Kaun</span>
          <span className="text-primary">Dega</span>
        </h1>
      </Link>

      {/* Center Links (Hidden on mobile and small desktops) */}
      <nav className="hidden xl:flex items-center gap-8">
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

      {/* CTA Buttons */}
      <div className="flex items-center gap-3 md:gap-4">
        <Link
          href="/login"
          className="text-ink/70 hover:text-primary font-semibold text-sm transition-colors whitespace-nowrap"
        >
          Log in
        </Link>
        <Link
          href="/signup"
          className="bg-primary text-white font-semibold px-4 py-2 text-sm md:px-6 md:py-2.5 md:text-base rounded-md hover:bg-primary/90 transition-colors shadow-sm whitespace-nowrap"
        >
          Get Started
        </Link>
      </div>
    </header>
  );
}
