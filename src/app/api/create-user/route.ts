import { NextResponse } from 'next/server';
import { initAdmin } from '@/lib/firebaseAdmin';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

export async function POST(req: Request) {
  try {
    initAdmin();
    const adminAuth = getAuth();
    const adminDb = getFirestore();
    const { email, password, displayName, role, territory } = await req.json();

    if (!email || !password || !displayName || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Create user in Firebase Auth using Admin SDK
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName,
    });

    // 2. Create user's Firestore document (without storing the password!)
    await adminDb.collection('users').doc(userRecord.uid).set({
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
