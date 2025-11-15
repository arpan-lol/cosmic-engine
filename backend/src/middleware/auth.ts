import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../types/express';

export function authenticateJWT(req: AuthRequest, res: Response, next: NextFunction) {
  // Try to get token from multiple sources
  let token: string | undefined;
  
  const authHeader = req.headers.authorization;
  if (authHeader) {
    token = authHeader.split(' ')[1];
  }
  
  if (!token && req.query.token) {
    token = req.query.token as string;
  }
  
  if (!token && req.cookies?.jwt) {
    token = req.cookies.jwt;
  }
  
  if (!token) {
    return res.sendStatus(401);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as AuthRequest['user'];
    req.user = decoded;
    next();
  } catch {
    return res.sendStatus(403);
  }
}
