import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { database } from '../models/databaseFactory';
import { AuthRequest } from '../types';
import { verifyToken } from '../utils/auth';

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({ error: 'Access token required' });
      return;
    }

    const decoded = verifyToken(token);
    const user = await database.getUserById(decoded.userId);

    if (!user) {
      res.status(401).json({ error: 'Invalid token - user not found' });
      return;
    }

    req.user = user;
    next();
  } catch (error: any) {
    // Provide more specific error messages for different token failures
    if (error.name === 'TokenExpiredError') {
      res.status(401).json({ 
        error: 'Access token expired',
        code: 'TOKEN_EXPIRED'
      });
    } else if (error.name === 'JsonWebTokenError') {
      res.status(401).json({ 
        error: 'Invalid access token',
        code: 'TOKEN_INVALID'
      });
    } else {
      res.status(401).json({ 
        error: 'Token verification failed',
        code: 'TOKEN_VERIFICATION_FAILED'
      });
    }
  }
};