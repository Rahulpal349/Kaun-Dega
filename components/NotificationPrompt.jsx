'use client';

import { useState, useEffect } from 'react';
import { Bell, X, Check } from 'lucide-react';
import { api } from '../lib/firebaseApi';
import { getNotificationPermissionState, requestAndRegisterPushNotifications } from '../lib/webPush';

export default function NotificationPrompt() {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if dismissed in this session
    if (sessionStorage.getItem('kd_notif_dismissed') === 'true') return;

    // Check permission state
    const perm = getNotificationPermissionState();
    if (perm !== 'default') return;

    // Only show if user is logged in
    const user = api.currentUser();
    if (user && user.id) {
      // Delay showing by 2.5s so it's not jarring on initial page load
      const timer = setTimeout(() => setShow(true), 2500);
      return () => clearTimeout(timer);
    }
  }, []);

  async function handleEnable() {
    setLoading(true);
    const user = api.currentUser();
    if (!user || !user.id) {
      setLoading(false);
      return;
    }

    try {
      await requestAndRegisterPushNotifications(user.id);
      setEnabled(true);
      setTimeout(() => setShow(false), 2000);
    } catch (e) {
      console.warn('Failed to enable notifications:', e);
      setShow(false);
    } finally {
      setLoading(false);
    }
  }

  function handleDismiss() {
    sessionStorage.setItem('kd_notif_dismissed', 'true');
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-slide-up">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 sm:p-5 shadow-xl border border-[#E2EFE9] flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#F0F7F4] border border-[#E2EFE9] flex items-center justify-center text-[#145C4B] shrink-0">
            <Bell className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h4 className="font-extrabold text-sm text-gray-900 leading-tight">
              {enabled ? 'Notifications Enabled!' : 'Enable Push Notifications'}
            </h4>
            <p className="text-xs text-gray-500 font-medium mt-1 leading-snug">
              {enabled
                ? 'You will now receive instant alerts on this device for new expenses and settlements.'
                : 'Get instant real-time alerts when someone adds an expense or settles up with you.'}
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {!enabled && (
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              onClick={handleDismiss}
              className="px-3.5 py-1.5 text-xs font-bold text-gray-500 hover:text-gray-800 rounded-xl transition-colors"
            >
              Later
            </button>
            <button
              onClick={handleEnable}
              disabled={loading}
              className="px-4 py-2 bg-[#145C4B] hover:bg-[#0E382F] text-white text-xs font-extrabold rounded-xl transition-all shadow-md shadow-[#145C4B]/20 flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>{loading ? 'Enabling...' : 'Enable Now'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
