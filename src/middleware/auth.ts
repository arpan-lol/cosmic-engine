import { Request, Response, NextFunction } from 'express';

export default function verifyAuth(req: Request, res: Response, next: NextFunction) {
  const token = process.env.AUTH_TOKEN;
  const authHeader = req.headers.authorization;

  if (authHeader === `Bearer ${token}`) {
    return next();
  }

  return res.status(401).json({ error: 'Unauthorized' });
}