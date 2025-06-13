import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { database } from '../models/databaseFactory';
import { AuthRequest, CreateMatchRequest, MatchEventRequest, Match, MatchEvent } from '../types';

export const getUserMatches = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const matches = await database.getMatchesByUserId(req.user.id);
    
    // Get teams and events for each match
    const matchesWithDetails = await Promise.all(matches.map(async match => {
      const homeTeam = await database.getTeamById(match.homeTeamId);
      const awayTeam = await database.getTeamById(match.awayTeamId);
      const events = await database.getMatchEvents(match.id);
      
      return {
        ...match,
        homeTeam,
        awayTeam,
        events,
      };
    }));

    res.json({ matches: matchesWithDetails });
  } catch (error) {
    console.error('Get matches error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const endMatch = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const match = await database.getMatchById(id);
    if (!match) {
      res.status(404).json({ error: 'Match not found' });
      return;
    }

    if (match.status !== 'LIVE') {
      res.status(400).json({ error: 'Match can only be ended from live status' });
      return;
    }

    const updatedMatch = await database.updateMatch(id, { status: 'COMPLETED' });

    res.json({
      match: updatedMatch,
      message: 'Match ended successfully',
    });
  } catch (error) {
    console.error('End match error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createMatch = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { homeTeamId, awayTeamId, venue, matchDate, duration }: CreateMatchRequest = req.body as CreateMatchRequest;

    if (!homeTeamId || !awayTeamId || !matchDate) {
      res.status(400).json({ error: 'Home team, away team, and match date are required' });
      return;
    }

    if (homeTeamId === awayTeamId) {
      res.status(400).json({ error: 'Home and away teams must be different' });
      return;
    }

    // Verify teams exist
    const homeTeam = await database.getTeamById(homeTeamId);
    const awayTeam = await database.getTeamById(awayTeamId);

    if (!homeTeam || !awayTeam) {
      res.status(404).json({ error: 'One or both teams not found' });
      return;
    }

    const match: Match = {
      id: uuidv4(),
      homeTeamId,
      awayTeamId,
      venue,
      matchDate: new Date(matchDate),
      duration: duration || 90,
      status: 'SCHEDULED',
      homeScore: 0,
      awayScore: 0,
      createdBy: req.user.id,
      createdAt: new Date(),
    };

    const createdMatch = await database.createMatch(
      homeTeamId, 
      awayTeamId, 
      venue || '', 
      matchDate, 
      duration || 90, 
      req.user.id
    );

    res.status(201).json({
      match: {
        ...createdMatch,
        homeTeam,
        awayTeam,
        events: [],
      },
      message: 'Match created successfully',
    });
  } catch (error) {
    console.error('Create match error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMatchById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const match = await database.getMatchById(id);
    if (!match) {
      res.status(404).json({ error: 'Match not found' });
      return;
    }

    const homeTeam = await database.getTeamById(match.homeTeamId);
    const awayTeam = await database.getTeamById(match.awayTeamId);
    const events = await database.getMatchEvents(id);

    const matchWithDetails = {
      ...match,
      homeTeam,
      awayTeam,
      events,
    };

    res.json({ match: matchWithDetails });
  } catch (error) {
    console.error('Get match error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const startMatch = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const match = await database.getMatchById(id);
    if (!match) {
      res.status(404).json({ error: 'Match not found' });
      return;
    }

    if (match.status !== 'SCHEDULED') {
      res.status(400).json({ error: 'Match can only be started from scheduled status' });
      return;
    }

    const updatedMatch = await database.updateMatch(id, { status: 'LIVE' });

    res.json({
      match: updatedMatch,
      message: 'Match started successfully',
    });
  } catch (error) {
    console.error('Start match error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const addMatchEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { playerId, teamId, eventType, minute, description }: MatchEventRequest = req.body as MatchEventRequest;

    if (!playerId || !teamId || !eventType || minute === undefined) {
      res.status(400).json({ error: 'Player, team, event type, and minute are required' });
      return;
    }

    const match = await database.getMatchById(id);
    if (!match) {
      res.status(404).json({ error: 'Match not found' });
      return;
    }

    // Verify team is part of this match
    if (teamId !== match.homeTeamId && teamId !== match.awayTeamId) {
      res.status(400).json({ error: 'Team is not part of this match' });
      return;
    }

    const event: MatchEvent = {
      id: uuidv4(),
      matchId: id,
      playerId,
      teamId,
      eventType,
      minute,
      description,
      createdAt: new Date(),
    };

    const createdEvent = await database.createMatchEvent(event);

    // Update match score if it's a goal
    if (eventType === 'GOAL') {
      let updates: Partial<Match> = {};
      if (teamId === match.homeTeamId) {
        updates.homeScore = match.homeScore + 1;
      } else {
        updates.awayScore = match.awayScore + 1;
      }
      await database.updateMatch(id, updates);
    }

    res.status(201).json({
      event: createdEvent,
      message: 'Match event added successfully',
    });
  } catch (error) {
    console.error('Add match event error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};