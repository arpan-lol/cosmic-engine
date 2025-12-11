import { cookies } from 'next/headers';

const JWT_COOKIE_NAME = 'jwt';

export interface CookieOptions {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'lax' | 'strict' | 'none';
  maxAge?: number;
  path?: string;
  domain?: string;
}

const defaultOptions: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: 12 * 60 * 60,
  domain: process.env.NODE_ENV === 'production' ? '.arpantaneja.dev' : undefined,
};

export async function setJwtCookie(token: string, options: CookieOptions = {}) {
  const cookieStore = await cookies();
  const finalOptions = { ...defaultOptions, ...options };
  
  cookieStore.set(JWT_COOKIE_NAME, token, finalOptions);
}

export async function getJwtCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(JWT_COOKIE_NAME)?.value;
}

export async function deleteJwtCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(JWT_COOKIE_NAME);
}
