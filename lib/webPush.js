import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { doc, updateDoc, arrayUnion, setDoc } from 'firebase/firestore';
import { app, db } from './firebase';

export async function isNotificationSupported() {
  if (typeof window === 'undefined') return false;
  return 'Notification' in window && 'serviceWorker' in navigator && (await isSupported().catch(() => false));
}

export function getNotificationPermissionState() {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission; // 'default' | 'granted' | 'denied'
}

export async function requestAndRegisterPushNotifications(userId) {
  if (!userId || typeof window === 'undefined' || !('Notification' in window)) return null;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Notification permission not granted:', permission);
      return null;
    }

    const supported = await isSupported().catch(() => false);
    if (!supported) {
      console.warn('Firebase Messaging not supported in this browser environment.');
      return null;
    }

    const messaging = getMessaging(app);

    // Get registration from service worker
    let swRegistration;
    if ('serviceWorker' in navigator) {
      swRegistration = await navigator.serviceWorker.ready.catch(() => undefined);
    }

    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    const tokenOptions = {
      ...(vapidKey ? { vapidKey } : {}),
      ...(swRegistration ? { serviceWorkerRegistration: swRegistration } : {})
    };

    let fcmToken = null;
    try {
      fcmToken = await getToken(messaging, tokenOptions);
    } catch (tokenErr) {
      console.warn('Could not retrieve FCM token (check VAPID key):', tokenErr.message);
    }

    if (fcmToken) {
      // Save token in Firestore user doc (same array that Flutter mobile app uses)
      try {
        const userRef = doc(db, 'users', userId);
        await setDoc(userRef, {
          fcmTokens: arrayUnion(fcmToken),
          lastTokenUpdated: new Date().toISOString(),
        }, { merge: true });
        console.log('Registered Web FCM Token for user:', userId);
      } catch (saveErr) {
        console.warn('Failed to save FCM token to Firestore:', saveErr.message);
      }
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('kd_notifications_enabled', 'true');
    }

    return fcmToken;
  } catch (err) {
    console.warn('Error in requestAndRegisterPushNotifications:', err);
    return null;
  }
}

export function setupForegroundMessageListener(onMessageReceived) {
  if (typeof window === 'undefined' || !('Notification' in window)) return () => {};

  let unsubscribe = () => {};
  isSupported().then((supported) => {
    if (!supported) return;
    try {
      const messaging = getMessaging(app);
      unsubscribe = onMessage(messaging, (payload) => {
        console.log('Foreground FCM message received:', payload);
        if (onMessageReceived) {
          onMessageReceived(payload);
        }
      });
    } catch (e) {
      console.warn('Foreground message setup notice:', e.message);
    }
  });

  return () => {
    if (unsubscribe) unsubscribe();
  };
}
