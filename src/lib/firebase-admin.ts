import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getMessaging, type Messaging } from 'firebase-admin/messaging';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

let adminApp: App | null = null;
let messagingInstance: Messaging | null = null;
let firestoreInstance: Firestore | null = null;

function parseServiceAccount(): Record<string, string> | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (raw) {
    try {
      return JSON.parse(raw) as Record<string, string>;
    } catch {
      console.error('[Firebase Admin] FIREBASE_SERVICE_ACCOUNT is not valid JSON');
      return null;
    }
  }

  const projectId = process.env.FIREBASE_PROJECT_ID ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) return null;

  return { project_id: projectId, client_email: clientEmail, private_key: privateKey };
}

export function getFirebaseAdminApp(): App | null {
  if (adminApp) return adminApp;

  const serviceAccount = parseServiceAccount();
  if (!serviceAccount) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        '[Firebase Admin] Missing credentials — set FIREBASE_SERVICE_ACCOUNT or FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY',
      );
    }
    return null;
  }

  adminApp =
    getApps().length > 0
      ? getApps()[0]!
      : initializeApp({
          credential: cert(serviceAccount as Parameters<typeof cert>[0]),
          projectId: serviceAccount.project_id,
        });

  return adminApp;
}

export function getFirebaseAdminMessaging(): Messaging | null {
  if (messagingInstance) return messagingInstance;

  const app = getFirebaseAdminApp();
  if (!app) return null;

  messagingInstance = getMessaging(app);
  return messagingInstance;
}

export function getFirebaseAdminFirestore(): Firestore | null {
  if (firestoreInstance) return firestoreInstance;

  const app = getFirebaseAdminApp();
  if (!app) return null;

  firestoreInstance = getFirestore(app);
  return firestoreInstance;
}

