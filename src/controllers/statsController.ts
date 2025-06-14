import { Response } from 'express';
import { database } from '../models/databaseFactory';
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
    const player = await database.getPlayerById(playerId);
    if (!player) {
      res.status(404).json({ error: 'Player not found' });
      return;
    }

    const stats = await database.getPlayerStats(playerId);

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
  const requestId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  try {
    console.log(`📊 [${requestId}] getCurrentUserStats called for user:`, req.user?.id);
    
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Get the player profile for the current user
    let player = await database.getPlayerByUserId(req.user.id);
    console.log(`👤 [${requestId}] Player found:`, { id: player?.id, name: player?.name });
    
    // If no player profile exists, create one automatically
    if (!player) {
      console.log(`🔨 [${requestId}] Creating player profile for user:`, req.user.id);
      try {
        player = await database.createPlayer(req.user.id, req.user.name, 'MID', 'RIGHT');
      } catch (createError) {
        console.error('Error creating player profile:', createError);
        res.status(500).json({ error: 'Failed to create player profile' });
        return;
      }
    }

    console.log(`🗃️ [${requestId}] Fetching stats for player:`, player.id);
    const stats = await database.getPlayerStats(player.id);
    console.log(`📈 [${requestId}] Stats retrieved from database:`, stats);

    const responseData = {
      playerId: player.id,
      playerName: player.name,
      position: player.position,
      ...stats,
    };
    
    console.log(`📤 [${requestId}] Sending response:`, responseData);

    res.json(responseData);
  } catch (error) {
    console.error(`❌ [${requestId}] Get current user stats error:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getAllPlayersStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const stats = await database.getAllPlayersStats();

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
    const team = await database.getTeamById(teamId);
    if (!team) {
      res.status(404).json({ error: 'Team not found' });
      return;
    }

    const stats = await database.getTeamPlayersStats(teamId);

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

    const allStats = await database.getAllPlayersStats();
    
    // Map field names from database format to frontend format
    const mappedStats = allStats.map(stat => ({
      playerId: stat.player_id || stat.playerId,
      playerName: stat.player_name || stat.playerName,
      position: stat.position,
      matchesPlayed: stat.matches_played || stat.matchesPlayed,
      goals: stat.goals,
      assists: stat.assists,
      yellowCards: stat.yellow_cards || stat.yellowCards,
      redCards: stat.red_cards || stat.redCards,
      minutesPlayed: stat.minutes_played || stat.minutesPlayed,
    }));
    
    // Sort based on type
    let sortedStats;
    switch (type) {
      case 'assists':
        sortedStats = mappedStats.sort((a, b) => b.assists - a.assists || b.goals - a.goals);
        break;
      case 'matches':
        sortedStats = mappedStats.sort((a, b) => b.matchesPlayed - a.matchesPlayed || b.goals - a.goals);
        break;
      case 'minutes':
        sortedStats = mappedStats.sort((a, b) => b.minutesPlayed - a.minutesPlayed || b.goals - a.goals);
        break;
      case 'goals':
      default:
        sortedStats = mappedStats.sort((a, b) => b.goals - a.goals || b.assists - a.assists);
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