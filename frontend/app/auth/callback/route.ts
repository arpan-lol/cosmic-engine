import { NextRequest, NextResponse } from 'next/server';
import { setJwtCookie } from '@/lib/auth-cookies';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const jwt = searchParams.get('jwt');

    if (!jwt) {
      console.error('[auth/callback] No JWT token in query params');
      return NextResponse.redirect(new URL('/auth/login?error=missing_token', request.url));
    }

    await setJwtCookie(jwt);

    return NextResponse.redirect(new URL('/dashboard', request.url));
  } catch (error) {
    console.error('[auth/callback] Error processing callback:', error);
    return NextResponse.redirect(new URL('/auth/login?error=callback_failed', request.url));
  }
}
