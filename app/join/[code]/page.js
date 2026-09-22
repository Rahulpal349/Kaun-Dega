'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { auth } from '../../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { api } from '../../../lib/firebaseApi';
import GroupIcon from '../../../components/GroupIcon';
import { JoinSkeleton } from '../../../components/Skeleton';
import { 
  Users, 
  CheckCircle2, 
  Loader2, 
  AlertCircle, 
  Smartphone, 
  ExternalLink, 
  X, 
  ArrowRight,
  Sparkles,
  Download,
  Globe,
  HelpCircle
} from 'lucide-react';

export default function JoinGroupPage() {
  const { code } = useParams();
  const router = useRouter();

  const [inviteInfo, setInviteInfo] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showBanner, setShowBanner] = useState(true);
  
  // App opening state
  const [isOpeningApp, setIsOpeningApp] = useState(false);
  const [showInlineFallback, setShowInlineFallback] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [appUrl, setAppUrl] = useState(`kaundega://join/${code}`);
  const [alternativeSchemeUrl] = useState(`kaundega://join/${code}`);

  // Compute the optimal deep link URL based on device & browser environment
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const ua = navigator.userAgent || '';
    const isAndroid = /android/i.test(ua);
    const isWebView = /; wv\)|WebView|WhatsApp|Instagram|FB_IAB|FBAV|Line|Twitter/i.test(ua);

    if (isAndroid) {
      if (isWebView) {
        // In-app webviews (WhatsApp, Instagram) require custom URI scheme
        setAppUrl(`kaundega://join/${code}`);
      } else {
        // Android Chrome / browsers: targeted intent ensures com.kaundega.kaun_dega is launched
        setAppUrl(`intent://join/${code}#Intent;scheme=kaundega;package=com.kaundega.kaun_dega;end`);
      }
    } else {
      // iOS Safari and other platforms
      setAppUrl(`kaundega://join/${code}`);
    }
  }, [code]);

  // Programmatic launch trigger with fallback detection (no page reload)
  const openInApp = useCallback(() => {
    if (typeof window === 'undefined') return;
    setIsOpeningApp(true);
    setShowInlineFallback(false);

    const ua = navigator.userAgent || '';
    const isAndroid = /android/i.test(ua);
    const isWebView = /; wv\)|WebView|WhatsApp|Instagram|FB_IAB|FBAV|Line|Twitter/i.test(ua);

    const targetUrl = isAndroid && !isWebView
      ? `intent://join/${code}#Intent;scheme=kaundega;package=com.kaundega.kaun_dega;end`
      : `kaundega://join/${code}`;

    // Direct navigation synchronously
    window.location.href = targetUrl;

    // Also trigger via synthetic anchor click for Android webview compatibility
    try {
      const a = document.createElement('a');
      a.href = targetUrl;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        try { document.body.removeChild(a); } catch (_) {}
      }, 400);
    } catch (_) {}

    // Check after 2.5s if browser is still visible without launching app
    setTimeout(() => {
      setIsOpeningApp(false);
      if (!document.hidden && document.visibilityState === 'visible') {
        setShowInlineFallback(true);
      }
    }, 2500);
  }, [code]);

  // Load group details publicly without blocking on auth
  useEffect(() => {
    let isMounted = true;

    async function loadGroupDetails() {
      try {
        const info = await api.getInviteInfo(code);
        if (isMounted) {
          setInviteInfo(info);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'This invite link is invalid or has expired.');
          setLoading(false);
        }
      }
    }

    loadGroupDetails();

    // Monitor auth state to check if user is logged in
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (!isMounted) return;
      setCurrentUser(user);
      if (user) {
        try {
          await api.ensureUserProfile(user);
          const refreshed = await api.getInviteInfo(code);
          if (isMounted) setInviteInfo(refreshed);
        } catch (_) {}
      }
    });

    return () => {
      isMounted = false;
      unsubscribeAuth();
    };
  }, [code]);

  // Join on web flow
  async function handleJoinWeb() {
    if (!currentUser) {
      localStorage.setItem('pending_invite_code', code);
      router.push(`/login?redirect=/join/${code}`);
      return;
    }

    setJoining(true);
    setError('');
    try {
      const targetGroupId = inviteInfo?.groupId || code;
      if (inviteInfo?.isAlreadyMember) {
        setSuccess('You are already a member!');
        setTimeout(() => router.push(`/groups/${targetGroupId}`), 600);
        return;
      }

      await api.joinGroupByCode(code);
      setSuccess('You joined the group!');
      setTimeout(() => router.push(`/groups/${targetGroupId}`), 600);
    } catch (err) {
      setError(err.message || 'Failed to join group');
      setJoining(false);
    }
  }

  if (loading) {
    return <JoinSkeleton />;
  }

  if (error && !inviteInfo) {
    return (
      <main className="min-h-screen bg-[#F4FBF7] flex items-center justify-center font-body px-4">
        <div className="bg-white rounded-[28px] shadow-sm border border-[#E2EFE9] p-8 text-center max-w-md w-full">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-4 border border-rose-100">
            <AlertCircle size={32} />
          </div>
          <h1 className="text-xl font-extrabold text-gray-900 mb-2">Invalid or Expired Invite</h1>
          <p className="text-gray-500 text-sm mb-6 leading-relaxed">{error}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full bg-[#145C4B] text-white font-bold py-3.5 rounded-2xl hover:bg-[#0E382F] transition-all shadow-sm"
          >
            Go to Dashboard
          </button>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4FBF7] flex flex-col font-body relative">
      {/* Smart App Banner */}
      {showBanner && (
        <aside aria-label="Kaun Dega mobile app banner" className="sticky top-0 z-40 bg-[#0E382F] text-white px-4 py-3 shadow-md border-b border-white/10 backdrop-blur-md">
          <div className="max-w-xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button 
                onClick={() => setShowBanner(false)}
                className="text-white/60 hover:text-white p-1 rounded-lg transition-colors shrink-0"
                title="Dismiss banner"
              >
                <X size={16} />
              </button>
              <div className="w-9 h-9 rounded-xl bg-[#145C4B] border border-white/15 flex items-center justify-center text-white shrink-0 shadow-xs">
                <Smartphone size={18} />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-extrabold tracking-tight truncate flex items-center gap-1.5">
                  <span>Kaun Dega? App</span>
                  <span className="text-[10px] uppercase font-bold bg-[#25D366]/20 text-[#25D366] px-1.5 py-0.2 rounded-md">Free</span>
                </div>
                <p className="text-[11px] text-white/70 truncate">Open in app for 1-tap UPI splits & real-time sync</p>
              </div>
            </div>

            <a
              href={appUrl}
              onClick={(e) => {
                openInApp();
              }}
              className="px-4 py-1.5 bg-[#25D366] text-[#0E382F] hover:bg-[#20ba59] font-extrabold text-xs rounded-xl shrink-0 transition-all active:scale-95 shadow-xs flex items-center gap-1"
            >
              {isOpeningApp ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <>
                  <span>USE APP</span>
                  <ExternalLink size={12} />
                </>
              )}
            </a>
          </div>
        </aside>
      )}

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="bg-white rounded-[32px] shadow-xl shadow-[#145C4B]/5 border border-[#E2EFE9] p-6 sm:p-8 text-center max-w-md w-full relative overflow-hidden">
          {/* Subtle Ambient Decorative Gradient */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-40 h-40 rounded-full bg-[#145C4B]/5 blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-40 h-40 rounded-full bg-[#25D366]/5 blur-2xl pointer-events-none" />

          {/* Group Icon Badge */}
          <div className="relative mx-auto mb-4 w-20 h-20">
            <div className="w-20 h-20 rounded-3xl bg-[#F0F7F4] border border-[#E2EFE9] flex items-center justify-center text-3xl shadow-sm">
              <GroupIcon icon={inviteInfo?.groupIcon || inviteInfo?.groupEmoji} size={38} />
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#145C4B] text-white flex items-center justify-center shadow-md">
              <Sparkles size={14} />
            </div>
          </div>

          {/* Group Title & Details */}
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-1 line-clamp-2">
            {inviteInfo?.groupName}
          </h1>

          {inviteInfo?.invitedBy && (
            <p className="text-gray-500 text-sm font-medium mb-2">
              Invited by <span className="font-bold text-gray-800">{inviteInfo.invitedBy}</span>
            </p>
          )}

          {inviteInfo?.memberCount !== undefined && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F0F7F4] border border-[#E2EFE9] text-xs font-bold text-[#145C4B] mb-6">
              <Users size={13} />
              <span>{inviteInfo.memberCount} active member{inviteInfo.memberCount !== 1 ? 's' : ''}</span>
            </div>
          )}

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl text-xs font-bold mb-4 text-left">
              {error}
            </div>
          )}

          {inviteInfo?.isAlreadyMember ? (
            <div className="bg-[#F0F7F4] border border-[#E2EFE9] rounded-2xl p-4 mb-4 flex items-center gap-3 text-left">
              <CheckCircle2 size={24} className="text-[#145C4B] shrink-0" />
              <div>
                <p className="text-xs font-bold text-gray-900">You are already a member</p>
                <p className="text-[11px] text-gray-500">Access group expenses and balances directly.</p>
              </div>
            </div>
          ) : null}

          {/* Primary Action: Open in Kaun Dega App */}
          <div className="space-y-3">
            <a
              href={appUrl}
              onClick={(e) => {
                openInApp();
              }}
              className="w-full bg-[#145C4B] text-white hover:bg-[#0E382F] font-extrabold py-4 px-6 rounded-2xl shadow-lg shadow-[#145C4B]/20 transition-all flex items-center justify-center gap-2 group active:scale-[0.98] select-none"
            >
              {isOpeningApp ? (
                <>
                  <Loader2 size={20} className="animate-spin text-[#25D366]" />
                  <span className="text-base">Opening Kaun Dega App...</span>
                </>
              ) : (
                <>
                  <Smartphone size={20} className="group-hover:scale-110 transition-transform text-[#25D366]" />
                  <span className="text-base">Open in Kaun Dega App</span>
                </>
              )}
            </a>

            <p className="text-[11px] text-gray-400 font-medium">
              Directly launches the Kaun Dega mobile app
            </p>

            {/* Non-blocking Inline Fallback Helper (appears only if app didn't open) */}
            {showInlineFallback && (
              <div className="p-3.5 bg-emerald-50/80 border border-emerald-200/80 rounded-2xl text-left text-xs text-emerald-950 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="flex items-center gap-2 font-bold text-emerald-900">
                  <HelpCircle size={15} className="text-[#145C4B]" />
                  <span>Didn't open in app?</span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  Try opening via direct custom link or join instantly on web without installing anything:
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <a
                    href={alternativeSchemeUrl}
                    className="px-3 py-1.5 bg-[#145C4B] text-white font-bold rounded-xl text-xs hover:bg-[#0E382F] transition-colors"
                  >
                    Open with kaundega://
                  </a>
                  <button
                    onClick={handleJoinWeb}
                    className="px-3 py-1.5 bg-white border border-[#E2EFE9] text-gray-800 font-bold rounded-xl text-xs hover:bg-[#F0F7F4] transition-colors"
                  >
                    Join on Web Now
                  </button>
                  <button
                    onClick={() => setShowDownloadModal(true)}
                    className="px-3 py-1.5 bg-white border border-[#E2EFE9] text-gray-800 font-bold rounded-xl text-xs hover:bg-[#F0F7F4] transition-colors"
                  >
                    Get APK
                  </button>
                </div>
              </div>
            )}

            {/* Divider with 'or' */}
            <div className="relative my-4 flex items-center justify-center">
              <div className="border-t border-gray-200 w-full" />
              <span className="bg-white px-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider absolute">
                or continue on web
              </span>
            </div>

            {/* Secondary Action: Join / Open on Web */}
            {inviteInfo?.isAlreadyMember ? (
              <button
                onClick={() => router.push(`/groups/${inviteInfo.groupId || code}`)}
                className="w-full bg-white border border-[#E2EFE9] text-gray-800 hover:bg-[#F0F7F4] font-bold py-3 px-5 rounded-2xl transition-all flex items-center justify-center gap-2 text-sm shadow-2xs"
              >
                <span>Open Group on Web</span>
                <ArrowRight size={16} />
              </button>
            ) : success ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-center gap-2 text-emerald-800 font-bold text-sm">
                <CheckCircle2 size={18} className="text-emerald-600" />
                <span>{success} Redirecting...</span>
              </div>
            ) : (
              <button
                onClick={handleJoinWeb}
                disabled={joining}
                className="w-full bg-white border border-[#E2EFE9] text-gray-800 hover:bg-[#F0F7F4] hover:text-[#145C4B] font-bold py-3 px-5 rounded-2xl transition-all disabled:opacity-60 flex items-center justify-center gap-2 text-sm shadow-2xs"
              >
                {joining ? (
                  <>
                    <Loader2 size={16} className="animate-spin text-[#145C4B]" />
                    <span>Joining on Web...</span>
                  </>
                ) : (
                  <>
                    <Users size={16} />
                    <span>{currentUser ? 'Join Group on Web' : 'Join on Web (Sign in)'}</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Footer App Info */}
          <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col items-center gap-2 text-center">
            <span className="text-xs text-gray-500 font-medium">
              Don't have the Kaun Dega app installed?
            </span>
            <button
              onClick={() => setShowDownloadModal(true)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#145C4B] hover:text-[#0E382F] transition-colors"
            >
              <Download size={14} />
              <span>Download & Install Mobile App</span>
            </button>
          </div>
        </div>
      </main>

      {/* Download Options Modal (opened only when user taps "Download & Install Mobile App" or "Get APK") */}
      {showDownloadModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-gray-100 space-y-4 text-center">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="text-left">
                <h3 className="text-base font-extrabold text-gray-900">Get Kaun Dega</h3>
                <p className="text-xs text-gray-500">Choose how you would like to use Kaun Dega</p>
              </div>
              <button
                onClick={() => setShowDownloadModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <a
                href="/api/download"
                download="kaun-dega.apk"
                className="w-full bg-[#145C4B] text-white hover:bg-[#0E382F] font-bold p-3.5 rounded-2xl transition-all flex items-center gap-3 text-left shadow-sm"
              >
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                  <Download size={20} className="text-[#25D366]" />
                </div>
                <div>
                  <div className="text-sm font-extrabold">Download Android App (APK)</div>
                  <div className="text-[11px] text-white/75">Fast install, offline mode & UPI integration</div>
                </div>
              </a>

              <button
                onClick={() => {
                  setShowDownloadModal(false);
                  handleJoinWeb();
                }}
                className="w-full bg-[#F4FBF7] border border-[#E2EFE9] text-gray-800 hover:bg-[#EAF5F0] font-bold p-3.5 rounded-2xl transition-all flex items-center gap-3 text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-[#145C4B]/10 flex items-center justify-center shrink-0 text-[#145C4B]">
                  <Globe size={20} />
                </div>
                <div>
                  <div className="text-sm font-extrabold text-gray-900">Use Web App (No Install)</div>
                  <div className="text-[11px] text-gray-500">Instant access right now in this browser</div>
                </div>
              </button>
            </div>

            <p className="text-[11px] text-gray-400">
              For iOS users: Kaun Dega works as a PWA in Safari. Tap Share &gt; Add to Home Screen.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
