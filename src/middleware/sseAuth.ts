import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../types';

/**
 * SSE Authentication middleware that accepts tokens from:
 * 1. Authorization header (preferred)
 * 2. Query parameter ?token=... (fallback for EventSource)
 */
export const sseAuthenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    let token: string | undefined;

    // Try Authorization header first
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
      console.log('🔑 SSE Auth: Using token from header');
    }
    
    // Fallback to query parameter
    if (!token && req.query.token) {
      token = req.query.token as string;
      console.log('🔑 SSE Auth: Using token from query parameter');
    }

    if (!token) {
      console.error('❌ SSE Auth: No token provided');
      res.status(401).json({ error: 'Access token required' });
      return;
    }

    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = jwt.verify(token, secret) as any;
    
    req.user = {
      id: decoded.id,
      username: decoded.username
    };
    
    console.log(`✅ SSE Auth: Token verified for user ${decoded.username}`);
    next();
  } catch (error) {
    console.error('❌ SSE Auth: Token verification failed:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};