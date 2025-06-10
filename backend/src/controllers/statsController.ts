import { Response } from 'express';
import { sqliteDb } from '../models/sqliteDatabase';
import { AuthRequest } from '../types';

export const getPlayerStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { playerId } = req.params;
    
    if (!playerId) {
      res.status(400).json({ error: 'Player ID is required' });
      return;
    }

    // Verify player exists
    const player = await sqliteDb.getPlayerById(playerId);
    if (!player) {
      res.status(404).json({ error: 'Player not found' });
      return;
    }

    const stats = await sqliteDb.getPlayerStats(playerId);

    res.json({
      playerId,
      playerName: player.name,
      position: player.position,
      ...stats,
    });
  } catch (error) {
    console.error('Get player stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getCurrentUserStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Get the player profile for the current user
    const player = await sqliteDb.getPlayerByUserId(req.user.id);
    if (!player) {
      res.status(404).json({ error: 'Player profile not found for current user' });
      return;
    }

    const stats = await sqliteDb.getPlayerStats(player.id);

    res.json({
      playerId: player.id,
      playerName: player.name,
      position: player.position,
      ...stats,
    });
  } catch (error) {
    console.error('Get current user stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getAllPlayersStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const stats = await sqliteDb.getAllPlayersStats();

    res.json({ players: stats });
  } catch (error) {
    console.error('Get all players stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getTeamPlayersStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { teamId } = req.params;
    
    if (!teamId) {
      res.status(400).json({ error: 'Team ID is required' });
      return;
    }

    // Verify team exists
    const team = await sqliteDb.getTeamById(teamId);
    if (!team) {
      res.status(404).json({ error: 'Team not found' });
      return;
    }

    const stats = await sqliteDb.getTeamPlayersStats(teamId);

    res.json({
      teamId,
      teamName: team.name,
      players: stats,
    });
  } catch (error) {
    console.error('Get team players stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getLeaderboard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { type = 'goals', limit = '10' } = req.query;
    const limitNumber = parseInt(limit as string, 10) || 10;

    const allStats = await sqliteDb.getAllPlayersStats();
    
    // Sort based on type
    let sortedStats;
    switch (type) {
      case 'assists':
        sortedStats = allStats.sort((a, b) => b.assists - a.assists || b.goals - a.goals);
        break;
      case 'matches':
        sortedStats = allStats.sort((a, b) => b.matchesPlayed - a.matchesPlayed || b.goals - a.goals);
        break;
      case 'minutes':
        sortedStats = allStats.sort((a, b) => b.minutesPlayed - a.minutesPlayed || b.goals - a.goals);
        break;
      case 'goals':
      default:
        sortedStats = allStats.sort((a, b) => b.goals - a.goals || b.assists - a.assists);
        break;
    }

    const leaderboard = sortedStats.slice(0, limitNumber);

    res.json({
      type,
      limit: limitNumber,
      leaderboard,
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};