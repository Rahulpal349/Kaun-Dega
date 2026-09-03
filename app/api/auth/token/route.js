import { NextResponse } from 'next/server';
import * as admin from 'firebase-admin';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

import fs from 'fs';
import path from 'path';

// Fix for Next.js CommonJS/ESM interop with firebase-admin
const firebaseAdmin = admin.default || admin;

// Initialize Firebase Admin (only once)
if (!firebaseAdmin.apps.length) {
  try {
    let serviceAccount = null;
    const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT;
    
    if (serviceAccountStr) {
      serviceAccount = JSON.parse(serviceAccountStr);
    } else {
      // Fallback: look for a local file (useful for local development)
      const localKeyPath = path.join(process.cwd(), 'serviceAccountKey.json');
      if (fs.existsSync(localKeyPath)) {
        serviceAccount = JSON.parse(fs.readFileSync(localKeyPath, 'utf8'));
        console.log("Loaded Firebase service account from local serviceAccountKey.json");
      }
    }

    if (serviceAccount) {
      firebaseAdmin.initializeApp({
        credential: firebaseAdmin.credential.cert(serviceAccount)
      });
    } else {
      console.warn("FIREBASE_SERVICE_ACCOUNT env variable is not set and serviceAccountKey.json was not found. Custom token minting will fail.");
    }
  } catch (error) {
    console.error("Failed to initialize Firebase Admin:", error);
  }
}

// Utility to match the existing UUID generation logic in api.js
async function firebaseUidToUuid(uid) {
  const hash = crypto.createHash('sha256').update(uid).digest('hex');
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`;
}

export async function POST(request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid Authorization header' }, { status: 401 });
    }

    const firebaseToken = authHeader.split('Bearer ')[1];

    if (!firebaseAdmin.apps.length) {
      return NextResponse.json({ error: 'Firebase Admin not initialized. Please configure FIREBASE_SERVICE_ACCOUNT.' }, { status: 500 });
    }

    // Verify Firebase token
    const decodedToken = await firebaseAdmin.auth().verifyIdToken(firebaseToken);
    
    // Hash the UID to match the Supabase profiles.id
    const userUuid = await firebaseUidToUuid(decodedToken.uid);

    // Ensure Supabase JWT secret is available
    const supabaseSecret = process.env.SUPABASE_JWT_SECRET;
    if (!supabaseSecret) {
      return NextResponse.json({ error: 'SUPABASE_JWT_SECRET is not configured' }, { status: 500 });
    }

    // Create the Supabase custom JWT
    const payload = {
      aud: 'authenticated',
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24), // 24 hour expiration
      sub: userUuid,
      email: decodedToken.email,
      role: 'authenticated'
    };

    const supabaseToken = jwt.sign(payload, supabaseSecret, { algorithm: 'HS256' });

    return NextResponse.json({ token: supabaseToken, uuid: userUuid });
  } catch (error) {
    console.error("Token exchange failed:", error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
  }
}
