import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { database } from '../models/databaseFactory';
import { AuthRequest, CreateMatchRequest, MatchEventRequest, Match, MatchWithDetails, MatchEvent } from '../types';
import { sseMatchTimerService } from '../services/sse/SSEMatchTimerService';
import { getTimerService } from '../config/timerConfig';

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
    
    console.log('🏁 MATCH_CONTROLLER: Ending match with professional timer service:', id);
    
    // End match using timer service with enhanced error handling
    const timerService = getTimerService();
    
    // Check if timer state exists, initialize if needed
    let timerState = timerService.getMatchState(id);
    if (!timerState) {
      console.log(`⚡ No timer state found for match ${id}, attempting to initialize from database`);
      try {
        await timerService.initializeFromDatabase(id);
        timerState = timerService.getMatchState(id);
        if (!timerState) {
          res.status(400).json({ 
            error: 'Cannot end match - match not found in timer service or database',
            matchId: id
          });
          return;
        }
      } catch (initError) {
        console.error('Failed to initialize timer state from database:', initError);
        res.status(400).json({ 
          error: 'Cannot end match - failed to initialize match state',
          matchId: id
        });
        return;
      }
    }
    
    // Check current status before ending
    const currentState = timerService.getMatchState(id);
    if (!currentState || (currentState.status !== 'LIVE' && currentState.status !== 'HALFTIME')) {
      // For debugging: try to end match even if timer state is missing/invalid
      console.log(`⚠️ WARNING: Attempting to end match with invalid timer state:`, {
        currentStatus: currentState?.status,
        currentHalf: currentState?.currentHalf,
        hasTimerState: !!currentState
      });
      
      // Check if match exists in database and is not already completed
      const dbMatch = await database.getMatchById(id);
      if (!dbMatch) {
        res.status(404).json({ error: 'Match not found in database' });
        return;
      }
      
      if (dbMatch.status === 'COMPLETED') {
        res.status(400).json({ 
          error: 'Match is already completed',
          currentStatus: dbMatch.status
        });
        return;
      }
      
      // Force end the match by updating database directly
      console.log(`🚨 FORCE ENDING: Match ${id} - updating database directly`);
      try {
        // Use the existing updateMatch method to set status to COMPLETED
        const updateData = {
          ...dbMatch,
          status: 'COMPLETED',
          end_time: new Date().toISOString()
        };
        
        await database.updateMatch(id, updateData);
        const finalMatch = await database.getMatchById(id);
        
        res.json({
          match: finalMatch,
          timerState: null,
          message: 'Match ended successfully (forced database update)',
          warning: 'Timer state was invalid - used direct database update'
        });
        return;
      } catch (forceError) {
        console.error('❌ Failed to force end match:', forceError);
        res.status(500).json({ 
          error: 'Cannot end match - timer state invalid and database update failed',
          currentStatus: currentState?.status,
          dbStatus: dbMatch.status,
          details: forceError instanceof Error ? forceError.message : 'Unknown error'
        });
        return;
      }
    }
    
    // Trigger fulltime
    await timerService.triggerFulltime(id);
    
    // Get updated timer state
    const finalTimerState = timerService.getMatchState(id);
    
    // Get updated match data
    const updatedMatch = await database.getMatchById(id);
    if (!updatedMatch) {
      res.status(404).json({ error: 'Match not found after ending' });
      return;
    }

    console.log('🎉 MATCH_CONTROLLER: Match ended successfully with timer service:', finalTimerState);

    res.json({
      match: updatedMatch,
      timerState: finalTimerState,
      message: 'Match ended successfully with professional timer service',
    });
  } catch (error) {
    console.error('❌ End match error:', error);
    
    // Provide more detailed error information
    if (error instanceof Error) {
      res.status(500).json({ 
        error: 'Failed to end match',
        message: error.message,
        details: error.stack?.split('\n')[0] // First line of stack trace
      });
    } else {
      res.status(500).json({ error: 'Internal server error ending match' });
    }
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
      homeScore: match.homeScore || (match as any).home_score || 0,
      awayScore: match.awayScore || (match as any).away_score || 0,
    };

    console.log('🏆 SCORES DEBUG:', {
      homeScore: match.homeScore,
      home_score: (match as any).home_score,
      awayScore: match.awayScore,
      away_score: (match as any).away_score,
      finalHomeScore: matchWithDetails.homeScore,
      finalAwayScore: matchWithDetails.awayScore
    });
    
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
    
    console.log(`⚽ MATCH_CONTROLLER: Starting match ${id} with professional timer service`);
    console.log(`🔍 MATCH_CONTROLLER: Match ID type: ${typeof id}, length: ${id.length}`);
    console.log(`🔍 MATCH_CONTROLLER: Match ID format check: ${/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) ? 'VALID UUID' : 'INVALID UUID'}`);
    
    const match = await database.getMatchById(id);
    if (!match) {
      console.log(`❌ MATCH_CONTROLLER: No match found with ID: ${id}`);
      res.status(404).json({ error: 'Match not found' });
      return;
    }

    console.log(`✅ MATCH_CONTROLLER: Match found:`, { id: match.id, status: match.status });

    if (match.status !== 'SCHEDULED') {
      console.log(`❌ MATCH_CONTROLLER: Match status is ${match.status}, not SCHEDULED`);
      res.status(400).json({ error: 'Match can only be started from scheduled status' });
      return;
    }

    // Start professional server-side timer (SSE or WebSocket based on config)
    const timerService = getTimerService();
    console.log(`🚀 MATCH_CONTROLLER: About to call timerService.startMatch(${id}) with SSE timer`);
    const timerState = await timerService.startMatch(id);
    
    console.log(`✅ MATCH_CONTROLLER: Match ${id} started with timer service:`, {
      matchId: timerState.matchId,
      currentMinute: timerState.currentMinute,
      currentSecond: timerState.currentSecond,
      status: timerState.status,
      isLive: timerState.isLive
    });
    
    // Verify timer is actually running
    setTimeout(() => {
      const verifyState = timerService.getMatchState(id);
      console.log(`🔍 MATCH_CONTROLLER: Timer verification after 3 seconds:`, verifyState ? {
        minute: verifyState.currentMinute,
        second: verifyState.currentSecond,
        status: verifyState.status
      } : 'TIMER NOT FOUND');
    }, 3000);

    // Get updated match data
    const updatedMatch = await database.getMatchById(id);

    res.json({
      match: updatedMatch,
      timerState,
      message: 'Match started successfully with professional timer service',
    });
  } catch (error) {
    console.error('Start match error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Half-time control endpoints (now handled automatically by timer service)
export const pauseForHalftime = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    console.log('🟨 HALFTIME_CONTROLLER: Halftime is now automatic - handled by timer service');
    const { id } = req.params;
    
    // Get current timer state (halftime should already be triggered automatically)
    const timerService = getTimerService();
    const timerState = timerService.getMatchState(id);
    if (!timerState) {
      res.status(404).json({ error: 'Match timer not found' });
      return;
    }

    // Get updated match data
    const match = await database.getMatchById(id);
    if (!match) {
      res.status(404).json({ error: 'Match not found' });
      return;
    }

    res.json({
      match: match,
      timerState,
      message: 'Halftime is automatic - handled by professional timer service',
    });
  } catch (error) {
    console.error('❌ Pause for halftime error:', error);
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack',
      name: error instanceof Error ? error.name : 'Unknown error type'
    });
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    });
  }
};

export const startSecondHalf = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    console.log('🟨 SECOND_HALF_CONTROLLER: Second half is now automatic - handled by timer service');
    const { id } = req.params;
    
    // Get current timer state (second half should be automatically triggered)
    const timerService = getTimerService();
    const timerState = timerService.getMatchState(id);
    if (!timerState) {
      res.status(404).json({ error: 'Match timer not found' });
      return;
    }

    // Get updated match data
    const match = await database.getMatchById(id);
    if (!match) {
      res.status(404).json({ error: 'Match not found' });
      return;
    }

    console.log('✅ SECOND_HALF_CONTROLLER: Returning current timer state:', timerState);
    res.json({
      match: match,
      timerState,
      message: 'Second half is automatic - handled by professional timer service',
    });
  } catch (error) {
    console.error('❌ Start second half error:', error);
    console.error('❌ Error stack:', error instanceof Error ? error.stack : error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const addStoppageTime = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { minutes = 1 } = req.body; // Default to 1 minute
    
    const match = await database.getMatchById(id);
    if (!match) {
      res.status(404).json({ error: 'Match not found' });
      return;
    }

    if (match.status !== 'LIVE') {
      res.status(400).json({ error: 'Match must be live to add stoppage time' });
      return;
    }

    const currentHalf = (match as any).current_half || 1;
    const updateField = currentHalf === 1 ? 'added_time_first_half' : 'added_time_second_half';
    const currentAddedTime = (match as any)[updateField] || 0;
    
    const updatedMatch = await database.updateMatch(id, { 
      [updateField]: currentAddedTime + minutes
    });

    res.json({
      match: updatedMatch,
      message: `Added ${minutes} minute(s) of stoppage time to ${currentHalf === 1 ? 'first' : 'second'} half`,
    });
  } catch (error) {
    console.error('Add stoppage time error:', error);
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
  const requestId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  const client = await database.pool.connect();
  
  try {
    console.log(`🚨 [${requestId}] addMatchEvent called - TRANSACTION VERSION RUNNING!`);
    const { id } = req.params;
    const { playerId, teamId, eventType, minute, description }: MatchEventRequest = req.body as MatchEventRequest;
    
    console.log(`📥 [${requestId}] Request data:`, { id, playerId, teamId, eventType, minute, description });
    console.log(`🕐 [${requestId}] Request timestamp:`, new Date().toISOString());

    // Start database transaction
    await client.query('BEGIN');
    console.log(`🔒 [${requestId}] Database transaction started`);

    // Check for recent duplicate events (within last 5 seconds) - use transaction client
    const duplicateCheck = await client.query(`
      SELECT id FROM match_events 
      WHERE match_id = $1 AND player_id = $2 AND event_type = $3 
      AND created_at > NOW() - INTERVAL '5 seconds'
      LIMIT 1
      FOR UPDATE
    `, [id, playerId, eventType]);
    
    if (duplicateCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      console.log(`🚫 [${requestId}] Duplicate event blocked - same event within 5 seconds`);
      res.status(400).json({ error: 'Duplicate event - please wait before adding another event' });
      return;
    }
    
    console.log(`✅ [${requestId}] No duplicate found, proceeding with event creation`);

    if (!playerId || !teamId || !eventType || minute === undefined) {
      await client.query('ROLLBACK');
      res.status(400).json({ error: 'Player, team, event type, and minute are required' });
      return;
    }

    const match = await database.getMatchById(id);
    if (!match) {
      await client.query('ROLLBACK');
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
      await client.query('ROLLBACK');
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

    console.log(`📝 [${requestId}] Creating match event in database...`);
    console.log(`🎯 [${requestId}] Event details:`, event);
    
    // Create event using transaction client to prevent race conditions
    const eventResult = await client.query(
      'INSERT INTO match_events (match_id, player_id, team_id, event_type, minute, description) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [event.matchId, event.playerId, event.teamId, event.eventType, event.minute, event.description]
    );
    const createdEvent = eventResult.rows[0];
    console.log(`✅ [${requestId}] Match event created successfully:`, createdEvent?.id);

    // Update match score if it's a goal
    if (eventType === 'GOAL') {
      console.log(`⚽ [${requestId}] Updating match score for goal...`);
      let updates: any = {};
      const currentHomeScore = (match as any).homeScore || (match as any).home_score || 0;
      const currentAwayScore = (match as any).awayScore || (match as any).away_score || 0;
      
      console.log(`📊 [${requestId}] Current scores:`, { currentHomeScore, currentAwayScore });
      
      if (teamId === homeTeamId) {
        updates.home_score = currentHomeScore + 1;
        console.log(`🏠 [${requestId}] Incrementing home team score to:`, updates.home_score);
      } else {
        updates.away_score = currentAwayScore + 1;
        console.log(`✈️ [${requestId}] Incrementing away team score to:`, updates.away_score);
      }
      
      console.log(`💾 [${requestId}] Updating match with:`, updates);
      
      // Update match score using transaction client
      const fields = Object.keys(updates).map((key, index) => `${key} = $${index + 2}`).join(', ');
      const values = Object.values(updates);
      await client.query(
        `UPDATE matches SET ${fields} WHERE id = $1`,
        [id, ...values]
      );
      console.log(`✅ [${requestId}] Match score updated successfully`);
    }

    // Commit transaction if everything succeeded
    await client.query('COMMIT');
    console.log(`🔓 [${requestId}] Database transaction committed successfully`);
    
    console.log(`🎉 [${requestId}] Successfully completed event creation and returning response`);
    res.status(201).json({
      event: createdEvent,
      message: 'Match event added successfully',
    });
  } catch (error) {
    // Rollback transaction on any error
    try {
      await client.query('ROLLBACK');
      console.log(`🔄 [${requestId}] Database transaction rolled back due to error`);
    } catch (rollbackError) {
      console.error(`💥 [${requestId}] Error rolling back transaction:`, rollbackError);
    }
    
    console.error(`💥 [${requestId}] Add match event error:`, error);
    console.error(`💥 [${requestId}] Error stack:`, error instanceof Error ? error.stack : 'No stack trace');
    console.error(`💥 [${requestId}] Error message:`, error instanceof Error ? error.message : String(error));
    
    // Handle unique constraint violation specifically
    if (error instanceof Error && error.message.includes('unique_match_events')) {
      res.status(409).json({ error: 'Duplicate event detected - this exact event already exists' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  } finally {
    // Always release the client back to the pool
    client.release();
    console.log(`🔄 [${requestId}] Database client released`);
  }
};

// Formation endpoints
export const saveFormationForMatch = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { matchId, teamId } = req.params;
    const formationData = req.body;

    console.log('💾 Formation save request:', { 
      matchId, 
      teamId, 
      userId: req.user.id,
      formation: formationData.formation,
      gameFormat: formationData.gameFormat,
      playerCount: formationData.players?.length 
    });

    // Validate input
    if (!matchId || !teamId) {
      console.error('❌ Missing matchId or teamId');
      res.status(400).json({ error: 'Match ID and Team ID are required' });
      return;
    }

    if (!formationData.formation || !formationData.players) {
      console.error('❌ Missing formation data');
      res.status(400).json({ error: 'Formation and players data are required' });
      return;
    }

    console.log('📋 Formation data received:', formationData);

    const result = await database.saveFormationForMatch(matchId, teamId, formationData);

    console.log('✅ Formation saved successfully:', result);

    res.status(201).json({
      formation: result,
      message: 'Formation saved successfully'
    });
  } catch (error) {
    console.error('❌ Save formation error details:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : 'No stack',
      matchId: req.params.matchId,
      teamId: req.params.teamId
    });
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getFormationForMatch = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { matchId, teamId } = req.params;

    console.log('🔍 Getting formation:', { matchId, teamId });

    const formation = await database.getFormationForMatch(matchId, teamId);

    if (formation) {
      res.json({ formation });
    } else {
      res.status(404).json({ error: 'Formation not found' });
    }
  } catch (error) {
    console.error('❌ Get formation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMatchWithFormations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { matchId } = req.params;

    console.log('🔍 Getting match formations:', matchId);

    const formations = await database.getMatchWithFormations(matchId);

    res.json(formations);
  } catch (error) {
    console.error('❌ Get match formations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateFormationDuringMatch = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { matchId, teamId } = req.params;
    const formationData = req.body;

    console.log('🔄 Updating formation during match:', { matchId, teamId, minute: formationData.minute });

    const result = await database.updateFormationDuringMatch(matchId, teamId, formationData);

    res.json({
      formation: result,
      message: 'Formation updated successfully'
    });
  } catch (error) {
    console.error('❌ Update formation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// New Match Control Endpoints for Halftime Break and Manual Controls

export const pauseMatch = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    console.log(`⏸️ MATCH_CONTROLLER: Pausing match ${id}`);
    
    const timerService = getTimerService();
    const timerState = await timerService.pauseMatch(id);
    
    res.json({
      timerState,
      message: 'Match paused successfully'
    });
  } catch (error) {
    console.error('❌ Pause match error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error' });
  }
};

export const resumeMatch = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    console.log(`▶️ MATCH_CONTROLLER: Resuming match ${id}`);
    
    const timerService = getTimerService();
    const timerState = await timerService.resumeMatch(id);
    
    res.json({
      timerState,
      message: 'Match resumed successfully'
    });
  } catch (error) {
    console.error('❌ Resume match error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error' });
  }
};

export const manualHalftime = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    console.log(`🟨 MATCH_CONTROLLER: Manual halftime for match ${id}`);
    
    const timerService = getTimerService();
    await timerService.triggerHalftime(id);
    
    // Get updated timer state
    const timerState = timerService.getMatchState(id);
    
    res.json({
      timerState,
      message: 'Halftime triggered manually'
    });
  } catch (error) {
    console.error('❌ Manual halftime error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error' });
  }
};