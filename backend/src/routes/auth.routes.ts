import { Router } from 'express';
import prisma from '../prisma/client';
import { googleClient, GOOGLE_CLIENT_ID } from '../utils/googleClient.util';
import { signJwt, verifyJwt, decodeJwt } from '../utils/jwt.util';
import { authenticateJWT } from '../middleware/auth'
import { encrypt, decrypt } from '../utils/encryption.util';

import { Response } from 'express';
import { AuthRequest } from '../types/express';

const router = Router();
const FRONTEND_REDIRECT = process.env.FRONTEND_REDIRECT!;

router.get('/google', (req, res) => {
  const url = googleClient.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['profile', 'email'],
  });
  res.redirect(url);
});

router.get('/google/callback', async (req, res) => {
  const code = req.query.code as string;
  if (!code) {
    console.error('[auth] Missing authorization code');
    return res.status(400).send('Missing code');
  }

  try {
    console.log('[auth] Exchanging code for tokens...');
    const { tokens } = await googleClient.getToken(code);
    const idToken = tokens.id_token;
    const refreshToken = tokens.refresh_token;

    if (!idToken) {
      console.error('[auth] Missing ID token in response');
      throw new Error('Missing ID token');
    }

    console.log('[auth] Verifying ID token...');
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      console.error('[auth] Invalid payload from ID token');
      throw new Error('Invalid ID token');
    }

    console.log('[auth] Upserting user:', payload.email);
    
    // Encrypt the Google refresh token before storing
    const encryptedRefreshToken = refreshToken ? encrypt(refreshToken) : '';
    
    const user = await prisma.user.upsert({
      where: { googleId: payload.sub },
      update: {
        email: payload.email,
        name: payload.name || '',
        picture: payload.picture || '',
        refreshToken: encryptedRefreshToken || undefined,
      },
      create: {
        googleId: payload.sub,
        email: payload.email,
        name: payload.name || '',
        picture: payload.picture || '',
        refreshToken: encryptedRefreshToken,
      },
    });

    console.log('[auth] Generating JWT for user ID:', user.id);
    const customJwt = signJwt(user);

    console.log('[auth] Redirecting to frontend with JWT in query param');
    const redirectUrl = new URL(FRONTEND_REDIRECT);
    redirectUrl.searchParams.set('jwt', customJwt);
    res.redirect(redirectUrl.toString());
  } catch (err) {
    console.error('[auth] Callback error:', err);
    console.error('[auth] Error stack:', err instanceof Error ? err.stack : 'No stack trace');
    res.status(500).send('Authentication failed');
  }
});

router.post('/guest', async (req, res) => {
  try {
    let guestUser = await prisma.user.findUnique({
      where: { email: 'guest@cosmicengine' }
    });

    if (!guestUser) {
      guestUser = await prisma.user.create({
        data: {
          email: 'guest@cosmicengine',
          name: 'Guest User',
          password: 'guest',
          googleId: null,
        }
      });
    }

    const customJwt = signJwt(guestUser);
    
    res.json({
      success: true,
      token: customJwt,
      user: {
        id: guestUser.id,
        email: guestUser.email,
        name: guestUser.name,
        picture: guestUser.picture,
      }
    });
  } catch (err) {
    console.error('[auth] Guest login error:', err);
    res.status(500).json({ error: 'Guest login failed' });
  }
});

router.post('/refresh', async (req, res) => {
  const authHeader = req.headers.authorization as string | undefined;
  let oldToken: string | undefined;
  if (authHeader?.startsWith('Bearer ')) {
    oldToken = authHeader.split(' ')[1];
  }
  if (!oldToken && req.cookies?.jwt) oldToken = req.cookies.jwt;
  if (!oldToken) return res.status(400).json({ error: 'Missing token' });

  let payload: any;
  try {
    // If token is still valid, return it as-is
    payload = verifyJwt(oldToken);
    return res.status(200).json({ token: oldToken });
  } catch (err: any) {
    if (err.name !== 'TokenExpiredError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    payload = decodeJwt(oldToken);
  }

  if (!payload?.userId) {
    return res.status(401).json({ error: 'Cannot refresh token' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user?.refreshToken) {
      return res.status(401).json({ error: 'No refresh token stored' });
    }

    const decryptedRefreshToken = decrypt(user.refreshToken);
    
    googleClient.setCredentials({ refresh_token: decryptedRefreshToken });
    try {
      await googleClient.refreshAccessToken();
    } catch (googleErr) {
      console.error('[refresh] Google refresh token invalid or revoked:', googleErr);
      return res.status(401).json({ error: 'Google refresh token invalid or revoked' });
    }

    const newJwt = signJwt(user);
    res.status(200).json({ token: newJwt });
  } catch (err) {
    console.error('[refresh] Error refreshing token:', err);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
});



router.post('/logout', authenticateJWT, async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });

    return res.status(200).json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('Logout error:', err);
    return res.status(500).json({ message: 'Failed to logout' });
  }
});

router.get('/me', authenticateJWT, async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  return res.status(200).json({
    user: {
      userId: req.user.userId,
      email: req.user.email,
      name: req.user.name,
      picture: req.user.picture,
    }
  });
});

export default router;
