import { NextResponse } from 'next/server';
import * as admin from 'firebase-admin';

export async function POST(req: Request) {
  try {
    // Initialize admin if not already initialized
    if (admin.apps.length === 0) {
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

    const { email, password, displayName, role, territory } = await req.json();

    if (!email || !password || !displayName || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Create user in Firebase Auth using Admin SDK
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName,
    });

    // 2. Create user's Firestore document
    await admin.firestore().collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email: userRecord.email,
      displayName,
      role,
      territory: territory || "Unassigned",
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true, uid: userRecord.uid, message: 'User created successfully' }, { status: 201 });

  } catch (error: any) {
    console.error("Create user error:", error);
    return NextResponse.json(
      { error: 'Failed to create user', details: error.message }, 
      { status: 500 }
    );
  }
}
