import { NextRequest, NextResponse } from 'next/server';
import { setJwtCookie } from '@/lib/auth-cookies';

export async function GET(request: NextRequest) {
  try {
    console.log('[frontend/callback] Request URL:', request.url);
    const searchParams = request.nextUrl.searchParams;
    const jwt = searchParams.get('jwt');

    if (!jwt) {
      console.error('[frontend/callback] No JWT token in query params');
      return NextResponse.redirect(new URL('/auth/login?error=missing_token', request.url));
    }

    console.log('[frontend/callback] Setting JWT cookie');
    await setJwtCookie(jwt);

    console.log('[frontend/callback] Redirecting to dashboard');
    const dashboardUrl = new URL('/dashboard', request.url);
    console.log('[frontend/callback] Dashboard URL:', dashboardUrl.toString());
    return NextResponse.redirect(dashboardUrl);
  } catch (error) {
    console.error('[frontend/callback] Error processing callback:', error);
    return NextResponse.redirect(new URL('/auth/login?error=callback_failed', request.url));
  }
}
