import Link from 'next/link';

export default function LandingHeader() {
  return (
    <header className="w-full py-4 px-4 sm:px-8 lg:px-12 flex items-center justify-between bg-white border-b border-[#E2EFE9] sticky top-0 z-50">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5">
        <div className="w-10 h-10 rounded-2xl bg-[#145C4B] p-0.5 overflow-hidden flex items-center justify-center shadow-sm shrink-0">
          <img 
            src="/logo.png" 
            alt="Kaun Dega Logo" 
            className="w-full h-full object-cover rounded-xl"
          />
        </div>
        <div>
          <h1 className="font-extrabold text-lg sm:text-xl tracking-tight leading-none">
            <span className="text-gray-900">Kaun</span>{' '}
            <span className="text-[#145C4B]">Dega</span>?
          </h1>
          <p className="text-[10px] font-bold text-gray-400 mt-0.5 uppercase tracking-wider">
            Split & Settle Up
          </p>
        </div>
      </Link>

      {/* Navigation Links */}
      <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-gray-600">
        <Link href="#features" className="hover:text-[#145C4B] transition-colors">
          Features
        </Link>
        <Link href="#how-it-works" className="hover:text-[#145C4B] transition-colors">
          How it Works
        </Link>
        <Link href="/privacy" className="hover:text-[#145C4B] transition-colors">
          Privacy
        </Link>
      </nav>

      {/* CTA Buttons */}
      <div className="flex items-center gap-3">
        <Link
          href="/login"
          className="text-xs font-bold text-gray-700 hover:text-[#145C4B] px-3.5 py-2 rounded-2xl hover:bg-gray-50 transition-all"
        >
          Log in
        </Link>
        <Link
          href="/signup"
          className="bg-[#145C4B] hover:bg-[#0E382F] text-white font-extrabold text-xs px-4 py-2.5 rounded-2xl transition-all shadow-sm active:scale-95"
        >
          Get Started
        </Link>
      </div>
    </header>
  );
}


