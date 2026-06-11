import { NextResponse } from 'next/server';
import { initAdmin } from '@/lib/firebaseAdmin';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

export async function POST(req: Request) {
  try {
    initAdmin();
    const adminAuth = getAuth();
    const adminDb = getFirestore();
    const { uid, email, password, displayName, role, territory } = await req.json();

    if (!uid) {
      return NextResponse.json({ error: 'UID is required' }, { status: 400 });
    }

    // 1. Update user in Firebase Auth using Admin SDK if password or displayName is provided
    const authUpdatePayload: any = {};
    if (password) authUpdatePayload.password = password;
    if (displayName) authUpdatePayload.displayName = displayName;
    
    if (Object.keys(authUpdatePayload).length > 0) {
      await adminAuth.updateUser(uid, authUpdatePayload);
    }

    // 2. Update user's Firestore document (without storing the password!)
    const dbUpdatePayload: any = {};
    if (displayName) dbUpdatePayload.displayName = displayName;
    if (territory) dbUpdatePayload.territory = territory;

    if (Object.keys(dbUpdatePayload).length > 0) {
      await adminDb.collection('users').doc(uid).update(dbUpdatePayload);
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
