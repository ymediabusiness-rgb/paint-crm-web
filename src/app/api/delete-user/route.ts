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

    const body = await req.json();
    const { uid } = body;

    if (!uid) {
      return NextResponse.json({ error: 'UID is required' }, { status: 400 });
    }

    try {
      await admin.auth().deleteUser(uid);
    } catch (e: any) {
      if (e.code !== 'auth/user-not-found') {
        throw e;
      }
    }

    await admin.firestore().collection('users').doc(uid).delete();

    return NextResponse.json({ success: true, message: 'User deleted successfully' }, { status: 200 });

  } catch (error: any) {
    console.error("Delete user error:", error);
    return NextResponse.json(
      { error: 'Failed to delete user', details: error.message }, 
      { status: 500 }
    );
  }
}
