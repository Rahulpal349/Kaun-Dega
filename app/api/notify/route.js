import { NextResponse } from 'next/server';
import admin from 'firebase-admin';

// Initialize Firebase Admin singleton
function getFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return admin.apps[0];
  }

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'kaun-dega-3a5cc';

  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const raw = process.env.FIREBASE_SERVICE_ACCOUNT.trim();
      const serviceAccount = raw.startsWith('{') ? JSON.parse(raw) : JSON.parse(Buffer.from(raw, 'base64').toString('utf-8'));
      return admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId,
      });
    } catch (e) {
      console.warn('Error parsing FIREBASE_SERVICE_ACCOUNT:', e.message);
    }
  }

  // Fallback to default credentials or project ID initialization
  try {
    return admin.initializeApp({
      projectId,
    });
  } catch (err) {
    console.warn('Firebase Admin default init warning:', err.message);
    return null;
  }
}

export async function POST(request) {
  try {
    const { targetUserId, targetEmail, title, body, groupId } = await request.json();

    if (!targetUserId && !targetEmail) {
      return NextResponse.json({ error: 'targetUserId or targetEmail required' }, { status: 400 });
    }

    const app = getFirebaseAdmin();
    if (!app) {
      return NextResponse.json({ message: 'Firebase Admin not initialized (skipped push)' }, { status: 200 });
    }

    const firestore = admin.firestore();
    let tokens = [];

    // 1. Fetch user FCM tokens by targetUserId
    if (targetUserId) {
      const userDoc = await firestore.collection('users').doc(targetUserId).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        if (Array.isArray(userData?.fcmTokens)) {
          tokens.push(...userData.fcmTokens);
        }
      }
    }

    // 2. Fallback: Search by email if no tokens found yet
    if (tokens.length === 0 && targetEmail) {
      const cleanEmail = targetEmail.trim().toLowerCase();
      let snap = await firestore.collection('users')
        .where('email_lower', '==', cleanEmail)
        .limit(1)
        .get();
      if (snap.empty) {
        snap = await firestore.collection('users')
          .where('email', '==', targetEmail.trim())
          .limit(1)
          .get();
      }
      if (!snap.empty) {
        const userData = snap.docs[0].data();
        if (Array.isArray(userData?.fcmTokens)) {
          tokens.push(...userData.fcmTokens);
        }
      }
    }

    // De-duplicate valid tokens
    tokens = Array.from(new Set(tokens.filter(t => typeof t === 'string' && t.trim().length > 0)));

    if (tokens.length === 0) {
      return NextResponse.json({ message: 'No registered FCM tokens found for user' }, { status: 200 });
    }

    const targetUrl = groupId ? `/groups/${groupId}` : '/dashboard';

    const message = {
      tokens,
      notification: {
        title: title || 'Kaun Dega? 💸',
        body: body || 'New expense update in your group.',
      },
      data: {
        groupId: groupId || '',
        title: title || 'Kaun Dega? 💸',
        body: body || 'New expense update in your group.',
        click_action: targetUrl,
      },
      webpush: {
        fcmOptions: {
          link: targetUrl,
        },
        notification: {
          icon: '/icon-192x192.png',
          badge: '/icon-192x192.png',
        },
      },
      android: {
        priority: 'high',
        notification: {
          channelId: 'kaun_dega_group_invites',
          icon: 'ic_stat_notification',
          color: '#145C4B',
          clickAction: 'FLUTTER_NOTIFICATION_CLICK',
        },
      },
    };

    const messaging = admin.messaging();
    const response = await messaging.sendEachForMulticast(message);

    // Clean up expired or invalid tokens
    if (response.failureCount > 0 && targetUserId) {
      const staleTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const errCode = resp.error?.code;
          if (
            errCode === 'messaging/registration-token-not-registered' ||
            errCode === 'messaging/invalid-registration-token'
          ) {
            staleTokens.push(tokens[idx]);
          }
        }
      });

      if (staleTokens.length > 0) {
        await firestore.collection('users').doc(targetUserId).update({
          fcmTokens: admin.firestore.FieldValue.arrayRemove(...staleTokens),
        }).catch(() => {});
      }
    }

    return NextResponse.json({
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
    });
  } catch (error) {
    console.warn('API /api/notify error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
