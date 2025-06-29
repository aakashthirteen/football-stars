import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { randomBytes } from 'crypto';

export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

export const generateAccessToken = (userId: string): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT secret not configured');
  }

  const options: SignOptions = { 
    expiresIn: '15m' // Short-lived access token
  };
  return jwt.sign({ userId, type: 'access' }, secret, options);
};

export const generateRefreshToken = (): string => {
  // Generate a secure random token for refresh tokens
  return randomBytes(40).toString('hex');
};

// Legacy token generation for backward compatibility
export const generateToken = (userId: string): string => {
  return generateAccessToken(userId);
};

export const verifyToken = (token: string): { userId: string; type?: string } => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT secret not configured');
  }

  try {
    const decoded = jwt.verify(token, secret) as { userId: string; type?: string };
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

export const getRefreshTokenExpiry = (): Date => {
  const expiryDays = parseInt(process.env.REFRESH_TOKEN_EXPIRES_DAYS || '30');
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + expiryDays);
  return expiry;
};