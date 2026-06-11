import { NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

export async function POST(req: Request) {
  try {
    if (getApps().length === 0) {
      let pk = process.env.FIREBASE_PRIVATE_KEY || '';
      if (pk.startsWith('"') && pk.endsWith('"')) {
        pk = pk.slice(1, -1);
      }
      pk = pk.replace(/\\n/g, '\n');

      initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID as string,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL as string,
          privateKey: pk,
        }),
      });
    }

    const { uid, password, displayName, territory } = await req.json();

    if (!uid) {
      return NextResponse.json({ error: 'UID is required' }, { status: 400 });
    }

    // 1. Update user in Firebase Auth using Admin SDK if password or displayName is provided
    const authUpdatePayload: any = {};
    if (password) authUpdatePayload.password = password;
    if (displayName) authUpdatePayload.displayName = displayName;
    
    if (Object.keys(authUpdatePayload).length > 0) {
      await getAuth().updateUser(uid, authUpdatePayload);
    }

    // 2. Update user's Firestore document (without storing the password!)
    const dbUpdatePayload: any = {};
    if (displayName) dbUpdatePayload.displayName = displayName;
    if (territory) dbUpdatePayload.territory = territory;

    if (Object.keys(dbUpdatePayload).length > 0) {
      await getFirestore().collection('users').doc(uid).update(dbUpdatePayload);
    }

    return NextResponse.json({ success: true, message: 'User updated successfully' }, { status: 200 });

  } catch (error: any) {
    console.error("Update user error:", error);
    return NextResponse.json(
      { error: 'Failed to update user', details: error.message }, 
      { status: 500 }
    );
  }
}
