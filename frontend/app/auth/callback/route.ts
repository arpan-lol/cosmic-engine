import { NextRequest, NextResponse } from 'next/server';
import { setJwtCookie } from '@/lib/auth-cookies';

export async function GET(request: NextRequest) {
  try {
    console.log('[frontend/callback] Request URL:', request.url);
    console.log('[frontend/callback] Host header:', request.headers.get('host'));
    console.log('[frontend/callback] X-Forwarded-Host:', request.headers.get('x-forwarded-host'));
    const searchParams = request.nextUrl.searchParams;
    const jwt = searchParams.get('jwt');

    if (!jwt) {
      console.error('[frontend/callback] No JWT token in query params');
      const baseUrl = getBaseUrl(request);
      return NextResponse.redirect(new URL('/auth/login?error=missing_token', baseUrl));
    }

    console.log('[frontend/callback] Setting JWT cookie');
    await setJwtCookie(jwt);

    console.log('[frontend/callback] Redirecting to dashboard');
    const baseUrl = getBaseUrl(request);
    const dashboardUrl = new URL('/dashboard', baseUrl);
    console.log('[frontend/callback] Dashboard URL:', dashboardUrl.toString());
    return NextResponse.redirect(dashboardUrl);
  } catch (error) {
    console.error('[frontend/callback] Error processing callback:', error);
    const baseUrl = getBaseUrl(request);
    return NextResponse.redirect(new URL('/auth/login?error=callback_failed', baseUrl));
  }
}

function getBaseUrl(request: NextRequest): string {
  // Use NEXT_PUBLIC_FRONTEND_URL if set
  if (process.env.NEXT_PUBLIC_FRONTEND_URL) {
    return process.env.NEXT_PUBLIC_FRONTEND_URL;
  }

  // Use x-forwarded-host if present
  const forwardedHost = request.headers.get('x-forwarded-host');
  if (forwardedHost) {
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    return `${protocol}://${forwardedHost}`;
  }

  // Fallback to request.nextUrl.origin
  return request.nextUrl.origin;
}
