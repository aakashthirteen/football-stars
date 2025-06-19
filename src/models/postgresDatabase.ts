import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import { User, Team, Match, MatchWithDetails, TeamPlayer, MatchEvent, PlayerStats } from '../types';

// PostgreSQL Database Implementation for Railway deployment
export class PostgresDatabase {
  public pool: Pool;

  constructor() {
    // Use Railway DATABASE_URL or fallback for local testing
    const connectionString = process.env.DATABASE_URL || 'postgresql://localhost:5432/football_app';
    
    this.pool = new Pool({
      connectionString,
      ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
    });
    
    this.initDatabase();
  }

  private async initDatabase() {
    try {
      // Create tables if they don't exist
      await this.createTables();
      console.log('✅ PostgreSQL database initialized successfully');
    } catch (error) {
      console.error('❌ Database initialization error:', error);
    }
  }

  private async createTables() {
    const client = await this.pool.connect();
    
    try {
      // Users table
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          name VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Players table
      await client.query(`
        CREATE TABLE IF NOT EXISTS players (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          position VARCHAR(10) CHECK (position IN ('GK', 'DEF', 'MID', 'FWD')) DEFAULT 'MID',
          preferred_foot VARCHAR(10) CHECK (preferred_foot IN ('LEFT', 'RIGHT', 'BOTH')) DEFAULT 'RIGHT',
          date_of_birth DATE,
          height INTEGER,
          weight INTEGER,
          avatar_url TEXT,
          bio TEXT,
          location VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Add phone_number column if it doesn't exist
      await client.query(`
        ALTER TABLE players ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20)
      `);

      // Teams table
      await client.query(`
        CREATE TABLE IF NOT EXISTS teams (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) NOT NULL,
          description TEXT,
          logo_url TEXT,
          created_by UUID REFERENCES users(id) ON DELETE CASCADE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Team players junction table
      await client.query(`
        CREATE TABLE IF NOT EXISTS team_players (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
          player_id UUID REFERENCES players(id) ON DELETE CASCADE,
          role VARCHAR(20) CHECK (role IN ('CAPTAIN', 'VICE_CAPTAIN', 'PLAYER')) DEFAULT 'PLAYER',
          jersey_number INTEGER,
          joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(team_id, player_id),
          UNIQUE(team_id, jersey_number)
        )
      `);

      // Matches table
      await client.query(`
        CREATE TABLE IF NOT EXISTS matches (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          home_team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
          away_team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
          venue VARCHAR(255),
          match_date TIMESTAMP NOT NULL,
          duration INTEGER DEFAULT 90,
          status VARCHAR(20) CHECK (status IN ('SCHEDULED', 'LIVE', 'COMPLETED', 'CANCELLED', 'HALFTIME')) DEFAULT 'SCHEDULED',
          home_score INTEGER DEFAULT 0,
          away_score INTEGER DEFAULT 0,
          created_by UUID REFERENCES users(id) ON DELETE CASCADE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Add half-time related columns if they don't exist
      await client.query(`
        ALTER TABLE matches ADD COLUMN IF NOT EXISTS current_half INTEGER DEFAULT 1
      `);
      await client.query(`
        ALTER TABLE matches ADD COLUMN IF NOT EXISTS first_half_minutes INTEGER DEFAULT 45
      `);
      await client.query(`
        ALTER TABLE matches ADD COLUMN IF NOT EXISTS second_half_minutes INTEGER DEFAULT 45
      `);
      await client.query(`
        ALTER TABLE matches ADD COLUMN IF NOT EXISTS first_half_start_time TIMESTAMP
      `);
      await client.query(`
        ALTER TABLE matches ADD COLUMN IF NOT EXISTS second_half_start_time TIMESTAMP
      `);
      await client.query(`
        ALTER TABLE matches ADD COLUMN IF NOT EXISTS added_time_first_half INTEGER DEFAULT 0
      `);
      await client.query(`
        ALTER TABLE matches ADD COLUMN IF NOT EXISTS added_time_second_half INTEGER DEFAULT 0
      `);

      // Update the status check constraint to include HALFTIME if it doesn't already
      try {
        await client.query(`
          ALTER TABLE matches DROP CONSTRAINT IF EXISTS matches_status_check
        `);
        await client.query(`
          ALTER TABLE matches ADD CONSTRAINT matches_status_check 
          CHECK (status IN ('SCHEDULED', 'LIVE', 'COMPLETED', 'CANCELLED', 'HALFTIME'))
        `);
        console.log('✅ Updated matches status constraint to include HALFTIME');
      } catch (error) {
        console.log('⚠️ Status constraint update failed (might already be correct):', error instanceof Error ? error.message : String(error));
      }

      // Match events table
      await client.query(`
        CREATE TABLE IF NOT EXISTS match_events (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
          player_id UUID REFERENCES players(id) ON DELETE CASCADE,
          team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
          event_type VARCHAR(20) CHECK (event_type IN ('GOAL', 'ASSIST', 'YELLOW_CARD', 'RED_CARD', 'SUBSTITUTION')) NOT NULL,
          minute INTEGER NOT NULL,
          description TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Add unique constraint to prevent duplicate events within 1 minute window
      await client.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS unique_match_events 
        ON match_events (match_id, player_id, event_type, minute)
      `);
      
      console.log('✅ Added unique constraint to prevent duplicate match events');

      // Match formations table - force creation with detailed logging
      try {
        await client.query(`
          CREATE TABLE IF NOT EXISTS match_formations (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
            team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
            formation VARCHAR(20) NOT NULL,
            game_format VARCHAR(10) CHECK (game_format IN ('5v5', '7v7', '11v11')) DEFAULT '11v11',
            formation_data JSONB NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(match_id, team_id)
          )
        `);
        
        console.log('✅ Successfully created match_formations table');
        
        // Verify table exists
        const tableCheck = await client.query(`
          SELECT table_name FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = 'match_formations'
        `);
        
        if (tableCheck.rows.length > 0) {
          console.log('✅ Verified match_formations table exists');
        } else {
          console.error('❌ match_formations table was not created');
        }
        
      } catch (error) {
        console.error('❌ Error creating match_formations table:', error);
        throw error;
      }

      // Tournaments table
      await client.query(`
        CREATE TABLE IF NOT EXISTS tournaments (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) NOT NULL,
          description TEXT,
          tournament_type VARCHAR(20) CHECK (tournament_type IN ('LEAGUE', 'KNOCKOUT', 'GROUP_STAGE')) DEFAULT 'LEAGUE',
          start_date TIMESTAMP NOT NULL,
          end_date TIMESTAMP NOT NULL,
          max_teams INTEGER DEFAULT 8,
          registered_teams INTEGER DEFAULT 0,
          entry_fee DECIMAL(10,2) DEFAULT 0,
          prize_pool DECIMAL(10,2) DEFAULT 0,
          status VARCHAR(20) CHECK (status IN ('UPCOMING', 'ACTIVE', 'COMPLETED')) DEFAULT 'UPCOMING',
          created_by UUID REFERENCES users(id) ON DELETE CASCADE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Tournament teams junction table
      await client.query(`
        CREATE TABLE IF NOT EXISTS tournament_teams (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
          team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
          registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(tournament_id, team_id)
        )
      `);

      // Tournament matches table
      await client.query(`
        CREATE TABLE IF NOT EXISTS tournament_matches (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
          match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
          round_number INTEGER,
          group_name VARCHAR(10),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(tournament_id, match_id)
        )
      `);

      // Seed initial data
      await this.seedData(client);
      
    } finally {
      client.release();
    }
  }

  private async seedData(client: any) {
    // Check if test user exists
    const userResult = await client.query('SELECT id FROM users WHERE email = $1', ['test@test.com']);
    
    if (userResult.rows.length === 0) {
      console.log('🌱 Seeding database with test data...');
      
      // Create test user
      const hashedPassword = await bcrypt.hash('password123', 10);
      const userInsert = await client.query(
        'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id',
        ['test@test.com', hashedPassword, 'John Doe']
      );
      const userId = userInsert.rows[0].id;

      // Create test player
      const playerInsert = await client.query(
        'INSERT INTO players (user_id, name, position, bio, location) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [userId, 'John Doe', 'MID', 'Passionate football player', 'Mumbai']
      );
      const playerId = playerInsert.rows[0].id;

      // Create test teams
      const team1Insert = await client.query(
        'INSERT INTO teams (name, description, created_by) VALUES ($1, $2, $3) RETURNING id',
        ['Local Rangers', 'Our neighborhood football team', userId]
      );
      const team1Id = team1Insert.rows[0].id;

      const team2Insert = await client.query(
        'INSERT INTO teams (name, description, created_by) VALUES ($1, $2, $3) RETURNING id',
        ['Sunday Warriors', 'Weekend football enthusiasts', userId]
      );
      const team2Id = team2Insert.rows[0].id;

      // Add player to team
      await client.query(
        'INSERT INTO team_players (team_id, player_id, role, jersey_number) VALUES ($1, $2, $3, $4)',
        [team1Id, playerId, 'CAPTAIN', 10]
      );

      // Create additional test players for realistic teams
      const additionalPlayers = [
        // Team 1 (Local Rangers) players
        { name: 'Alex Smith', position: 'GK', team: team1Id, jersey: 1, role: 'PLAYER' },
        { name: 'Mike Johnson', position: 'DEF', team: team1Id, jersey: 2, role: 'PLAYER' },
        { name: 'Chris Wilson', position: 'DEF', team: team1Id, jersey: 3, role: 'PLAYER' },
        { name: 'David Brown', position: 'DEF', team: team1Id, jersey: 4, role: 'PLAYER' },
        { name: 'Tom Davis', position: 'MID', team: team1Id, jersey: 5, role: 'PLAYER' },
        { name: 'Ryan Miller', position: 'MID', team: team1Id, jersey: 6, role: 'PLAYER' },
        { name: 'Jake Garcia', position: 'MID', team: team1Id, jersey: 7, role: 'PLAYER' },
        { name: 'Sam Martinez', position: 'FWD', team: team1Id, jersey: 8, role: 'PLAYER' },
        { name: 'Luke Anderson', position: 'FWD', team: team1Id, jersey: 9, role: 'PLAYER' },
        { name: 'Ben Taylor', position: 'FWD', team: team1Id, jersey: 11, role: 'PLAYER' },
        
        // Team 2 (Sunday Warriors) players  
        { name: 'Carlos Rodriguez', position: 'GK', team: team2Id, jersey: 1, role: 'CAPTAIN' },
        { name: 'Mario Gomez', position: 'DEF', team: team2Id, jersey: 2, role: 'PLAYER' },
        { name: 'Diego Silva', position: 'DEF', team: team2Id, jersey: 3, role: 'PLAYER' },
        { name: 'Pablo Hernandez', position: 'DEF', team: team2Id, jersey: 4, role: 'PLAYER' },
        { name: 'Eduardo Lopez', position: 'MID', team: team2Id, jersey: 5, role: 'PLAYER' },
        { name: 'Javier Morales', position: 'MID', team: team2Id, jersey: 6, role: 'PLAYER' },
        { name: 'Andres Ruiz', position: 'MID', team: team2Id, jersey: 7, role: 'PLAYER' },
        { name: 'Fernando Castro', position: 'FWD', team: team2Id, jersey: 8, role: 'PLAYER' },
        { name: 'Ricardo Vargas', position: 'FWD', team: team2Id, jersey: 9, role: 'PLAYER' },
        { name: 'Miguel Santos', position: 'FWD', team: team2Id, jersey: 10, role: 'PLAYER' },
        { name: 'Alejandro Ramirez', position: 'FWD', team: team2Id, jersey: 11, role: 'PLAYER' }
      ];

      // Create users and players for each additional player
      for (const playerData of additionalPlayers) {
        // Create user for each player
        const userEmail = `${playerData.name.toLowerCase().replace(' ', '.')}@test.com`;
        const playerUserInsert = await client.query(
          'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id',
          [userEmail, hashedPassword, playerData.name]
        );
        const playerUserId = playerUserInsert.rows[0].id;

        // Create player profile
        const playerProfileInsert = await client.query(
          'INSERT INTO players (user_id, name, position, bio, location) VALUES ($1, $2, $3, $4, $5) RETURNING id',
          [playerUserId, playerData.name, playerData.position, `${playerData.position} player`, 'Mumbai']
        );
        const newPlayerId = playerProfileInsert.rows[0].id;

        // Add player to team
        await client.query(
          'INSERT INTO team_players (team_id, player_id, role, jersey_number) VALUES ($1, $2, $3, $4)',
          [playerData.team, newPlayerId, playerData.role, playerData.jersey]
        );
      }

      console.log('👥 Created additional test players for both teams');

      // Create test match
      const matchDate = new Date();
      matchDate.setDate(matchDate.getDate() + 1); // Tomorrow
      
      await client.query(
        'INSERT INTO matches (home_team_id, away_team_id, venue, match_date, created_by) VALUES ($1, $2, $3, $4, $5)',
        [team1Id, team2Id, 'Central Park', matchDate, userId]
      );

      console.log('✅ Test data seeded successfully with full team rosters');
    }
  }

  // User operations
  async createUser(email: string, passwordHash: string, name: string): Promise<User> {
    const result = await this.pool.query(
      'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name, created_at',
      [email, passwordHash, name]
    );
    return result.rows[0];
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const result = await this.pool.query(
      'SELECT id, email, name, password_hash as "passwordHash", created_at FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  }

  async getUserById(id: string): Promise<User | null> {
    const result = await this.pool.query(
      'SELECT id, email, name, created_at FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  // Team operations
  async createTeam(name: string, description: string, createdBy: string, logoUrl?: string): Promise<Team> {
    const result = await this.pool.query(
      'INSERT INTO teams (name, description, created_by, logo_url) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, description, createdBy, logoUrl]
    );
    return { ...result.rows[0], players: [] };
  }

  async getAllTeams(): Promise<Team[]> {
    const result = await this.pool.query(`
      SELECT t.*, 
             COUNT(tp.player_id) as player_count,
             COALESCE(
               json_agg(
                 json_build_object(
                   'id', tp.id,
                   'playerId', p.id,
                   'player', json_build_object('name', p.name, 'position', p.position),
                   'role', tp.role,
                   'jerseyNumber', tp.jersey_number
                 )
               ) FILTER (WHERE tp.id IS NOT NULL), 
               '[]'
             ) as players
      FROM teams t
      LEFT JOIN team_players tp ON t.id = tp.team_id
      LEFT JOIN players p ON tp.player_id = p.id
      GROUP BY t.id
      ORDER BY t.created_at DESC
    `);
    
    return result.rows.map(row => ({
      ...row,
      players: row.players || []
    }));
  }

  async getTeamById(id: string): Promise<Team | null> {
    const result = await this.pool.query(`
      SELECT t.*, 
             COALESCE(
               json_agg(
                 json_build_object(
                   'id', tp.id,
                   'playerId', p.id,
                   'player', json_build_object('name', p.name, 'position', p.position),
                   'role', tp.role,
                   'jerseyNumber', tp.jersey_number
                 )
               ) FILTER (WHERE tp.id IS NOT NULL), 
               '[]'
             ) as players
      FROM teams t
      LEFT JOIN team_players tp ON t.id = tp.team_id
      LEFT JOIN players p ON tp.player_id = p.id
      WHERE t.id = $1
      GROUP BY t.id
    `, [id]);
    
    return result.rows[0] || null;
  }

  async updateTeam(id: string, updates: { name?: string; description?: string; logoUrl?: string }): Promise<Team> {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (updates.name !== undefined) {
      fields.push(`name = $${paramCount}`);
      values.push(updates.name);
      paramCount++;
    }

    if (updates.description !== undefined) {
      fields.push(`description = $${paramCount}`);
      values.push(updates.description);
      paramCount++;
    }

    if (updates.logoUrl !== undefined) {
      fields.push(`logo_url = $${paramCount}`);
      values.push(updates.logoUrl);
      paramCount++;
    }

    if (fields.length === 0) {
      const team = await this.getTeamById(id);
      if (!team) throw new Error('Team not found');
      return team;
    }

    values.push(id);
    const query = `UPDATE teams SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    
    const result = await this.pool.query(query, values);
    return { ...result.rows[0], players: [] };
  }

  async deleteTeam(id: string): Promise<boolean> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Delete related records first (foreign key constraints)
      // Delete team formations
      await client.query('DELETE FROM match_formations WHERE team_id = $1', [id]);
      
      // Delete team players
      await client.query('DELETE FROM team_players WHERE team_id = $1', [id]);
      
      // Delete match events where team participated
      await client.query('DELETE FROM match_events WHERE match_id IN (SELECT id FROM matches WHERE home_team_id = $1 OR away_team_id = $1)', [id]);
      
      // Delete matches where team participated
      await client.query('DELETE FROM matches WHERE home_team_id = $1 OR away_team_id = $1', [id]);
      
      // Delete tournament team associations
      await client.query('DELETE FROM tournament_teams WHERE team_id = $1', [id]);
      
      // Finally delete the team
      const result = await client.query('DELETE FROM teams WHERE id = $1', [id]);
      
      await client.query('COMMIT');
      return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Match operations
  async createMatch(homeTeamId: string, awayTeamId: string, venue: string, matchDate: string, duration: number, createdBy: string): Promise<Match> {
    console.log('💾 Inserting match into database:', {
      homeTeamId, awayTeamId, venue, matchDate, duration, createdBy
    });
    
    // Calculate half durations based on total duration
    const firstHalfMinutes = Math.floor(duration / 2);
    const secondHalfMinutes = duration - firstHalfMinutes;
    
    const result = await this.pool.query(
      'INSERT INTO matches (home_team_id, away_team_id, venue, match_date, duration, created_by, home_score, away_score, status, first_half_minutes, second_half_minutes) VALUES ($1, $2, $3, $4, $5, $6, 0, 0, $7, $8, $9) RETURNING *',
      [homeTeamId, awayTeamId, venue, matchDate, duration, createdBy, 'SCHEDULED', firstHalfMinutes, secondHalfMinutes]
    );
    
    const createdMatch = result.rows[0];
    console.log('✅ Match inserted successfully:', createdMatch);
    
    return { ...createdMatch, events: [] };
  }

  async getAllMatches(): Promise<Match[]> {
    const result = await this.pool.query(`
      SELECT m.*, 
             ht.name as home_team_name,
             ht.logo_url as home_team_logo_url,
             at.name as away_team_name,
             at.logo_url as away_team_logo_url
      FROM matches m
      LEFT JOIN teams ht ON m.home_team_id = ht.id
      LEFT JOIN teams at ON m.away_team_id = at.id
      ORDER BY m.match_date DESC
    `);
    
    return result.rows.map(row => ({
      ...row,
      homeTeam: { 
        name: row.home_team_name || 'Unknown Home Team',
        logo_url: row.home_team_logo_url
      },
      awayTeam: { 
        name: row.away_team_name || 'Unknown Away Team',
        logo_url: row.away_team_logo_url
      },
      events: []
    }));
  }

  async getMatchById(id: string): Promise<MatchWithDetails | null> {
    console.log('🔍 Getting match by ID:', id);
    
    const result = await this.pool.query(`
      SELECT m.*, 
             m.home_score,
             m.away_score,
             ht.name as home_team_name,
             ht.id as home_team_id,
             ht.logo_url as home_team_logo_url,
             at.name as away_team_name,
             at.id as away_team_id,
             at.logo_url as away_team_logo_url
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      WHERE m.id = $1
    `, [id]);
    
    if (result.rows[0]) {
      const match = result.rows[0];
      console.log('⚽ Match found:', {
        id: match.id,
        homeTeamId: match.home_team_id,
        awayTeamId: match.away_team_id,
        homeTeamName: match.home_team_name,
        awayTeamName: match.away_team_name,
        HOME_SCORE: match.home_score,
        AWAY_SCORE: match.away_score,
        status: match.status
      });
      
      // Get team players for both teams
      console.log('👥 Fetching players for home team:', match.home_team_id);
      const homePlayersResult = await this.pool.query(`
        SELECT p.id, p.name, p.position, tp.jersey_number
        FROM team_players tp
        INNER JOIN players p ON tp.player_id = p.id
        WHERE tp.team_id = $1
        ORDER BY tp.jersey_number ASC
      `, [match.home_team_id]);
      
      console.log('👥 Fetching players for away team:', match.away_team_id);
      const awayPlayersResult = await this.pool.query(`
        SELECT p.id, p.name, p.position, tp.jersey_number
        FROM team_players tp
        INNER JOIN players p ON tp.player_id = p.id
        WHERE tp.team_id = $1
        ORDER BY tp.jersey_number ASC
      `, [match.away_team_id]);
      
      console.log('📊 Player query results:', {
        homePlayersCount: homePlayersResult.rows.length,
        awayPlayersCount: awayPlayersResult.rows.length,
        homePlayersRaw: homePlayersResult.rows,
        awayPlayersRaw: awayPlayersResult.rows,
        homePlayers: homePlayersResult.rows.map(p => ({ id: p.id, name: p.name, position: p.position })),
        awayPlayers: awayPlayersResult.rows.map(p => ({ id: p.id, name: p.name, position: p.position }))
      });
      
      const homeTeamPlayers = homePlayersResult.rows
        .filter(p => p.id) // Filter out any null player records
        .map(p => ({
          id: p.id,
          name: p.name || 'Unknown Player',
          position: p.position || 'Unknown',
          jerseyNumber: p.jersey_number
        }));
      
      const awayTeamPlayers = awayPlayersResult.rows
        .filter(p => p.id) // Filter out any null player records
        .map(p => ({
          id: p.id,
          name: p.name || 'Unknown Player',
          position: p.position || 'Unknown',
          jerseyNumber: p.jersey_number
        }));
      
      console.log('✅ Final player arrays:', {
        homeTeamPlayersCount: homeTeamPlayers.length,
        awayTeamPlayersCount: awayTeamPlayers.length
      });
      
      const finalMatchData = {
        ...match,
        // Proper field mapping from snake_case to camelCase
        homeTeamId: match.home_team_id,
        awayTeamId: match.away_team_id,
        homeScore: match.home_score || 0,
        awayScore: match.away_score || 0,
        matchDate: match.match_date,
        createdBy: match.created_by,
        createdAt: match.created_at,
        homeTeam: { 
          id: match.home_team_id,
          name: match.home_team_name,
          logo_url: match.home_team_logo_url,
          players: homeTeamPlayers
        },
        awayTeam: { 
          id: match.away_team_id,
          name: match.away_team_name,
          logo_url: match.away_team_logo_url,
          players: awayTeamPlayers
        },
        events: []
      };
      
      console.log('🎯 Final match data being returned:', {
        matchId: finalMatchData.id,
        homeTeam: finalMatchData.homeTeam.name,
        homePlayerCount: finalMatchData.homeTeam.players.length,
        homePlayerSample: finalMatchData.homeTeam.players[0],
        awayTeam: finalMatchData.awayTeam.name,
        awayPlayerCount: finalMatchData.awayTeam.players.length,
        awayPlayerSample: finalMatchData.awayTeam.players[0]
      });
      
      return finalMatchData;
    }
    
    console.log('❌ No match found with ID:', id);
    return null;
  }

  // Player stats (fixed Cartesian product bug)
  async getPlayerStats(playerId: string): Promise<PlayerStats | null> {
    const result = await this.pool.query(`
      SELECT 
        p.id as player_id,
        p.name as player_name,
        p.position,
        (SELECT COUNT(DISTINCT match_id) FROM match_events WHERE player_id = p.id) as matches_played,
        (SELECT COUNT(*) FROM match_events WHERE player_id = p.id AND event_type = 'GOAL') as goals,
        (SELECT COUNT(*) FROM match_events WHERE player_id = p.id AND event_type = 'ASSIST') as assists,
        (SELECT COUNT(*) FROM match_events WHERE player_id = p.id AND event_type = 'YELLOW_CARD') as yellow_cards,
        (SELECT COUNT(*) FROM match_events WHERE player_id = p.id AND event_type = 'RED_CARD') as red_cards,
        COALESCE(
          (SELECT SUM(m.duration) 
           FROM match_events me_inner
           JOIN matches m ON me_inner.match_id = m.id
           WHERE me_inner.player_id = p.id AND m.status = 'COMPLETED'
           GROUP BY me_inner.player_id), 
          0
        ) as minutes_played
      FROM players p
      WHERE p.id = $1
    `, [playerId]);
    
    return result.rows[0] || null;
  }

  async getAllPlayersStats(): Promise<PlayerStats[]> {
    const result = await this.pool.query(`
      SELECT 
        p.id as player_id,
        p.name as player_name,
        p.position,
        (SELECT COUNT(DISTINCT match_id) FROM match_events WHERE player_id = p.id) as matches_played,
        (SELECT COUNT(*) FROM match_events WHERE player_id = p.id AND event_type = 'GOAL') as goals,
        (SELECT COUNT(*) FROM match_events WHERE player_id = p.id AND event_type = 'ASSIST') as assists,
        (SELECT COUNT(*) FROM match_events WHERE player_id = p.id AND event_type = 'YELLOW_CARD') as yellow_cards,
        (SELECT COUNT(*) FROM match_events WHERE player_id = p.id AND event_type = 'RED_CARD') as red_cards,
        COALESCE(
          (SELECT SUM(m.duration) 
           FROM match_events me_inner
           JOIN matches m ON me_inner.match_id = m.id
           WHERE me_inner.player_id = p.id AND m.status = 'COMPLETED'
           GROUP BY me_inner.player_id), 
          0
        ) as minutes_played
      FROM players p
      ORDER BY 
        (SELECT COUNT(*) FROM match_events WHERE player_id = p.id AND event_type = 'GOAL') DESC,
        (SELECT COUNT(*) FROM match_events WHERE player_id = p.id AND event_type = 'ASSIST') DESC
      LIMIT 20
    `);
    
    return result.rows;
  }

  // Additional methods for controller compatibility
  async getTeamsByUserId(userId: string): Promise<Team[]> {
    const result = await this.pool.query(`
      SELECT t.*, 
             COUNT(tp.player_id) as player_count,
             COALESCE(
               json_agg(
                 json_build_object(
                   'id', tp.id,
                   'playerId', p.id,
                   'player', json_build_object('name', p.name, 'position', p.position),
                   'role', tp.role,
                   'jerseyNumber', tp.jersey_number
                 )
               ) FILTER (WHERE tp.id IS NOT NULL), 
               '[]'
             ) as players
      FROM teams t
      LEFT JOIN team_players tp ON t.id = tp.team_id
      LEFT JOIN players p ON tp.player_id = p.id
      WHERE t.created_by = $1
      GROUP BY t.id
      ORDER BY t.created_at DESC
    `, [userId]);
    
    return result.rows.map(row => ({
      ...row,
      players: row.players || []
    }));
  }

  async getTeamPlayers(teamId: string): Promise<any[]> {
    const result = await this.pool.query(`
      SELECT tp.*, 
             p.name as player_name, 
             p.position,
             p.user_id,
             p.preferred_foot,
             p.bio,
             p.location
      FROM team_players tp
      LEFT JOIN players p ON tp.player_id = p.id
      WHERE tp.team_id = $1
      ORDER BY tp.role DESC, tp.jersey_number ASC
    `, [teamId]);
    
    return result.rows.map(row => ({
      ...row,
      player: {
        id: row.player_id,
        name: row.player_name || 'Unknown Player',
        position: row.position || 'Unknown',
        userId: row.user_id,
        preferredFoot: row.preferred_foot,
        bio: row.bio,
        location: row.location
      }
    }));
  }

  async getPlayerById(id: string): Promise<any | null> {
    const result = await this.pool.query(
      'SELECT * FROM players WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  async getPlayerByUserId(userId: string): Promise<any | null> {
    const result = await this.pool.query(
      'SELECT * FROM players WHERE user_id = $1',
      [userId]
    );
    return result.rows[0] || null;
  }

  async addPlayerToTeam(teamPlayer: any): Promise<any> {
    const result = await this.pool.query(
      'INSERT INTO team_players (team_id, player_id, role, jersey_number) VALUES ($1, $2, $3, $4) RETURNING *',
      [teamPlayer.teamId, teamPlayer.playerId, teamPlayer.role, teamPlayer.jerseyNumber]
    );
    return result.rows[0];
  }

  async getMatchesByUserId(userId: string): Promise<Match[]> {
    console.log('🔍 Querying matches for user:', userId);
    
    const result = await this.pool.query(`
      SELECT DISTINCT m.*, 
             ht.name as home_team_name,
             ht.logo_url as home_team_logo_url,
             at.name as away_team_name,
             at.logo_url as away_team_logo_url
      FROM matches m
      LEFT JOIN teams ht ON m.home_team_id = ht.id
      LEFT JOIN teams at ON m.away_team_id = at.id
      LEFT JOIN team_players tp_home ON ht.id = tp_home.team_id
      LEFT JOIN players p_home ON tp_home.player_id = p_home.id
      LEFT JOIN team_players tp_away ON at.id = tp_away.team_id  
      LEFT JOIN players p_away ON tp_away.player_id = p_away.id
      WHERE m.created_by = $1 
         OR p_home.user_id = $1 
         OR p_away.user_id = $1
      ORDER BY m.match_date DESC
    `, [userId]);
    
    console.log(`📊 Database query returned ${result.rows.length} matches`);
    console.log('🔍 DEBUG: Full SQL result for user matches:', result.rows.map(row => ({
      matchId: row.id,
      status: row.status,
      homeTeam: row.home_team_name,
      awayTeam: row.away_team_name,
      createdBy: row.created_by,
      homeScore: row.home_score,
      awayScore: row.away_score
    })));
    if (result.rows.length > 0) {
      console.log('📋 Raw match data:', result.rows.map(row => ({
        id: row.id,
        created_by: row.created_by,
        home_team_name: row.home_team_name,
        away_team_name: row.away_team_name
      })));
    }
    
    return result.rows.map(row => ({
      ...row,
      // Proper field mapping from snake_case to camelCase
      homeScore: row.home_score || 0,
      awayScore: row.away_score || 0,
      homeTeamId: row.home_team_id,
      awayTeamId: row.away_team_id,
      matchDate: row.match_date,
      createdBy: row.created_by,
      createdAt: row.created_at,
      homeTeam: { 
        name: row.home_team_name || 'Unknown Home Team',
        logo_url: row.home_team_logo_url
      },
      awayTeam: { 
        name: row.away_team_name || 'Unknown Away Team',
        logo_url: row.away_team_logo_url
      },
      events: []
    }));
  }

  async getMatchesByTeamId(teamId: string): Promise<Match[]> {
    console.log('🔍 Querying matches for team:', teamId);
    
    const result = await this.pool.query(`
      SELECT m.*, 
             ht.name as home_team_name,
             ht.logo_url as home_team_logo_url,
             at.name as away_team_name,
             at.logo_url as away_team_logo_url
      FROM matches m
      LEFT JOIN teams ht ON m.home_team_id = ht.id
      LEFT JOIN teams at ON m.away_team_id = at.id
      WHERE m.home_team_id = $1 OR m.away_team_id = $1
      ORDER BY m.match_date DESC
    `, [teamId]);
    
    console.log(`📋 Found ${result.rows.length} matches for team:`, teamId);
    
    return result.rows.map(row => ({
      ...row,
      homeScore: row.home_score || 0,
      awayScore: row.away_score || 0,
      homeTeamId: row.home_team_id,
      awayTeamId: row.away_team_id,
      matchDate: row.match_date,
      homeTeam: { 
        id: row.home_team_id, 
        name: row.home_team_name,
        logo_url: row.home_team_logo_url
      },
      awayTeam: { 
        id: row.away_team_id, 
        name: row.away_team_name,
        logo_url: row.away_team_logo_url
      },
      events: []
    }));
  }

  async getMatchEvents(matchId: string): Promise<MatchEvent[]> {
    const result = await this.pool.query(`
      SELECT me.*, 
             json_build_object('id', p.id, 'name', p.name, 'position', p.position) as player
      FROM match_events me
      JOIN players p ON me.player_id = p.id
      WHERE me.match_id = $1
      ORDER BY me.minute ASC
    `, [matchId]);
    
    console.log('🔍 getMatchEvents - Raw DB result:', result.rows);
    
    const mappedEvents = result.rows.map(row => ({
      ...row,
      eventType: row.event_type,
      matchId: row.match_id,
      playerId: row.player_id,
      teamId: row.team_id,
      createdAt: row.created_at,
      player: row.player
    }));
    
    console.log('🎯 getMatchEvents - Mapped events:', mappedEvents.map(e => ({
      id: e.id,
      eventType: e.eventType,
      event_type: e.event_type,
      player: e.player
    })));
    
    return mappedEvents;
  }

  async updateMatch(id: string, updates: any): Promise<Match | null> {
    try {
      console.log('🗃️ DATABASE: updateMatch called with:', { id, updates });
      
      const fields = Object.keys(updates).map((key, index) => `${key} = $${index + 2}`).join(', ');
      const values = Object.values(updates);
      
      const query = `UPDATE matches SET ${fields} WHERE id = $1 RETURNING *`;
      console.log('🗃️ DATABASE: Executing query:', query);
      console.log('🗃️ DATABASE: With values:', [id, ...values]);
      
      const result = await this.pool.query(query, [id, ...values]);
      
      console.log('🗃️ DATABASE: Update successful, rows affected:', result.rowCount);
      return result.rows[0] || null;
    } catch (error) {
      console.error('🗃️ DATABASE: updateMatch error:', error);
      throw error;
    }
  }

  async createMatchEvent(event: any): Promise<MatchEvent> {
    const dbRequestId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    console.log(`🗃️ [${dbRequestId}] DATABASE: Creating match event:`, {
      matchId: event.matchId,
      playerId: event.playerId, 
      teamId: event.teamId,
      eventType: event.eventType,
      minute: event.minute,
      description: event.description
    });
    console.log(`🗃️ [${dbRequestId}] DATABASE: Timestamp:`, new Date().toISOString());
    
    const result = await this.pool.query(
      'INSERT INTO match_events (match_id, player_id, team_id, event_type, minute, description) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [event.matchId, event.playerId, event.teamId, event.eventType, event.minute, event.description]
    );
    
    console.log(`🗃️ [${dbRequestId}] DATABASE: Event created with ID:`, result.rows[0]?.id);
    return result.rows[0];
  }

  async updatePlayer(id: string, updates: any): Promise<any | null> {
    const fields = Object.keys(updates).map((key, index) => `${key} = $${index + 2}`).join(', ');
    const values = Object.values(updates);
    
    const result = await this.pool.query(
      `UPDATE players SET ${fields} WHERE id = $1 RETURNING *`,
      [id, ...values]
    );
    return result.rows[0] || null;
  }

  async getTeamPlayersStats(teamId: string): Promise<any[]> {
    const result = await this.pool.query(`
      SELECT 
        p.id as player_id,
        p.name as player_name,
        p.position,
        COUNT(DISTINCT me.match_id) as matches_played,
        COUNT(CASE WHEN me.event_type = 'GOAL' THEN 1 END) as goals,
        COUNT(CASE WHEN me.event_type = 'ASSIST' THEN 1 END) as assists,
        COUNT(CASE WHEN me.event_type = 'YELLOW_CARD' THEN 1 END) as yellow_cards,
        COUNT(CASE WHEN me.event_type = 'RED_CARD' THEN 1 END) as red_cards,
        COALESCE(
          (SELECT SUM(m.duration) 
           FROM match_events me_inner
           JOIN matches m ON me_inner.match_id = m.id
           WHERE me_inner.player_id = p.id AND m.status = 'COMPLETED'
           GROUP BY me_inner.player_id), 
          0
        ) as minutes_played
      FROM team_players tp
      JOIN players p ON tp.player_id = p.id
      LEFT JOIN match_events me ON p.id = me.player_id
      WHERE tp.team_id = $1
      GROUP BY p.id, p.name, p.position
    `, [teamId]);
    
    return result.rows;
  }

  async getAllPlayers(): Promise<any[]> {
    const result = await this.pool.query(
      'SELECT * FROM players ORDER BY name ASC'
    );
    return result.rows;
  }

  async removePlayerFromTeam(teamId: string, playerId: string): Promise<void> {
    await this.pool.query(
      'DELETE FROM team_players WHERE team_id = $1 AND player_id = $2',
      [teamId, playerId]
    );
  }

  async createPlayer(userId: string, name: string, position: string, preferredFoot: string, phoneNumber?: string): Promise<any> {
    const result = await this.pool.query(
      'INSERT INTO players (user_id, name, position, preferred_foot, bio, location, phone_number) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [userId, name, position, preferredFoot, 'Football enthusiast', 'Unknown', phoneNumber || null]
    );
    return result.rows[0];
  }

  // Tournament operations
  async createTournament(tournament: any): Promise<any> {
    const result = await this.pool.query(
      'INSERT INTO tournaments (id, name, description, tournament_type, start_date, end_date, max_teams, entry_fee, prize_pool, status, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *',
      [tournament.id, tournament.name, tournament.description, tournament.tournamentType, tournament.startDate, tournament.endDate, tournament.maxTeams, tournament.entryFee, tournament.prizePool, tournament.status, tournament.createdBy]
    );
    return result.rows[0];
  }

  async getAllTournaments(): Promise<any[]> {
    const result = await this.pool.query(`
      SELECT id, name, description, tournament_type as "tournamentType", start_date as "startDate", 
             end_date as "endDate", max_teams as "maxTeams", registered_teams as "registeredTeams",
             entry_fee as "entryFee", prize_pool as "prizePool", status, created_by as "createdBy",
             created_at as "createdAt"
      FROM tournaments 
      ORDER BY created_at DESC
    `);
    return result.rows;
  }

  async getTournamentById(id: string): Promise<any | null> {
    const result = await this.pool.query(`
      SELECT id, name, description, tournament_type as "tournamentType", start_date as "startDate", 
             end_date as "endDate", max_teams as "maxTeams", registered_teams as "registeredTeams",
             entry_fee as "entryFee", prize_pool as "prizePool", status, created_by as "createdBy",
             created_at as "createdAt"
      FROM tournaments 
      WHERE id = $1
    `, [id]);
    return result.rows[0] || null;
  }

  async registerTeamToTournament(tournamentId: string, teamId: string): Promise<any> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      
      // Check if team is already registered
      const existingRegistration = await client.query(
        'SELECT id FROM tournament_teams WHERE tournament_id = $1 AND team_id = $2',
        [tournamentId, teamId]
      );
      
      if (existingRegistration.rows.length > 0) {
        throw new Error('Team is already registered for this tournament');
      }
      
      // Add team to tournament
      const result = await client.query(
        'INSERT INTO tournament_teams (tournament_id, team_id) VALUES ($1, $2) RETURNING *',
        [tournamentId, teamId]
      );
      
      // Update registered teams count
      await client.query(
        'UPDATE tournaments SET registered_teams = registered_teams + 1 WHERE id = $1',
        [tournamentId]
      );
      
      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getTournamentTeams(tournamentId: string): Promise<any[]> {
    const result = await this.pool.query(`
      SELECT t.id, t.name, t.description, tt.registered_at
      FROM tournament_teams tt
      JOIN teams t ON tt.team_id = t.id
      WHERE tt.tournament_id = $1
      ORDER BY tt.registered_at ASC
    `, [tournamentId]);
    return result.rows;
  }

  async getTournamentStandings(tournamentId: string): Promise<any[]> {
    const result = await this.pool.query(`
      WITH tournament_team_stats AS (
        SELECT 
          t.id as team_id,
          t.name as team_name,
          COUNT(DISTINCT m.id) as matches_played,
          COUNT(DISTINCT CASE 
            WHEN (m.home_team_id = t.id AND m.home_score > m.away_score) OR 
                 (m.away_team_id = t.id AND m.away_score > m.home_score) 
            THEN m.id 
          END) as wins,
          COUNT(DISTINCT CASE 
            WHEN m.home_score = m.away_score 
            THEN m.id 
          END) as draws,
          COUNT(DISTINCT CASE 
            WHEN (m.home_team_id = t.id AND m.home_score < m.away_score) OR 
                 (m.away_team_id = t.id AND m.away_score < m.home_score) 
            THEN m.id 
          END) as losses,
          COALESCE(SUM(CASE WHEN m.home_team_id = t.id THEN m.home_score ELSE 0 END) +
                   SUM(CASE WHEN m.away_team_id = t.id THEN m.away_score ELSE 0 END), 0) as goals_for,
          COALESCE(SUM(CASE WHEN m.home_team_id = t.id THEN m.away_score ELSE 0 END) +
                   SUM(CASE WHEN m.away_team_id = t.id THEN m.home_score ELSE 0 END), 0) as goals_against
        FROM tournament_teams tt
        JOIN teams t ON tt.team_id = t.id
        LEFT JOIN tournament_matches tm ON tm.tournament_id = tt.tournament_id
        LEFT JOIN matches m ON tm.match_id = m.id 
          AND m.status = 'COMPLETED'
          AND (m.home_team_id = t.id OR m.away_team_id = t.id)
        WHERE tt.tournament_id = $1
        GROUP BY t.id, t.name
      )
      SELECT 
        ROW_NUMBER() OVER (ORDER BY 
          (wins * 3 + draws) DESC, 
          (goals_for - goals_against) DESC, 
          goals_for DESC,
          team_name ASC
        ) as position,
        team_id,
        team_name,
        matches_played as matches,
        wins,
        draws,
        losses,
        goals_for::integer as "goalsFor",
        goals_against::integer as "goalsAgainst",
        (goals_for - goals_against)::integer as "goalDifference",
        (wins * 3 + draws) as points
      FROM tournament_team_stats
      ORDER BY position
    `, [tournamentId]);
    return result.rows;
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  async searchPlayers(filters: { query?: string; position?: string; location?: string; limit: number }): Promise<any[]> {
    let query = `
      SELECT DISTINCT p.*, 
             COALESCE(ps.matches_played, 0) as matches_played,
             COALESCE(ps.goals, 0) as goals,
             COALESCE(ps.assists, 0) as assists
      FROM players p
      LEFT JOIN (
        SELECT 
          player_id,
          COUNT(DISTINCT match_id) as matches_played,
          COUNT(CASE WHEN event_type = 'GOAL' THEN 1 END) as goals,
          COUNT(CASE WHEN event_type = 'ASSIST' THEN 1 END) as assists
        FROM match_events
        GROUP BY player_id
      ) ps ON p.id = ps.player_id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    let paramCount = 0;

    // Add search query filter
    if (filters.query) {
      paramCount++;
      query += ` AND (LOWER(p.name) LIKE LOWER($${paramCount}) OR LOWER(p.bio) LIKE LOWER($${paramCount}) OR p.phone_number LIKE $${paramCount})`;
      params.push(`%${filters.query}%`);
    }

    // Add position filter
    if (filters.position && filters.position !== 'All') {
      paramCount++;
      query += ` AND p.position = $${paramCount}`;
      params.push(filters.position);
    }

    // Add location filter
    if (filters.location) {
      paramCount++;
      query += ` AND LOWER(p.location) LIKE LOWER($${paramCount})`;
      params.push(`%${filters.location}%`);
    }

    // Add ordering and limit
    query += ` ORDER BY ps.goals DESC, ps.assists DESC, p.name ASC LIMIT $${paramCount + 1}`;
    params.push(filters.limit);

    const result = await this.pool.query(query, params);
    return result.rows;
  }

  async generateTournamentFixtures(tournamentId: string, createdBy: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      
      // Get tournament details
      const tournament = await this.getTournamentById(tournamentId);
      if (!tournament) {
        throw new Error('Tournament not found');
      }

      // Get registered teams
      const teams = await this.getTournamentTeams(tournamentId);
      if (teams.length < 2) {
        throw new Error('Not enough teams to generate fixtures');
      }

      if (tournament.tournamentType === 'LEAGUE') {
        // Generate round-robin fixtures
        for (let i = 0; i < teams.length; i++) {
          for (let j = i + 1; j < teams.length; j++) {
            const matchDate = new Date(tournament.startDate);
            matchDate.setDate(matchDate.getDate() + (i + j) * 7); // Space matches by a week
            
            // Create match
            const matchResult = await client.query(
              'INSERT INTO matches (home_team_id, away_team_id, venue, match_date, duration, created_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
              [teams[i].id, teams[j].id, 'TBD', matchDate.toISOString(), 90, createdBy]
            );
            
            // Link match to tournament
            await client.query(
              'INSERT INTO tournament_matches (tournament_id, match_id, round_number) VALUES ($1, $2, $3)',
              [tournamentId, matchResult.rows[0].id, 1]
            );
          }
        }
      } else if (tournament.tournamentType === 'KNOCKOUT') {
        // Generate knockout fixtures (first round only)
        const matchupsCount = Math.floor(teams.length / 2);
        for (let i = 0; i < matchupsCount; i++) {
          const matchDate = new Date(tournament.startDate);
          matchDate.setDate(matchDate.getDate() + i); // One match per day
          
          const matchResult = await client.query(
            'INSERT INTO matches (home_team_id, away_team_id, venue, match_date, duration, created_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
            [teams[i * 2].id, teams[i * 2 + 1].id, 'TBD', matchDate.toISOString(), 90, createdBy]
          );
          
          await client.query(
            'INSERT INTO tournament_matches (tournament_id, match_id, round_number) VALUES ($1, $2, $3)',
            [tournamentId, matchResult.rows[0].id, 1]
          );
        }
      }
      
      // Update tournament status to ACTIVE
      await client.query(
        'UPDATE tournaments SET status = $1 WHERE id = $2',
        ['ACTIVE', tournamentId]
      );
      
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Formation operations
  async saveFormationForMatch(matchId: string, teamId: string, formationData: {
    formation: string;
    gameFormat: '5v5' | '7v7' | '11v11';
    players: Array<{
      id: string;
      name: string;
      position: string;
      x: number;
      y: number;
      jerseyNumber?: number;
    }>;
  }): Promise<any> {
    console.log('💾 Saving formation for match:', { matchId, teamId, formation: formationData.formation });
    
    const result = await this.pool.query(`
      INSERT INTO match_formations (match_id, team_id, formation, game_format, formation_data)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (match_id, team_id) 
      DO UPDATE SET 
        formation = EXCLUDED.formation,
        game_format = EXCLUDED.game_format,
        formation_data = EXCLUDED.formation_data,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [matchId, teamId, formationData.formation, formationData.gameFormat, JSON.stringify(formationData)]);

    console.log('✅ Formation saved successfully:', result.rows[0]);
    return result.rows[0];
  }

  async getFormationForMatch(matchId: string, teamId: string): Promise<any | null> {
    console.log('🔍 Getting formation for match:', { matchId, teamId });
    
    const result = await this.pool.query(`
      SELECT * FROM match_formations 
      WHERE match_id = $1 AND team_id = $2
    `, [matchId, teamId]);

    if (result.rows.length > 0) {
      const formation = result.rows[0];
      console.log('🎯 Found formation:', formation);
      return {
        id: formation.id,
        matchId: formation.match_id,
        teamId: formation.team_id,
        formation: formation.formation,
        gameFormat: formation.game_format,
        players: formation.formation_data.players || [],
        createdAt: formation.created_at,
        updatedAt: formation.updated_at
      };
    }

    console.log('❌ No formation found for match:', { matchId, teamId });
    return null;
  }

  async getMatchWithFormations(matchId: string): Promise<{homeFormation?: any, awayFormation?: any}> {
    console.log('🔍 Getting all formations for match:', matchId);
    
    const result = await this.pool.query(`
      SELECT mf.*, t.name as team_name
      FROM match_formations mf
      JOIN teams t ON mf.team_id = t.id
      WHERE mf.match_id = $1
    `, [matchId]);

    const formations: {homeFormation?: any, awayFormation?: any} = {};
    
    for (const row of result.rows) {
      const formationData = {
        id: row.id,
        matchId: row.match_id,
        teamId: row.team_id,
        teamName: row.team_name,
        formation: row.formation,
        gameFormat: row.game_format,
        players: row.formation_data.players || [],
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };

      // Determine if this is home or away team by checking match data
      const matchResult = await this.pool.query(`
        SELECT home_team_id, away_team_id FROM matches WHERE id = $1
      `, [matchId]);
      
      if (matchResult.rows.length > 0) {
        const match = matchResult.rows[0];
        if (row.team_id === match.home_team_id) {
          formations.homeFormation = formationData;
        } else if (row.team_id === match.away_team_id) {
          formations.awayFormation = formationData;
        }
      }
    }

    console.log('🎯 Found formations:', formations);
    return formations;
  }

  async updateFormationDuringMatch(matchId: string, teamId: string, formationData: {
    formation: string;
    players: Array<{
      id: string;
      name: string;
      position: string;
      x: number;
      y: number;
      jerseyNumber?: number;
    }>;
    minute: number;
  }): Promise<any> {
    console.log('🔄 Updating formation during match:', { matchId, teamId, minute: formationData.minute });
    
    const result = await this.pool.query(`
      UPDATE match_formations 
      SET formation_data = $3, updated_at = CURRENT_TIMESTAMP
      WHERE match_id = $1 AND team_id = $2
      RETURNING *
    `, [matchId, teamId, JSON.stringify(formationData)]);

    if (result.rows.length > 0) {
      console.log('✅ Formation updated successfully');
      return result.rows[0];
    }

    throw new Error('Formation not found to update');
  }
}