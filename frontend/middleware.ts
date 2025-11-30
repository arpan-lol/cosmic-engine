import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('jwt')?.value;
  const { pathname } = request.nextUrl;

  const isAuthRoute = pathname.startsWith('/auth/login') || pathname.startsWith('/auth/callback');
  const isProtectedRoute = pathname.startsWith('/dashboard');

  if (isProtectedRoute && !token) {
    console.log('[middleware] No token for protected route, redirecting to login');
    const loginUrl = new URL('/auth/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && token && pathname !== '/auth/callback') {
    console.log('[middleware] Token exists on auth route, redirecting to dashboard');
    const dashboardUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
