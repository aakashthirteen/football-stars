import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../types';

/**
 * SSE Authentication Middleware
 * Supports both header and query parameter authentication for EventSource
 */
export const sseAuthenticate = async (
  req: Request & { user?: any; token?: string },
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    // First try header authentication (standard method)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
      console.log('🔑 SSE Auth: Token found in header');
    }
    
    // Fallback to query parameter for SSE (React Native EventSource limitation)
    if (!token && req.query.token) {
      token = req.query.token as string;
      console.log('🔑 SSE Auth: Token found in query parameter');
    }

    if (!token) {
      console.log('❌ SSE Auth: No token provided');
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    // Verify token
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = jwt.verify(token, secret) as any;
    
    // Add user info to request
    (req as AuthRequest).user = decoded;
    (req as any).token = token;
    
    console.log('✅ SSE Auth: Token verified for user:', decoded.userId);
    next();
  } catch (error) {
    console.error('❌ SSE Auth: Token verification failed:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};
