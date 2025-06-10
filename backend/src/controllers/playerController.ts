import { Response } from 'express';
import { sqliteDb } from '../models/sqliteDatabase';
import { AuthRequest } from '../types';

export const getCurrentPlayer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const player = await sqliteDb.getPlayerByUserId(req.user.id);
    if (!player) {
      res.status(404).json({ error: 'Player profile not found' });
      return;
    }

    res.json({ player });
  } catch (error) {
    console.error('Get current player error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateCurrentPlayer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const player = await sqliteDb.getPlayerByUserId(req.user.id);
    if (!player) {
      res.status(404).json({ error: 'Player profile not found' });
      return;
    }

    const {
      name,
      position,
      preferredFoot,
      dateOfBirth,
      height,
      weight,
      bio,
      location
    } = req.body;

    // Validate position if provided
    if (position && !['GK', 'DEF', 'MID', 'FWD'].includes(position)) {
      res.status(400).json({ error: 'Invalid position. Must be GK, DEF, MID, or FWD' });
      return;
    }

    // Validate preferred foot if provided
    if (preferredFoot && !['LEFT', 'RIGHT', 'BOTH'].includes(preferredFoot)) {
      res.status(400).json({ error: 'Invalid preferred foot. Must be LEFT, RIGHT, or BOTH' });
      return;
    }

    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (position !== undefined) updates.position = position;
    if (preferredFoot !== undefined) updates.preferredFoot = preferredFoot;
    if (dateOfBirth !== undefined) updates.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : undefined;
    if (height !== undefined) updates.height = height ? parseInt(height, 10) : null;
    if (weight !== undefined) updates.weight = weight ? parseInt(weight, 10) : null;
    if (bio !== undefined) updates.bio = bio;
    if (location !== undefined) updates.location = location;

    const updatedPlayer = await sqliteDb.updatePlayer(player.id, updates);

    res.json({
      player: updatedPlayer,
      message: 'Player profile updated successfully'
    });
  } catch (error) {
    console.error('Update player error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getPlayerById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    
    const player = await sqliteDb.getPlayerById(id);
    if (!player) {
      res.status(404).json({ error: 'Player not found' });
      return;
    }

    res.json({ player });
  } catch (error) {
    console.error('Get player by ID error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};