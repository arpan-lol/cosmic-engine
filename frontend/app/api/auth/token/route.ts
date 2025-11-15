import { NextRequest, NextResponse } from 'next/server';
import { getJwtCookie, setJwtCookie, deleteJwtCookie } from '@/lib/auth-cookies';

export async function GET() {
  try {
    const token = await getJwtCookie();
    
    if (!token) {
      return NextResponse.json({ token: null }, { status: 200 });
    }

    return NextResponse.json({ token }, { status: 200 });
  } catch (error) {
    console.error('Error getting token:', error);
    return NextResponse.json({ error: 'Failed to get token' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    await setJwtCookie(token);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error setting token:', error);
    return NextResponse.json({ error: 'Failed to set token' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await deleteJwtCookie();
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error deleting token:', error);
    return NextResponse.json({ error: 'Failed to delete token' }, { status: 500 });
  }
}
