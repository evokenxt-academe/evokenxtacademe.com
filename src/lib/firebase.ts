import { initializeApp, getApps, getApp } from 'firebase/app';
import { getMessaging, isSupported } from 'firebase/messaging';

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/** Returns true only when every required FCM env var is present. */
function isFirebaseConfigured(): boolean {
  return !!(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
  );
}

export const firebaseApp = isFirebaseConfigured()
  ? getApps().length > 0
    ? getApp()
    : initializeApp(firebaseConfig)
  : null;

/**
 * Get Firebase Messaging instance. Returns null if called during SSR or
 * in a browser that doesn't support the Push API.
 */
export async function getFirebaseMessaging() {
  if (!firebaseApp) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Firebase] Missing config — set NEXT_PUBLIC_FIREBASE_* env vars in .env.local');
    }
    return null;
  }
  const supported = await isSupported();
  if (!supported) return null;
  return getMessaging(firebaseApp);
}
