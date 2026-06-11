import { initializeApp, getApps, cert } from 'firebase-admin/app';
export function initAdmin() {
  if (getApps().length > 0) {
    return;
  }

  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    try {
      let pk = process.env.FIREBASE_PRIVATE_KEY || '';
      // Remove surrounding quotes if Netlify added them
      if (pk.startsWith('"') && pk.endsWith('"')) {
        pk = pk.slice(1, -1);
      }
      pk = pk.replace(/\\n/g, '\n');

      initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: pk,
        }),
      });
    } catch (error) {
      console.error('Firebase admin initialization error', error);
    }
  } else {
    throw new Error('Firebase Admin SDK: Missing environment variables (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY). Please add them to your .env.local file.');
  }
}
