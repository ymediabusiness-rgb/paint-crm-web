import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const res = await fetch("http://127.0.0.1:3000/api/delete-user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ uid: "test" })
    });
    
    const text = await res.text();
    return NextResponse.json({ status: res.status, body: text });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
