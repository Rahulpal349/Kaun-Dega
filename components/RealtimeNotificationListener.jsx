'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { api } from '../lib/firebaseApi';
import { setupForegroundMessageListener } from '../lib/webPush';
import { Bell, ArrowRight, X } from 'lucide-react';

export default function RealtimeNotificationListener() {
  const router = useRouter();
  const [activeToast, setActiveToast] = useState(null);

  useEffect(() => {
    const user = api.currentUser();
    if (!user || !user.id) return;

    let isFirstSnapshot = true;
    const notifQuery = query(
      collection(db, 'notifications'),
      where('targetUserId', '==', user.id)
    );

    const unsubscribeFirestore = onSnapshot(notifQuery, (snapshot) => {
      if (isFirstSnapshot) {
        isFirstSnapshot = false;
        return;
      }

      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          if (data && !data.read) {
            // Mark read
            updateDoc(doc(db, 'notifications', change.doc.id), { read: true }).catch(() => {});

            // Show In-App Toast
            const toastData = {
              id: change.doc.id,
              title: data.title || 'Kaun Dega? 💸',
              body: data.body || 'New activity in your group.',
              groupId: data.groupId || null,
            };
            setActiveToast(toastData);

            // Also trigger native OS Notification if permission granted
            if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
              try {
                new Notification(toastData.title, {
                  body: toastData.body,
                  icon: '/icon-192x192.png',
                  badge: '/icon-192x192.png',
                });
              } catch (_) {}
            }
          }
        }
      });
    }, (err) => {
      console.warn('Realtime notifications listener error:', err.message);
    });

    // Also listen to FCM foreground push messages
    const unsubscribeFCM = setupForegroundMessageListener((payload) => {
      const title = payload.notification?.title || payload.data?.title || 'Kaun Dega? 💸';
      const body = payload.notification?.body || payload.data?.body || 'New activity in your group.';
      const groupId = payload.data?.groupId || null;

      setActiveToast({
        id: Date.now().toString(),
        title,
        body,
        groupId,
      });
    });

    return () => {
      unsubscribeFirestore();
      unsubscribeFCM();
    };
  }, []);

  // Auto-dismiss after 6 seconds
  useEffect(() => {
    if (!activeToast) return;
    const timer = setTimeout(() => {
      setActiveToast(null);
    }, 6000);
    return () => clearTimeout(timer);
  }, [activeToast]);

  if (!activeToast) return null;

  return (
    <div className="fixed top-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-[100] animate-slide-down">
      <div 
        onClick={() => {
          if (activeToast.groupId) {
            router.push(`/groups/${activeToast.groupId}`);
          }
          setActiveToast(null);
        }}
        className="bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-2xl border-2 border-[#145C4B]/20 hover:border-[#145C4B] transition-all cursor-pointer flex items-center justify-between gap-3 group"
      >
        <div className="w-10 h-10 rounded-2xl bg-[#F0F7F4] border border-[#E2EFE9] flex items-center justify-center text-[#145C4B] shrink-0 group-hover:bg-[#145C4B] group-hover:text-white transition-colors">
          <Bell className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-extrabold text-sm text-gray-900 leading-tight truncate">
            {activeToast.title}
          </h4>
          <p className="text-xs text-gray-600 font-medium mt-0.5 line-clamp-2 leading-snug">
            {activeToast.body}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setActiveToast(null);
            }}
            className="p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
