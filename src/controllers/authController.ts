import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { database } from '../models/databaseFactory';
import { hashPassword, comparePassword, generateAccessToken, generateRefreshToken, getRefreshTokenExpiry, verifyToken } from '../utils/auth';
import { LoginRequest, RegisterRequest, User, Player } from '../types';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, phoneNumber }: RegisterRequest = req.body;

    // Validation
    if (!name || !email || !password || !phoneNumber) {
      res.status(400).json({ error: 'Name, email, password, and phone number are required' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters' });
      return;
    }

    // Validate phone number format (basic validation)
    const phoneRegex = /^[+]?[\d\s-()]+$/;
    if (!phoneRegex.test(phoneNumber) || phoneNumber.length < 10) {
      res.status(400).json({ error: 'Please provide a valid phone number' });
      return;
    }

    // Check if user already exists
    const existingUser = await database.getUserByEmail(email);
    if (existingUser) {
      res.status(400).json({ error: 'User with this email already exists' });
      return;
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const createdUser = await database.createUser(email, passwordHash, name);

    // Create player profile for the user
    try {
      await database.createPlayer(createdUser.id, name, 'MID', 'RIGHT', phoneNumber);
    } catch (error) {
      console.error('Error creating player profile:', error);
      // Continue with registration even if player creation fails
    }

    // Generate tokens
    const accessToken = generateAccessToken(createdUser.id);
    const refreshToken = generateRefreshToken();
    const refreshTokenExpiry = getRefreshTokenExpiry();

    // Store refresh token in database
    await database.createRefreshToken(createdUser.id, refreshToken, refreshTokenExpiry);

    res.status(201).json({
      user: { id: createdUser.id, email: createdUser.email, name: createdUser.name },
      accessToken,
      refreshToken,
      message: 'User registered successfully',
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password }: LoginRequest = req.body;

    // Validation
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    // Find user
    const user = await database.getUserByEmail(email);
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Check password
    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Generate tokens
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken();
    const refreshTokenExpiry = getRefreshTokenExpiry();

    // Store refresh token in database
    await database.createRefreshToken(user.id, refreshToken, refreshTokenExpiry);

    res.json({
      user: { id: user.id, email: user.email, name: user.name },
      accessToken,
      refreshToken,
      message: 'Login successful',
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({ error: 'Refresh token is required' });
      return;
    }

    // Validate refresh token
    const storedToken = await database.getRefreshToken(refreshToken);
    if (!storedToken) {
      res.status(401).json({ error: 'Invalid or expired refresh token' });
      return;
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken(storedToken.user_id);
    const newRefreshToken = generateRefreshToken();
    const refreshTokenExpiry = getRefreshTokenExpiry();

    // Revoke old refresh token and create new one
    await database.revokeRefreshToken(refreshToken);
    await database.createRefreshToken(storedToken.user_id, newRefreshToken, refreshTokenExpiry);

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: {
        id: storedToken.user_id,
        email: storedToken.email,
        name: storedToken.name
      }
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      // Revoke the refresh token
      await database.revokeRefreshToken(refreshToken);
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const logoutAll = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Revoke all refresh tokens for the user
    await database.revokeAllRefreshTokensForUser(userId);

    res.json({ message: 'Logged out from all devices successfully' });
  } catch (error) {
    console.error('Logout all error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};