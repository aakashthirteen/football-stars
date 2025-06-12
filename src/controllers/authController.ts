import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { database } from '../models/databaseFactory';
import { hashPassword, comparePassword, generateToken } from '../utils/auth';
import { LoginRequest, RegisterRequest, User, Player } from '../types';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password }: RegisterRequest = req.body;

    // Validation
    if (!name || !email || !password) {
      res.status(400).json({ error: 'Name, email, and password are required' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters' });
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
      await database.createPlayer(createdUser.id, name, 'MID', 'RIGHT');
    } catch (error) {
      console.error('Error creating player profile:', error);
      // Continue with registration even if player creation fails
    }

    // Generate token
    const token = generateToken(createdUser.id);

    res.status(201).json({
      user: { id: createdUser.id, email: createdUser.email, name: createdUser.name },
      token,
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

    // Generate token
    const token = generateToken(user.id);

    res.json({
      user: { id: user.id, email: user.email, name: user.name },
      token,
      message: 'Login successful',
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};