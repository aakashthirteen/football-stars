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

    const tournaments = await database.getAllTournaments();
    res.json({ tournaments });
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
    } = req.body as any;

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

    const createdTournament = await database.createTournament(tournament);

    res.status(201).json({
      tournament: createdTournament,
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

    const tournament = await database.getTournamentById(id);
    if (!tournament) {
      res.status(404).json({ error: 'Tournament not found' });
      return;
    }

    // Get registered teams
    const teams = await database.getTournamentTeams(id);
    
    const tournamentWithDetails = {
      ...tournament,
      teams,
      matches: []
    };

    res.json({ tournament: tournamentWithDetails });
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
    const { teamId } = req.body as any;

    if (!teamId) {
      res.status(400).json({ error: 'Team ID is required' });
      return;
    }

    // Verify tournament exists
    const tournament = await database.getTournamentById(tournamentId);
    if (!tournament) {
      res.status(404).json({ error: 'Tournament not found' });
      return;
    }

    // Verify team exists
    const team = await database.getTeamById(teamId);
    if (!team) {
      res.status(404).json({ error: 'Team not found' });
      return;
    }

    // Check if tournament has space
    if (tournament.registeredTeams >= tournament.maxTeams) {
      res.status(400).json({ error: 'Tournament is full' });
      return;
    }

    // Check if tournament is accepting registrations
    if (tournament.status !== 'UPCOMING') {
      res.status(400).json({ error: 'Tournament is not accepting registrations' });
      return;
    }

    await database.registerTeamToTournament(tournamentId, teamId);

    res.json({
      message: 'Team registered to tournament successfully'
    });
  } catch (error: any) {
    console.error('Register team to tournament error:', error);
    if (error.message === 'Team is already registered for this tournament') {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export const getTournamentStandings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { tournamentId } = req.params;

    // Verify tournament exists
    const tournament = await database.getTournamentById(tournamentId);
    if (!tournament) {
      res.status(404).json({ error: 'Tournament not found' });
      return;
    }

    // Get tournament standings from database
    const standings = await database.getTournamentStandings(tournamentId);

    res.json({ standings });
  } catch (error) {
    console.error('Get tournament standings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const generateTournamentFixtures = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { tournamentId } = req.params;

    // Verify tournament exists
    const tournament = await database.getTournamentById(tournamentId);
    if (!tournament) {
      res.status(404).json({ error: 'Tournament not found' });
      return;
    }

    // Check if user is tournament creator
    if (tournament.createdBy !== req.user.id) {
      res.status(403).json({ error: 'Only tournament creator can generate fixtures' });
      return;
    }

    // Check if tournament is in UPCOMING status
    if (tournament.status !== 'UPCOMING') {
      res.status(400).json({ error: 'Fixtures can only be generated for upcoming tournaments' });
      return;
    }

    // Generate fixtures
    await database.generateTournamentFixtures(tournamentId, req.user.id);

    res.json({ message: 'Tournament fixtures generated successfully' });
  } catch (error: any) {
    console.error('Generate tournament fixtures error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};