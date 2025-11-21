import { NextResponse } from 'next/server';
import { setJwtCookie } from '@/lib/auth-cookies';

export async function POST() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/guest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await response.json();

    if (data.success && data.token) {
      await setJwtCookie(data.token);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Guest login failed' }, { status: 500 });
  } catch (error) {
    console.error('[auth/guest] Error:', error);
    return NextResponse.json({ success: false, error: 'Guest login failed' }, { status: 500 });
  }
}
