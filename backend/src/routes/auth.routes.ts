import { Router, Response } from 'express';
import prisma from '../prisma/client';
import { googleClient, GOOGLE_CLIENT_ID } from '../utils/googleClient.util';
import { signJwt, verifyJwt, decodeJwt } from '../utils/jwt.util';
import { authenticateJWT } from '../middleware/auth'
import { encrypt, decrypt } from '../utils/encryption.util';
import { AuthRequest } from '../types/express';
import { logger } from '../utils/logger.util';
import { UnauthorizedError, ValidationError, ProcessingError } from '../types/errors';
import { asyncHandler } from '../utils/asyncHandler.util';

const router = Router();
const FRONTEND_REDIRECT = process.env.FRONTEND_REDIRECT!;

logger.info('Auth', 'FRONTEND_REDIRECT', { url: FRONTEND_REDIRECT });

router.get('/google', (req, res) => {
  const url = googleClient.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['profile', 'email'],
  });
  res.redirect(url);
});

router.get('/google/callback', asyncHandler(async (req: AuthRequest, res: Response) => {
  const code = req.query.code as string;
  if (!code) {
    logger.error('Auth', 'Missing authorization code');
    return res.status(400).send('Missing code');
  }

  try {
    logger.info('Auth', 'Exchanging code for tokens');
    const { tokens } = await googleClient.getToken(code);
    const idToken = tokens.id_token;
    const refreshToken = tokens.refresh_token;

    if (!idToken) {
      logger.error('Auth', 'Missing ID token in response');
      throw new ProcessingError('Missing ID token');
    }

    logger.info('Auth', 'Verifying ID token');
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      logger.error('Auth', 'Invalid payload from ID token');
      throw new ProcessingError('Invalid ID token');
    }

    logger.info('Auth', 'Upserting user', { email: payload.email });
    
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

    logger.info('Auth', 'Generating JWT', { userId: user.id });
    const customJwt = signJwt(user);

    logger.info('Auth', 'Redirecting to frontend with JWT');
    const redirectUrl = new URL(FRONTEND_REDIRECT);
    redirectUrl.searchParams.set('jwt', customJwt);
    res.redirect(redirectUrl.toString());
  } catch (err) {
    logger.error('Auth', 'Callback error', err instanceof Error ? err : undefined);
    res.status(500).send('Authentication failed');
  }
}));

router.post('/guest', asyncHandler(async (req: AuthRequest, res: Response) => {
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
    logger.error('Auth', 'Guest login error', err instanceof Error ? err : undefined);
    throw new ProcessingError('Guest login failed');
  }
}));

router.post('/refresh', asyncHandler(async (req: AuthRequest, res: Response) => {
  const authHeader = req.headers.authorization as string | undefined;
  let oldToken: string | undefined;
  if (authHeader?.startsWith('Bearer ')) {
    oldToken = authHeader.split(' ')[1];
  }
  if (!oldToken && req.cookies?.jwt) oldToken = req.cookies.jwt;
  if (!oldToken) throw new ValidationError('Missing token');

  let payload: any;
  try {
    payload = verifyJwt(oldToken);
    return res.status(200).json({ token: oldToken });
  } catch (err: any) {
    if (err.name !== 'TokenExpiredError') {
      throw new UnauthorizedError('Invalid token');
    }
    payload = decodeJwt(oldToken);
  }

  if (!payload?.userId) {
    throw new UnauthorizedError('Cannot refresh token');
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user?.refreshToken) {
      throw new UnauthorizedError('No refresh token stored');
    }

    const decryptedRefreshToken = decrypt(user.refreshToken);
    
    googleClient.setCredentials({ refresh_token: decryptedRefreshToken });
    try {
      await googleClient.refreshAccessToken();
    } catch (googleErr) {
      logger.error('Auth', 'Google refresh token invalid or revoked', googleErr instanceof Error ? googleErr : undefined);
      throw new UnauthorizedError('Google refresh token invalid or revoked');
    }

    const newJwt = signJwt(user);
    res.status(200).json({ token: newJwt });
  } catch (err) {
    logger.error('Auth', 'Error refreshing token', err instanceof Error ? err : undefined);
    if (err instanceof UnauthorizedError) throw err;
    throw new ProcessingError('Failed to refresh token');
  }
}));



router.post('/logout', authenticateJWT, asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) throw new UnauthorizedError();

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });

    return res.status(200).json({ message: 'Logged out successfully' });
  } catch (err) {
    logger.error('Auth', 'Logout error', err instanceof Error ? err : undefined, { userId });
    throw new ProcessingError('Failed to logout');
  }
}));

router.get('/me', authenticateJWT, asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new UnauthorizedError();
  }

  return res.status(200).json({
    user: {
      userId: req.user.userId,
      email: req.user.email,
      name: req.user.name,
      picture: req.user.picture,
    }
  });
}));

export default router;
