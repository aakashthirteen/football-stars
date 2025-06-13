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
    
    // Get team players for each team (now includes full player details)
    const teamsWithPlayers = await Promise.all(teams.map(async team => {
      const teamPlayers = await database.getTeamPlayers(team.id);
      return {
        ...team,
        players: teamPlayers,
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

    // Get team players (now includes full player details)
    const teamPlayers = await database.getTeamPlayers(id);
    console.log(`📊 Found ${teamPlayers.length} players for team ${id}`);
    console.log('👥 Team players data:', JSON.stringify(teamPlayers, null, 2));

    const teamWithPlayers = {
      ...team,
      players: teamPlayers,
    };

    console.log('🏆 Final team response:', JSON.stringify(teamWithPlayers, null, 2));
    res.json({ team: teamWithPlayers });
  } catch (error) {
    console.error('Get team error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getAllTeams = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const teams = await database.getAllTeams();
    
    // Get team players for each team (now includes full player details)
    const teamsWithPlayers = await Promise.all(teams.map(async team => {
      const teamPlayers = await database.getTeamPlayers(team.id);
      return {
        ...team,
        players: teamPlayers,
        playerCount: teamPlayers.length,
      };
    }));

    res.json({ teams: teamsWithPlayers });
  } catch (error) {
    console.error('Get all teams error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const addPlayerToTeam = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const { playerId, role = 'PLAYER', jerseyNumber } = req.body;

    console.log('🏃‍♂️ Adding player to team:', { teamId: id, playerId, role, jerseyNumber });

    if (!playerId) {
      res.status(400).json({ error: 'Player ID is required' });
      return;
    }

    // Check if team exists
    const team = await database.getTeamById(id);
    if (!team) {
      console.log('❌ Team not found:', id);
      res.status(404).json({ error: 'Team not found' });
      return;
    }

    // Check if player exists
    const player = await database.getPlayerById(playerId);
    if (!player) {
      console.log('❌ Player not found:', playerId);
      res.status(404).json({ error: 'Player not found' });
      return;
    }

    // Check if player is already in team
    const existingTeamPlayers = await database.getTeamPlayers(id);
    const isPlayerInTeam = existingTeamPlayers.some(tp => tp.player_id === playerId);
    if (isPlayerInTeam) {
      console.log('❌ Player already in team:', playerId);
      res.status(400).json({ error: 'Player is already in this team' });
      return;
    }

    // Auto-assign jersey number if not provided
    let assignedJerseyNumber = jerseyNumber;
    if (!assignedJerseyNumber) {
      const usedNumbers = existingTeamPlayers.map(tp => tp.jersey_number).filter(num => num);
      assignedJerseyNumber = 1;
      while (usedNumbers.includes(assignedJerseyNumber) && assignedJerseyNumber <= 99) {
        assignedJerseyNumber++;
      }
    } else {
      // Check if jersey number is already taken
      const isJerseyTaken = existingTeamPlayers.some(tp => tp.jersey_number === assignedJerseyNumber);
      if (isJerseyTaken) {
        res.status(400).json({ error: `Jersey number ${assignedJerseyNumber} is already taken` });
        return;
      }
    }

    const teamPlayer = {
      id: uuidv4(),
      teamId: id,
      playerId,
      role: role as 'CAPTAIN' | 'VICE_CAPTAIN' | 'PLAYER',
      jerseyNumber: assignedJerseyNumber,
      joinedAt: new Date(),
    };

    console.log('💾 Saving team player:', teamPlayer);
    const savedTeamPlayer = await database.addPlayerToTeam(teamPlayer);
    console.log('✅ Player added successfully:', savedTeamPlayer);

    res.status(201).json({
      message: 'Player added to team successfully',
      teamPlayer: savedTeamPlayer,
    });
  } catch (error: any) {
    console.error('❌ Add player to team error:', error);
    
    // Handle specific database errors
    if (error.code === '23505') { // Unique constraint violation
      if (error.constraint === 'team_players_team_id_player_id_key') {
        res.status(400).json({ error: 'Player is already in this team' });
      } else if (error.constraint === 'team_players_team_id_jersey_number_key') {
        res.status(400).json({ error: 'Jersey number is already taken' });
      } else {
        res.status(400).json({ error: 'Duplicate entry detected' });
      }
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export const removePlayerFromTeam = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id, playerId } = req.params;

    console.log('🗑️ Removing player from team:', { teamId: id, playerId });

    // Check if team exists
    const team = await database.getTeamById(id);
    if (!team) {
      console.log('❌ Team not found:', id);
      res.status(404).json({ error: 'Team not found' });
      return;
    }

    // Check if player is in team
    const teamPlayers = await database.getTeamPlayers(id);
    console.log('👥 Current team players:', teamPlayers.map(tp => ({ 
      id: tp.id, 
      playerId: tp.player_id, 
      playerName: tp.player?.name 
    })));
    
    const teamPlayer = teamPlayers.find(tp => tp.player_id === playerId);
    if (!teamPlayer) {
      console.log('❌ Player not found in team. Looking for playerId:', playerId);
      res.status(404).json({ error: 'Player not found in team' });
      return;
    }

    console.log('✅ Found player in team, removing...');
    await database.removePlayerFromTeam(id, playerId);

    res.json({ message: 'Player removed from team successfully' });
  } catch (error) {
    console.error('❌ Remove player from team error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getAvailablePlayers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { teamId } = req.query;
    
    const allPlayers = await database.getAllPlayers();
    
    if (teamId) {
      // If team ID is provided, exclude players already in that team
      const teamPlayers = await database.getTeamPlayers(teamId as string);
      const teamPlayerIds = teamPlayers.map(tp => tp.playerId);
      const availablePlayers = allPlayers.filter(player => !teamPlayerIds.includes(player.id));
      res.json({ players: availablePlayers });
    } else {
      // Return all players
      res.json({ players: allPlayers });
    }
  } catch (error) {
    console.error('Get available players error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};