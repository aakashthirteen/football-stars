import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import { User, Team, Match, TeamPlayer, MatchEvent, PlayerStats } from '../types';

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
          status VARCHAR(20) CHECK (status IN ('SCHEDULED', 'LIVE', 'COMPLETED', 'CANCELLED')) DEFAULT 'SCHEDULED',
          home_score INTEGER DEFAULT 0,
          away_score INTEGER DEFAULT 0,
          created_by UUID REFERENCES users(id) ON DELETE CASCADE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

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

      // Create test match
      const matchDate = new Date();
      matchDate.setDate(matchDate.getDate() + 1); // Tomorrow
      
      await client.query(
        'INSERT INTO matches (home_team_id, away_team_id, venue, match_date, created_by) VALUES ($1, $2, $3, $4, $5)',
        [team1Id, team2Id, 'Central Park', matchDate, userId]
      );

      console.log('✅ Test data seeded successfully');
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
      'SELECT id, email, name, password_hash, created_at FROM users WHERE email = $1',
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
  async createTeam(name: string, description: string, createdBy: string): Promise<Team> {
    const result = await this.pool.query(
      'INSERT INTO teams (name, description, created_by) VALUES ($1, $2, $3) RETURNING *',
      [name, description, createdBy]
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

  // Match operations
  async createMatch(homeTeamId: string, awayTeamId: string, venue: string, matchDate: string, duration: number, createdBy: string): Promise<Match> {
    const result = await this.pool.query(
      'INSERT INTO matches (home_team_id, away_team_id, venue, match_date, duration, created_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [homeTeamId, awayTeamId, venue, matchDate, duration, createdBy]
    );
    return { ...result.rows[0], events: [], homeTeam: { name: 'Home Team' }, awayTeam: { name: 'Away Team' } };
  }

  async getAllMatches(): Promise<Match[]> {
    const result = await this.pool.query(`
      SELECT m.*, 
             ht.name as home_team_name,
             at.name as away_team_name
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      ORDER BY m.match_date DESC
    `);
    
    return result.rows.map(row => ({
      ...row,
      homeTeam: { name: row.home_team_name },
      awayTeam: { name: row.away_team_name },
      events: []
    }));
  }

  async getMatchById(id: string): Promise<Match | null> {
    const result = await this.pool.query(`
      SELECT m.*, 
             ht.name as home_team_name,
             at.name as away_team_name
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      WHERE m.id = $1
    `, [id]);
    
    if (result.rows[0]) {
      const match = result.rows[0];
      return {
        ...match,
        homeTeam: { name: match.home_team_name },
        awayTeam: { name: match.away_team_name },
        events: []
      };
    }
    return null;
  }

  // Player stats (simplified for Railway deployment)
  async getPlayerStats(playerId: string): Promise<PlayerStats | null> {
    const result = await this.pool.query(`
      SELECT 
        p.id as player_id,
        p.name as player_name,
        p.position,
        COUNT(DISTINCT me1.id) as matches_played,
        COUNT(CASE WHEN me2.event_type = 'GOAL' THEN 1 END) as goals,
        COUNT(CASE WHEN me2.event_type = 'ASSIST' THEN 1 END) as assists,
        COUNT(CASE WHEN me2.event_type = 'YELLOW_CARD' THEN 1 END) as yellow_cards,
        COUNT(CASE WHEN me2.event_type = 'RED_CARD' THEN 1 END) as red_cards,
        COALESCE(SUM(CASE WHEN m.status = 'COMPLETED' THEN m.duration ELSE 0 END), 0) as minutes_played
      FROM players p
      LEFT JOIN match_events me1 ON p.id = me1.player_id
      LEFT JOIN matches m ON me1.match_id = m.id
      LEFT JOIN match_events me2 ON p.id = me2.player_id
      WHERE p.id = $1
      GROUP BY p.id, p.name, p.position
    `, [playerId]);
    
    return result.rows[0] || null;
  }

  async getAllPlayersStats(): Promise<PlayerStats[]> {
    const result = await this.pool.query(`
      SELECT 
        p.id as player_id,
        p.name as player_name,
        p.position,
        COUNT(DISTINCT me1.id) as matches_played,
        COUNT(CASE WHEN me2.event_type = 'GOAL' THEN 1 END) as goals,
        COUNT(CASE WHEN me2.event_type = 'ASSIST' THEN 1 END) as assists,
        COUNT(CASE WHEN me2.event_type = 'YELLOW_CARD' THEN 1 END) as yellow_cards,
        COUNT(CASE WHEN me2.event_type = 'RED_CARD' THEN 1 END) as red_cards,
        COALESCE(SUM(CASE WHEN m.status = 'COMPLETED' THEN m.duration ELSE 0 END), 0) as minutes_played
      FROM players p
      LEFT JOIN match_events me1 ON p.id = me1.player_id
      LEFT JOIN matches m ON me1.match_id = m.id
      LEFT JOIN match_events me2 ON p.id = me2.player_id
      GROUP BY p.id, p.name, p.position
      ORDER BY goals DESC, assists DESC
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
      SELECT tp.*, p.name as player_name, p.position
      FROM team_players tp
      JOIN players p ON tp.player_id = p.id
      WHERE tp.team_id = $1
    `, [teamId]);
    return result.rows;
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
    const result = await this.pool.query(`
      SELECT m.*, 
             ht.name as home_team_name,
             at.name as away_team_name
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      WHERE m.created_by = $1
      ORDER BY m.match_date DESC
    `, [userId]);
    
    return result.rows.map(row => ({
      ...row,
      homeTeam: { name: row.home_team_name },
      awayTeam: { name: row.away_team_name },
      events: []
    }));
  }

  async getMatchEvents(matchId: string): Promise<MatchEvent[]> {
    const result = await this.pool.query(`
      SELECT me.*, p.name as player_name
      FROM match_events me
      JOIN players p ON me.player_id = p.id
      WHERE me.match_id = $1
      ORDER BY me.minute ASC
    `, [matchId]);
    return result.rows;
  }

  async updateMatch(id: string, updates: any): Promise<Match | null> {
    const fields = Object.keys(updates).map((key, index) => `${key} = $${index + 2}`).join(', ');
    const values = Object.values(updates);
    
    const result = await this.pool.query(
      `UPDATE matches SET ${fields} WHERE id = $1 RETURNING *`,
      [id, ...values]
    );
    return result.rows[0] || null;
  }

  async createMatchEvent(event: any): Promise<MatchEvent> {
    const result = await this.pool.query(
      'INSERT INTO match_events (match_id, player_id, team_id, event_type, minute, description) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [event.matchId, event.playerId, event.teamId, event.type, event.minute, event.description]
    );
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
        COUNT(DISTINCT me1.id) as matches_played,
        COUNT(CASE WHEN me2.event_type = 'GOAL' THEN 1 END) as goals,
        COUNT(CASE WHEN me2.event_type = 'ASSIST' THEN 1 END) as assists,
        COUNT(CASE WHEN me2.event_type = 'YELLOW_CARD' THEN 1 END) as yellow_cards,
        COUNT(CASE WHEN me2.event_type = 'RED_CARD' THEN 1 END) as red_cards,
        COALESCE(SUM(CASE WHEN m.status = 'COMPLETED' THEN m.duration ELSE 0 END), 0) as minutes_played
      FROM team_players tp
      JOIN players p ON tp.player_id = p.id
      LEFT JOIN match_events me1 ON p.id = me1.player_id
      LEFT JOIN matches m ON me1.match_id = m.id
      LEFT JOIN match_events me2 ON p.id = me2.player_id
      WHERE tp.team_id = $1
      GROUP BY p.id, p.name, p.position
    `, [teamId]);
    
    return result.rows;
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}