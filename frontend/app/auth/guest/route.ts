import { NextResponse } from 'next/server';
import { setJwtCookie } from '@/lib/auth-cookies';

export async function POST() {
  try {
    console.log('[auth/guest] Attempting guest login');
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3006'}/auth/guest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await response.json();

    if (data.success && data.token) {
      console.log('[auth/guest] Guest login successful, setting cookie');
      await setJwtCookie(data.token);
      return NextResponse.json({ success: true });
    }

    console.error('[auth/guest] Guest login failed:', data);
    return NextResponse.json({ success: false, error: 'Guest login failed' }, { status: 500 });
  } catch (error) {
    console.error('[auth/guest] Error:', error);
    return NextResponse.json({ success: false, error: 'Guest login failed' }, { status: 500 });
  }
}
