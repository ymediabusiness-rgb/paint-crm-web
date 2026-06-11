import { NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

export async function POST(req: Request) {
  try {
    // Initialize admin if not already initialized
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

    const { email, password, displayName, role, territory } = await req.json();

    if (!email || !password || !displayName || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Create user in Firebase Auth using Admin SDK
    const userRecord = await getAuth().createUser({
      email,
      password,
      displayName,
    });

    // 2. Create user's Firestore document
    await getFirestore().collection('users').doc(userRecord.uid).set({
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
