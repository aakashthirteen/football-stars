import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { database } from '../models/databaseFactory';
import { AuthRequest, Tournament } from '../types';

export const getTournaments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // For now, return mock tournaments since we haven't fully implemented tournament storage
    const mockTournaments = [
      {
        id: '1',
        name: 'Summer League 2024',
        description: 'Annual summer tournament for local teams',
        tournamentType: 'LEAGUE',
        startDate: '2024-06-01T00:00:00.000Z',
        endDate: '2024-08-31T23:59:59.999Z',
        maxTeams: 8,
        registeredTeams: 6,
        entryFee: 500,
        prizePool: 3000,
        status: 'UPCOMING',
        createdBy: req.user.id,
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        name: 'Champions Cup',
        description: 'Knockout tournament for the best teams',
        tournamentType: 'KNOCKOUT',
        startDate: '2024-05-15T00:00:00.000Z',
        endDate: '2024-06-15T23:59:59.999Z',
        maxTeams: 16,
        registeredTeams: 12,
        entryFee: 1000,
        prizePool: 10000,
        status: 'ACTIVE',
        createdBy: req.user.id,
        createdAt: new Date().toISOString()
      }
    ];

    res.json({ tournaments: mockTournaments });
  } catch (error) {
    console.error('Get tournaments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createTournament = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const {
      name,
      description,
      tournamentType,
      maxTeams,
      entryFee,
      prizePool,
      startDate,
      endDate
    } = req.body;

    // Validation
    if (!name || !tournamentType || !maxTeams || !startDate || !endDate) {
      res.status(400).json({ 
        error: 'Name, tournament type, max teams, start date, and end date are required' 
      });
      return;
    }

    if (!['LEAGUE', 'KNOCKOUT', 'GROUP_STAGE'].includes(tournamentType)) {
      res.status(400).json({ 
        error: 'Tournament type must be LEAGUE, KNOCKOUT, or GROUP_STAGE' 
      });
      return;
    }

    if (maxTeams < 2) {
      res.status(400).json({ error: 'Tournament must have at least 2 teams' });
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (end <= start) {
      res.status(400).json({ error: 'End date must be after start date' });
      return;
    }

    const tournament = {
      id: uuidv4(),
      name: name.trim(),
      description: description?.trim(),
      tournamentType,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      maxTeams: parseInt(maxTeams),
      entryFee: entryFee ? parseFloat(entryFee) : null,
      prizePool: prizePool ? parseFloat(prizePool) : null,
      status: 'UPCOMING' as const,
      createdBy: req.user.id,
      createdAt: new Date().toISOString(),
      registeredTeams: 0
    };

    // In a real implementation, we would save to database
    // const createdTournament = await sqliteDb.createTournament(tournament);

    res.status(201).json({
      tournament,
      message: 'Tournament created successfully'
    });
  } catch (error) {
    console.error('Create tournament error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getTournamentById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;

    // Mock tournament data
    const mockTournament = {
      id,
      name: 'Summer League 2024',
      description: 'Annual summer tournament for local teams',
      tournamentType: 'LEAGUE',
      startDate: '2024-06-01T00:00:00.000Z',
      endDate: '2024-08-31T23:59:59.999Z',
      maxTeams: 8,
      registeredTeams: 6,
      entryFee: 500,
      prizePool: 3000,
      status: 'UPCOMING',
      createdBy: req.user.id,
      createdAt: new Date().toISOString(),
      teams: [
        { id: '1', name: 'Local Rangers', points: 0, matches: 0, wins: 0, draws: 0, losses: 0 },
        { id: '2', name: 'City United', points: 0, matches: 0, wins: 0, draws: 0, losses: 0 }
      ],
      matches: []
    };

    res.json({ tournament: mockTournament });
  } catch (error) {
    console.error('Get tournament by ID error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const registerTeamToTournament = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { tournamentId } = req.params;
    const { teamId } = req.body;

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

    // In a real implementation, we would:
    // 1. Check if tournament exists and is accepting registrations
    // 2. Check if team is already registered
    // 3. Check if tournament has space for more teams
    // 4. Add team to tournament

    res.json({
      message: 'Team registered to tournament successfully'
    });
  } catch (error) {
    console.error('Register team to tournament error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getTournamentStandings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { tournamentId } = req.params;

    // Mock standings data
    const mockStandings = [
      {
        position: 1,
        teamId: '1',
        teamName: 'Local Rangers',
        matches: 3,
        wins: 3,
        draws: 0,
        losses: 0,
        goalsFor: 8,
        goalsAgainst: 2,
        goalDifference: 6,
        points: 9
      },
      {
        position: 2,
        teamId: '2',
        teamName: 'City United',
        matches: 3,
        wins: 2,
        draws: 1,
        losses: 0,
        goalsFor: 6,
        goalsAgainst: 3,
        goalDifference: 3,
        points: 7
      }
    ];

    res.json({ standings: mockStandings });
  } catch (error) {
    console.error('Get tournament standings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};