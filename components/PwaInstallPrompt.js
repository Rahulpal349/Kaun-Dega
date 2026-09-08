'use client';

import { useState, useEffect } from 'react';
import { Share, PlusSquare, X, Smartphone, Sparkles } from 'lucide-react';

export default function PwaInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if app is already running in standalone mode (installed as PWA)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    if (isStandalone) return;

    // Check if dismissed before
    const isDismissed = localStorage.getItem('pwa_prompt_dismissed');
    if (isDismissed) return;

    // Detect iOS / iPhone / Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    // Show prompt on mobile devices
    const isMobile = isIosDevice || /android/.test(userAgent);
    if (isMobile) {
      // Delay prompt slightly for a smooth entrance
      const timer = setTimeout(() => setShowPrompt(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-6 md:max-w-sm z-50 animate-pop-in">
      <div className="bg-[#0E382F] text-white border border-emerald-500/30 rounded-[24px] p-4 shadow-2xl backdrop-blur-xl relative overflow-hidden">
        {/* Glow Accent */}
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-28 h-28 rounded-full bg-[#25D366]/20 blur-xl pointer-events-none" />

        <div className="flex items-start justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#145C4B] border border-emerald-400/20 flex items-center justify-center text-white shrink-0 shadow-sm">
              <Smartphone className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                <span>Install on iPhone</span>
                <span className="px-2 py-0.5 rounded-full bg-[#25D366]/20 text-[#25D366] text-[10px] uppercase font-black tracking-wider">
                  App
                </span>
              </h4>
              <p className="text-xs text-emerald-100/80 font-medium mt-0.5 leading-snug">
                {isIos ? (
                  <>Tap <Share className="w-3.5 h-3.5 inline mx-0.5 text-emerald-300" /> Share, then tap <PlusSquare className="w-3.5 h-3.5 inline mx-0.5 text-emerald-300" /> <strong>Add to Home Screen</strong>.</>
                ) : (
                  <>Add to your home screen for full native app experience.</>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="p-1 rounded-full text-emerald-200/60 hover:text-white hover:bg-white/10 transition-colors shrink-0"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between">
          <span className="text-[11px] font-semibold text-emerald-200/70 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#25D366]" /> Native iOS Experience
          </span>
          <button
            onClick={handleDismiss}
            className="text-xs font-bold text-[#25D366] hover:underline"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
