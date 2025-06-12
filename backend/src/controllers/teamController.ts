import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { database } from '../models/databaseFactory';
import { AuthRequest, CreateTeamRequest, Team } from '../types';

export const getUserTeams = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const teams = await database.getTeamsByUserId(req.user.id);
    
    // Get team players for each team
    const teamsWithPlayers = await Promise.all(teams.map(async team => {
      const teamPlayers = await database.getTeamPlayers(team.id);
      const playersWithDetails = await Promise.all(teamPlayers.map(async tp => {
        const player = await database.getPlayerById(tp.playerId);
        return {
          ...tp,
          player,
        };
      }));
      
      return {
        ...team,
        players: playersWithDetails,
      };
    }));

    res.json({ teams: teamsWithPlayers });
  } catch (error) {
    console.error('Get teams error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createTeam = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { name, description }: CreateTeamRequest = req.body as CreateTeamRequest;

    if (!name) {
      res.status(400).json({ error: 'Team name is required' });
      return;
    }

    const team: Team = {
      id: uuidv4(),
      name,
      description,
      createdBy: req.user.id,
      createdAt: new Date(),
    };

    const createdTeam = await database.createTeam(name, description || '', req.user.id);

    // Add the creator as team captain
    const userPlayer = await database.getPlayerByUserId(req.user.id);
    if (userPlayer) {
      const teamPlayer = {
        id: uuidv4(),
        teamId: createdTeam.id,
        playerId: userPlayer.id,
        role: 'CAPTAIN' as const,
        jerseyNumber: 1,
        joinedAt: new Date(),
      };
      await database.addPlayerToTeam(teamPlayer);
    }

    res.status(201).json({
      team: createdTeam,
      message: 'Team created successfully',
    });
  } catch (error) {
    console.error('Create team error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getTeamById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const team = await database.getTeamById(id);
    if (!team) {
      res.status(404).json({ error: 'Team not found' });
      return;
    }

    // Get team players
    const teamPlayers = await database.getTeamPlayers(id);
    const playersWithDetails = await Promise.all(teamPlayers.map(async tp => {
      const player = await database.getPlayerById(tp.playerId);
      return {
        ...tp,
        player,
      };
    }));

    const teamWithPlayers = {
      ...team,
      players: playersWithDetails,
    };

    res.json({ team: teamWithPlayers });
  } catch (error) {
    console.error('Get team error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};