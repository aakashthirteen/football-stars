import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { database } from '../models/databaseFactory';
import { AuthRequest, CreateMatchRequest, MatchEventRequest, Match, MatchWithDetails, MatchEvent } from '../types';

export const getUserMatches = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    console.log('🔍 Getting matches for user:', req.user.id);
    const matches = await database.getMatchesByUserId(req.user.id);
    console.log(`📊 Found ${matches.length} matches from database`);
    
    if (matches.length > 0) {
      console.log('📋 Match details:', matches.map(m => ({
        id: m.id,
        status: m.status,
        homeTeam: (m as any).home_team_name,
        awayTeam: (m as any).away_team_name,
        createdBy: (m as any).created_by || m.createdBy
      })));
    }
    
    // Since getMatchesByUserId now includes team names via LEFT JOIN, we can use it directly
    const matchesWithEvents = await Promise.all(matches.map(async match => {
      try {
        const events = await database.getMatchEvents(match.id) || [];
        return {
          ...match,
          events,
        };
      } catch (error) {
        console.error(`Error loading events for match ${match.id}:`, error);
        return {
          ...match,
          events: [],
        };
      }
    }));

    console.log(`✅ Returning ${matchesWithEvents.length} matches with details`);
    res.json({ matches: matchesWithEvents });
  } catch (error) {
    console.error('❌ Get matches error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const endMatch = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    console.log('🏁 Ending match:', id);
    
    const match = await database.getMatchById(id);
    if (!match) {
      console.log('❌ Match not found:', id);
      res.status(404).json({ error: 'Match not found' });
      return;
    }

    console.log('📊 Current match status:', match.status);
    
    if (match.status !== 'LIVE') {
      console.log('❌ Match not live, cannot end. Status:', match.status);
      res.status(400).json({ error: `Match can only be ended from live status. Current status: ${match.status}` });
      return;
    }

    console.log('✅ Updating match status to COMPLETED');
    const updatedMatch = await database.updateMatch(id, { status: 'COMPLETED' });
    
    console.log('🎉 Match ended successfully:', updatedMatch?.status);

    res.json({
      match: updatedMatch,
      message: 'Match ended successfully',
    });
  } catch (error) {
    console.error('❌ End match error:', error);
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

    console.log('🏗️ Creating match with data:', {
      homeTeamId,
      awayTeamId, 
      venue: venue || '', 
      matchDate, 
      duration: duration || 90, 
      createdBy: req.user.id
    });

    const createdMatch = await database.createMatch(
      homeTeamId, 
      awayTeamId, 
      venue || '', 
      matchDate, 
      duration || 90, 
      req.user.id
    );

    console.log('✅ Match created in database:', createdMatch);

    const responseMatch = {
      ...createdMatch,
      homeTeam,
      awayTeam,
      events: [],
    };

    console.log('📤 Sending match response:', responseMatch);

    res.status(201).json({
      match: responseMatch,
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
    
    if (!id) {
      res.status(400).json({ error: 'Match ID is required' });
      return;
    }
    
    const match: MatchWithDetails | null = await database.getMatchById(id);
    if (!match) {
      res.status(404).json({ error: 'Match not found' });
      return;
    }

    // The match already includes teams with players from getMatchById
    // Just need to get the events
    let events: any[] = [];
    try {
      events = await database.getMatchEvents(id) || [];
    } catch (eventsError) {
      console.error('Error loading match events:', eventsError);
    }

    const matchWithDetails: MatchWithDetails = {
      ...match,
      events,
      homeScore: match.homeScore || 0,
      awayScore: match.awayScore || 0,
    };

    console.log('⚽ Match details with teams and players:', {
      id: matchWithDetails.id,
      homeTeam: {
        name: matchWithDetails.homeTeam?.name || 'Unknown',
        playersCount: matchWithDetails.homeTeam?.players?.length || 0
      },
      awayTeam: {
        name: matchWithDetails.awayTeam?.name || 'Unknown',
        playersCount: matchWithDetails.awayTeam?.players?.length || 0
      }
    });

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

export const populateTeamsWithPlayers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Import database correctly
    const { PostgresDatabase } = require('../models/postgresDatabase');
    const db = database as any;
    
    // Get all teams that have no players
    const teams = await db.pool.query('SELECT * FROM teams ORDER BY created_at LIMIT 2');
    
    if (teams.rows.length < 2) {
      res.status(404).json({ error: 'Need at least 2 teams to populate' });
      return;
    }

    const team1Id = teams.rows[0].id;
    const team2Id = teams.rows[1].id;

    // Create test users and players for both teams
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash('password123', 10);

    const additionalPlayers = [
      // Team 1 players
      { name: 'Alex Smith', position: 'GK', team: team1Id, jersey: 1, role: 'PLAYER' },
      { name: 'Mike Johnson', position: 'DEF', team: team1Id, jersey: 2, role: 'PLAYER' },
      { name: 'Chris Wilson', position: 'DEF', team: team1Id, jersey: 3, role: 'PLAYER' },
      { name: 'David Brown', position: 'DEF', team: team1Id, jersey: 4, role: 'PLAYER' },
      { name: 'Tom Davis', position: 'MID', team: team1Id, jersey: 5, role: 'PLAYER' },
      { name: 'Ryan Miller', position: 'MID', team: team1Id, jersey: 6, role: 'PLAYER' },
      { name: 'Jake Garcia', position: 'MID', team: team1Id, jersey: 7, role: 'PLAYER' },
      { name: 'Sam Martinez', position: 'FWD', team: team1Id, jersey: 8, role: 'PLAYER' },
      { name: 'Luke Anderson', position: 'FWD', team: team1Id, jersey: 9, role: 'PLAYER' },
      
      // Team 2 players  
      { name: 'Carlos Rodriguez', position: 'GK', team: team2Id, jersey: 1, role: 'CAPTAIN' },
      { name: 'Mario Gomez', position: 'DEF', team: team2Id, jersey: 2, role: 'PLAYER' },
      { name: 'Diego Silva', position: 'DEF', team: team2Id, jersey: 3, role: 'PLAYER' },
      { name: 'Pablo Hernandez', position: 'DEF', team: team2Id, jersey: 4, role: 'PLAYER' },
      { name: 'Eduardo Lopez', position: 'MID', team: team2Id, jersey: 5, role: 'PLAYER' },
      { name: 'Javier Morales', position: 'MID', team: team2Id, jersey: 6, role: 'PLAYER' },
      { name: 'Andres Ruiz', position: 'MID', team: team2Id, jersey: 7, role: 'PLAYER' },
      { name: 'Fernando Castro', position: 'FWD', team: team2Id, jersey: 8, role: 'PLAYER' },
      { name: 'Ricardo Vargas', position: 'FWD', team: team2Id, jersey: 9, role: 'PLAYER' },
      { name: 'Miguel Santos', position: 'FWD', team: team2Id, jersey: 10, role: 'PLAYER' }
    ];

    let playersAdded = 0;

    // Create users and players for each
    for (const playerData of additionalPlayers) {
      try {
        // Check if player already exists in team
        const existingPlayer = await db.pool.query(
          'SELECT tp.id FROM team_players tp JOIN players p ON tp.player_id = p.id WHERE tp.team_id = $1 AND tp.jersey_number = $2',
          [playerData.team, playerData.jersey]
        );

        if (existingPlayer.rows.length > 0) {
          console.log(`Skipping ${playerData.name} - jersey ${playerData.jersey} already taken`);
          continue;
        }

        // Create user for each player
        const userEmail = `${playerData.name.toLowerCase().replace(' ', '.')}@test.com`;
        
        // Check if user already exists
        const existingUser = await db.pool.query('SELECT id FROM users WHERE email = $1', [userEmail]);
        let playerUserId;
        
        if (existingUser.rows.length > 0) {
          playerUserId = existingUser.rows[0].id;
        } else {
          const playerUserInsert = await db.pool.query(
            'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id',
            [userEmail, hashedPassword, playerData.name]
          );
          playerUserId = playerUserInsert.rows[0].id;
        }

        // Create player profile
        const existingPlayerProfile = await db.pool.query(
          'SELECT id FROM players WHERE user_id = $1', [playerUserId]
        );
        
        let newPlayerId;
        if (existingPlayerProfile.rows.length > 0) {
          newPlayerId = existingPlayerProfile.rows[0].id;
        } else {
          const playerProfileInsert = await db.pool.query(
            'INSERT INTO players (user_id, name, position, bio, location) VALUES ($1, $2, $3, $4, $5) RETURNING id',
            [playerUserId, playerData.name, playerData.position, `${playerData.position} player`, 'Mumbai']
          );
          newPlayerId = playerProfileInsert.rows[0].id;
        }

        // Add player to team
        await db.pool.query(
          'INSERT INTO team_players (team_id, player_id, role, jersey_number) VALUES ($1, $2, $3, $4)',
          [playerData.team, newPlayerId, playerData.role, playerData.jersey]
        );
        
        playersAdded++;
        console.log(`✅ Added ${playerData.name} to team`);
      } catch (error) {
        console.error(`Error adding ${playerData.name}:`, error);
      }
    }

    res.json({ 
      message: `Successfully populated teams with players`, 
      playersAdded,
      teams: teams.rows.map((t: any) => ({ id: t.id, name: t.name }))
    });
  } catch (error) {
    console.error('Populate teams error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const addMatchEvent = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    console.log('🚨 addMatchEvent called - UPDATED VERSION RUNNING!');
    const { id } = req.params;
    const { playerId, teamId, eventType, minute, description }: MatchEventRequest = req.body as MatchEventRequest;
    
    console.log('📥 Request data:', { id, playerId, teamId, eventType, minute, description });

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
    const homeTeamId = match.homeTeam?.id || (match as any).home_team_id;
    const awayTeamId = match.awayTeam?.id || (match as any).away_team_id;
    
    console.log('🔍 Team validation:', {
      requestTeamId: teamId,
      homeTeamId,
      awayTeamId,
      homeTeamFromObj: match.homeTeam?.id,
      awayTeamFromObj: match.awayTeam?.id,
      matchData: { 
        homeTeamId: (match as any).homeTeamId, 
        home_team_id: (match as any).home_team_id,
        awayTeamId: (match as any).awayTeamId,
        away_team_id: (match as any).away_team_id
      }
    });
    
    if (teamId !== homeTeamId && teamId !== awayTeamId) {
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
      const currentHomeScore = (match as any).homeScore || (match as any).home_score || 0;
      const currentAwayScore = (match as any).awayScore || (match as any).away_score || 0;
      
      if (teamId === homeTeamId) {
        updates.homeScore = currentHomeScore + 1;
      } else {
        updates.awayScore = currentAwayScore + 1;
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