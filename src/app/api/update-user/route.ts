import { NextResponse } from 'next/server';
import * as admin from 'firebase-admin';

export async function POST(req: Request) {
  try {
    try {
      admin.app();
    } catch {
      let pk = process.env.FIREBASE_PRIVATE_KEY || '';
      if (pk.startsWith('"') && pk.endsWith('"')) {
        pk = pk.slice(1, -1);
      }
      pk = pk.replace(/\\n/g, '\n');

      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID as string,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL as string,
          privateKey: pk,
        }),
      });
    }

    const { uid, email, password, displayName, role, territory } = await req.json();

    if (!uid) {
      return NextResponse.json({ error: 'UID is required' }, { status: 400 });
    }

    // 1. Update user in Firebase Auth using Admin SDK if password or displayName is provided
    const authUpdatePayload: any = {};
    if (password) authUpdatePayload.password = password;
    if (displayName) authUpdatePayload.displayName = displayName;
    
    if (Object.keys(authUpdatePayload).length > 0) {
      await admin.auth().updateUser(uid, authUpdatePayload);
    }

    // 2. Update user's Firestore document (without storing the password!)
    const dbUpdatePayload: any = {};
    if (displayName) dbUpdatePayload.displayName = displayName;
    if (territory) dbUpdatePayload.territory = territory;

    if (Object.keys(dbUpdatePayload).length > 0) {
      await admin.firestore().collection('users').doc(uid).update(dbUpdatePayload);
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
