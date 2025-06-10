import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import { User, Player, Team, TeamPlayer, Match, MatchEvent, PlayerStats, Tournament } from '../types';

class SQLiteDatabase {
  private db: sqlite3.Database;
  private run: (sql: string, params?: any[]) => Promise<any>;
  private get: (sql: string, params?: any[]) => Promise<any>;
  private all: (sql: string, params?: any[]) => Promise<any[]>;

  constructor() {
    const dbPath = path.join(__dirname, '../../football_app.db');
    this.db = new sqlite3.Database(dbPath);
    
    // Promisify database methods
    this.run = promisify(this.db.run.bind(this.db));
    this.get = promisify(this.db.get.bind(this.db));
    this.all = promisify(this.db.all.bind(this.db));
  }

  async initialize(): Promise<void> {
    await this.createTables();
    await this.seedData();
  }

  private async createTables(): Promise<void> {
    const tables = [
      `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS players (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(id),
        name TEXT NOT NULL,
        position TEXT,
        preferred_foot TEXT,
        date_of_birth DATE,
        height INTEGER,
        weight INTEGER,
        avatar_url TEXT,
        bio TEXT,
        location TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS teams (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        logo_url TEXT,
        created_by TEXT REFERENCES users(id),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS team_players (
        id TEXT PRIMARY KEY,
        team_id TEXT REFERENCES teams(id),
        player_id TEXT REFERENCES players(id),
        role TEXT DEFAULT 'PLAYER',
        jersey_number INTEGER,
        joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(team_id, player_id),
        UNIQUE(team_id, jersey_number)
      )`,
      
      `CREATE TABLE IF NOT EXISTS matches (
        id TEXT PRIMARY KEY,
        home_team_id TEXT REFERENCES teams(id),
        away_team_id TEXT REFERENCES teams(id),
        tournament_id TEXT REFERENCES tournaments(id),
        venue TEXT,
        match_date DATETIME NOT NULL,
        duration INTEGER DEFAULT 90,
        status TEXT DEFAULT 'SCHEDULED',
        home_score INTEGER DEFAULT 0,
        away_score INTEGER DEFAULT 0,
        created_by TEXT REFERENCES users(id),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS match_events (
        id TEXT PRIMARY KEY,
        match_id TEXT REFERENCES matches(id),
        player_id TEXT REFERENCES players(id),
        team_id TEXT REFERENCES teams(id),
        event_type TEXT NOT NULL,
        minute INTEGER NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS player_stats (
        id TEXT PRIMARY KEY,
        player_id TEXT REFERENCES players(id),
        season TEXT,
        matches_played INTEGER DEFAULT 0,
        goals INTEGER DEFAULT 0,
        assists INTEGER DEFAULT 0,
        yellow_cards INTEGER DEFAULT 0,
        red_cards INTEGER DEFAULT 0,
        minutes_played INTEGER DEFAULT 0,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS tournaments (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        tournament_type TEXT,
        start_date DATE,
        end_date DATE,
        max_teams INTEGER,
        entry_fee DECIMAL(10,2),
        prize_pool DECIMAL(10,2),
        created_by TEXT REFERENCES users(id),
        status TEXT DEFAULT 'UPCOMING',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    for (const table of tables) {
      await this.run(table);
    }

    console.log('✅ Database tables created successfully');
  }

  // Users
  async createUser(user: User): Promise<User> {
    await this.run(
      `INSERT INTO users (id, email, name, password_hash, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [user.id, user.email, user.name, user.passwordHash, user.createdAt.toISOString(), user.updatedAt.toISOString()]
    );
    return user;
  }

  async getUserById(id: string): Promise<User | undefined> {
    const row = await this.get('SELECT * FROM users WHERE id = ?', [id]);
    if (!row) return undefined;
    
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      passwordHash: row.password_hash,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const row = await this.get('SELECT * FROM users WHERE email = ?', [email]);
    if (!row) return undefined;
    
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      passwordHash: row.password_hash,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  // Players
  async createPlayer(player: Player): Promise<Player> {
    await this.run(
      `INSERT INTO players (id, user_id, name, position, preferred_foot, date_of_birth, height, weight, avatar_url, bio, location, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        player.id, player.userId, player.name, player.position, player.preferredFoot,
        player.dateOfBirth?.toISOString(), player.height, player.weight,
        player.avatarUrl, player.bio, player.location, player.createdAt.toISOString()
      ]
    );
    return player;
  }

  async getPlayerById(id: string): Promise<Player | undefined> {
    const row = await this.get('SELECT * FROM players WHERE id = ?', [id]);
    if (!row) return undefined;
    
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      position: row.position,
      preferredFoot: row.preferred_foot,
      dateOfBirth: row.date_of_birth ? new Date(row.date_of_birth) : undefined,
      height: row.height,
      weight: row.weight,
      avatarUrl: row.avatar_url,
      bio: row.bio,
      location: row.location,
      createdAt: new Date(row.created_at),
    };
  }

  async getPlayerByUserId(userId: string): Promise<Player | undefined> {
    const row = await this.get('SELECT * FROM players WHERE user_id = ?', [userId]);
    if (!row) return undefined;
    
    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      position: row.position,
      preferredFoot: row.preferred_foot,
      dateOfBirth: row.date_of_birth ? new Date(row.date_of_birth) : undefined,
      height: row.height,
      weight: row.weight,
      avatarUrl: row.avatar_url,
      bio: row.bio,
      location: row.location,
      createdAt: new Date(row.created_at),
    };
  }

  async updatePlayer(id: string, updates: Partial<Player>): Promise<Player | undefined> {
    const current = await this.getPlayerById(id);
    if (!current) return undefined;

    const updatedPlayer = { ...current, ...updates };
    
    await this.run(
      `UPDATE players SET 
        name = ?, position = ?, preferred_foot = ?, date_of_birth = ?, 
        height = ?, weight = ?, avatar_url = ?, bio = ?, location = ?
       WHERE id = ?`,
      [
        updatedPlayer.name,
        updatedPlayer.position,
        updatedPlayer.preferredFoot,
        updatedPlayer.dateOfBirth?.toISOString(),
        updatedPlayer.height,
        updatedPlayer.weight,
        updatedPlayer.avatarUrl,
        updatedPlayer.bio,
        updatedPlayer.location,
        id
      ]
    );
    
    return updatedPlayer;
  }

  // Teams
  async createTeam(team: Team): Promise<Team> {
    await this.run(
      'INSERT INTO teams (id, name, description, logo_url, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [team.id, team.name, team.description, team.logoUrl, team.createdBy, team.createdAt.toISOString()]
    );
    return team;
  }

  async getTeamById(id: string): Promise<Team | undefined> {
    const row = await this.get('SELECT * FROM teams WHERE id = ?', [id]);
    if (!row) return undefined;
    
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      logoUrl: row.logo_url,
      createdBy: row.created_by,
      createdAt: new Date(row.created_at),
    };
  }

  async getTeamsByUserId(userId: string): Promise<Team[]> {
    const rows = await this.all(`
      SELECT DISTINCT t.* FROM teams t
      LEFT JOIN team_players tp ON t.id = tp.team_id
      LEFT JOIN players p ON tp.player_id = p.id
      WHERE t.created_by = ? OR p.user_id = ?
    `, [userId, userId]);
    
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      logoUrl: row.logo_url,
      createdBy: row.created_by,
      createdAt: new Date(row.created_at),
    }));
  }

  // Team Players
  async addPlayerToTeam(teamPlayer: TeamPlayer): Promise<TeamPlayer> {
    await this.run(
      'INSERT INTO team_players (id, team_id, player_id, role, jersey_number, joined_at) VALUES (?, ?, ?, ?, ?, ?)',
      [teamPlayer.id, teamPlayer.teamId, teamPlayer.playerId, teamPlayer.role, teamPlayer.jerseyNumber, teamPlayer.joinedAt.toISOString()]
    );
    return teamPlayer;
  }

  async getTeamPlayers(teamId: string): Promise<TeamPlayer[]> {
    const rows = await this.all('SELECT * FROM team_players WHERE team_id = ?', [teamId]);
    
    return rows.map(row => ({
      id: row.id,
      teamId: row.team_id,
      playerId: row.player_id,
      role: row.role,
      jerseyNumber: row.jersey_number,
      joinedAt: new Date(row.joined_at),
    }));
  }

  // Matches
  async createMatch(match: Match): Promise<Match> {
    await this.run(
      `INSERT INTO matches (id, home_team_id, away_team_id, tournament_id, venue, match_date, duration, status, home_score, away_score, created_by, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        match.id, match.homeTeamId, match.awayTeamId, match.tournamentId,
        match.venue, match.matchDate.toISOString(), match.duration, match.status,
        match.homeScore, match.awayScore, match.createdBy, match.createdAt.toISOString()
      ]
    );
    return match;
  }

  async getMatchById(id: string): Promise<Match | undefined> {
    const row = await this.get('SELECT * FROM matches WHERE id = ?', [id]);
    if (!row) return undefined;
    
    return {
      id: row.id,
      homeTeamId: row.home_team_id,
      awayTeamId: row.away_team_id,
      tournamentId: row.tournament_id,
      venue: row.venue,
      matchDate: new Date(row.match_date),
      duration: row.duration,
      status: row.status,
      homeScore: row.home_score,
      awayScore: row.away_score,
      createdBy: row.created_by,
      createdAt: new Date(row.created_at),
    };
  }

  async getMatchesByUserId(userId: string): Promise<Match[]> {
    const rows = await this.all(`
      SELECT DISTINCT m.* FROM matches m
      LEFT JOIN teams ht ON m.home_team_id = ht.id
      LEFT JOIN teams at ON m.away_team_id = at.id
      LEFT JOIN team_players htp ON ht.id = htp.team_id
      LEFT JOIN team_players atp ON at.id = atp.team_id
      LEFT JOIN players hp ON htp.player_id = hp.id
      LEFT JOIN players ap ON atp.player_id = ap.id
      WHERE m.created_by = ? OR ht.created_by = ? OR at.created_by = ? OR hp.user_id = ? OR ap.user_id = ?
    `, [userId, userId, userId, userId, userId]);
    
    return rows.map(row => ({
      id: row.id,
      homeTeamId: row.home_team_id,
      awayTeamId: row.away_team_id,
      tournamentId: row.tournament_id,
      venue: row.venue,
      matchDate: new Date(row.match_date),
      duration: row.duration,
      status: row.status,
      homeScore: row.home_score,
      awayScore: row.away_score,
      createdBy: row.created_by,
      createdAt: new Date(row.created_at),
    }));
  }

  async updateMatch(id: string, updates: Partial<Match>): Promise<Match | undefined> {
    const current = await this.getMatchById(id);
    if (!current) return undefined;

    const updatedMatch = { ...current, ...updates };
    
    await this.run(
      'UPDATE matches SET home_score = ?, away_score = ?, status = ? WHERE id = ?',
      [updatedMatch.homeScore, updatedMatch.awayScore, updatedMatch.status, id]
    );
    
    return updatedMatch;
  }

  // Match Events
  async createMatchEvent(event: MatchEvent): Promise<MatchEvent> {
    await this.run(
      'INSERT INTO match_events (id, match_id, player_id, team_id, event_type, minute, description, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [event.id, event.matchId, event.playerId, event.teamId, event.eventType, event.minute, event.description, event.createdAt.toISOString()]
    );
    return event;
  }

  async getMatchEvents(matchId: string): Promise<MatchEvent[]> {
    const rows = await this.all('SELECT * FROM match_events WHERE match_id = ? ORDER BY minute ASC', [matchId]);
    
    return rows.map(row => ({
      id: row.id,
      matchId: row.match_id,
      playerId: row.player_id,
      teamId: row.team_id,
      eventType: row.event_type,
      minute: row.minute,
      description: row.description,
      createdAt: new Date(row.created_at),
    }));
  }

  // Player Statistics
  async getPlayerStats(playerId: string): Promise<{
    matchesPlayed: number;
    goals: number;
    assists: number;
    yellowCards: number;
    redCards: number;
    minutesPlayed: number;
  }> {
    // Get goals
    const goalsResult = await this.get(
      'SELECT COUNT(*) as count FROM match_events WHERE player_id = ? AND event_type = "GOAL"',
      [playerId]
    );
    
    // Get assists
    const assistsResult = await this.get(
      'SELECT COUNT(*) as count FROM match_events WHERE player_id = ? AND event_type = "ASSIST"',
      [playerId]
    );
    
    // Get yellow cards
    const yellowCardsResult = await this.get(
      'SELECT COUNT(*) as count FROM match_events WHERE player_id = ? AND event_type = "YELLOW_CARD"',
      [playerId]
    );
    
    // Get red cards
    const redCardsResult = await this.get(
      'SELECT COUNT(*) as count FROM match_events WHERE player_id = ? AND event_type = "RED_CARD"',
      [playerId]
    );
    
    // Get matches played (distinct matches where player has events)
    const matchesResult = await this.get(
      'SELECT COUNT(DISTINCT match_id) as count FROM match_events WHERE player_id = ?',
      [playerId]
    );
    
    // Calculate minutes played (for now, assume full match duration for each match played)
    // In a real app, you'd track substitutions and actual minutes played
    const minutesResult = await this.get(`
      SELECT SUM(m.duration) as total_minutes 
      FROM matches m 
      JOIN match_events me ON m.id = me.match_id 
      WHERE me.player_id = ?
      GROUP BY me.player_id
    `, [playerId]);
    
    return {
      matchesPlayed: matchesResult?.count || 0,
      goals: goalsResult?.count || 0,
      assists: assistsResult?.count || 0,
      yellowCards: yellowCardsResult?.count || 0,
      redCards: redCardsResult?.count || 0,
      minutesPlayed: minutesResult?.total_minutes || 0,
    };
  }

  async getAllPlayersStats(): Promise<Array<{
    playerId: string;
    playerName: string;
    position: string;
    matchesPlayed: number;
    goals: number;
    assists: number;
    yellowCards: number;
    redCards: number;
    minutesPlayed: number;
  }>> {
    const rows = await this.all(`
      SELECT 
        p.id as player_id,
        p.name as player_name,
        p.position,
        COUNT(DISTINCT me.match_id) as matches_played,
        SUM(CASE WHEN me.event_type = 'GOAL' THEN 1 ELSE 0 END) as goals,
        SUM(CASE WHEN me.event_type = 'ASSIST' THEN 1 ELSE 0 END) as assists,
        SUM(CASE WHEN me.event_type = 'YELLOW_CARD' THEN 1 ELSE 0 END) as yellow_cards,
        SUM(CASE WHEN me.event_type = 'RED_CARD' THEN 1 ELSE 0 END) as red_cards,
        COALESCE(SUM(DISTINCT m.duration), 0) as minutes_played
      FROM players p
      LEFT JOIN match_events me ON p.id = me.player_id
      LEFT JOIN matches m ON me.match_id = m.id
      GROUP BY p.id, p.name, p.position
      ORDER BY goals DESC, assists DESC
    `);
    
    return rows.map(row => ({
      playerId: row.player_id,
      playerName: row.player_name,
      position: row.position || 'MID',
      matchesPlayed: row.matches_played || 0,
      goals: row.goals || 0,
      assists: row.assists || 0,
      yellowCards: row.yellow_cards || 0,
      redCards: row.red_cards || 0,
      minutesPlayed: row.minutes_played || 0,
    }));
  }

  async getTeamPlayersStats(teamId: string): Promise<Array<{
    playerId: string;
    playerName: string;
    position: string;
    role: string;
    jerseyNumber: number | null;
    matchesPlayed: number;
    goals: number;
    assists: number;
    yellowCards: number;
    redCards: number;
  }>> {
    const rows = await this.all(`
      SELECT 
        p.id as player_id,
        p.name as player_name,
        p.position,
        tp.role,
        tp.jersey_number,
        COUNT(DISTINCT CASE WHEN (m.home_team_id = ? OR m.away_team_id = ?) THEN me.match_id END) as matches_played,
        SUM(CASE WHEN me.event_type = 'GOAL' AND (m.home_team_id = ? OR m.away_team_id = ?) THEN 1 ELSE 0 END) as goals,
        SUM(CASE WHEN me.event_type = 'ASSIST' AND (m.home_team_id = ? OR m.away_team_id = ?) THEN 1 ELSE 0 END) as assists,
        SUM(CASE WHEN me.event_type = 'YELLOW_CARD' AND (m.home_team_id = ? OR m.away_team_id = ?) THEN 1 ELSE 0 END) as yellow_cards,
        SUM(CASE WHEN me.event_type = 'RED_CARD' AND (m.home_team_id = ? OR m.away_team_id = ?) THEN 1 ELSE 0 END) as red_cards
      FROM team_players tp
      JOIN players p ON tp.player_id = p.id
      LEFT JOIN match_events me ON p.id = me.player_id
      LEFT JOIN matches m ON me.match_id = m.id
      WHERE tp.team_id = ?
      GROUP BY p.id, p.name, p.position, tp.role, tp.jersey_number
      ORDER BY tp.role DESC, goals DESC, assists DESC
    `, [teamId, teamId, teamId, teamId, teamId, teamId, teamId, teamId, teamId, teamId, teamId]);
    
    return rows.map(row => ({
      playerId: row.player_id,
      playerName: row.player_name,
      position: row.position || 'MID',
      role: row.role,
      jerseyNumber: row.jersey_number,
      matchesPlayed: row.matches_played || 0,
      goals: row.goals || 0,
      assists: row.assists || 0,
      yellowCards: row.yellow_cards || 0,
      redCards: row.red_cards || 0,
    }));
  }

  // Seed data for testing
  async seedData(): Promise<void> {
    try {
      // Check if data already exists
      const existingUser = await this.getUserByEmail('test@test.com');
      if (existingUser) {
        console.log('🌱 Database already seeded');
        return;
      }

      // Create test user with proper bcrypt hash
      const testUser: User = {
        id: 'user-1',
        email: 'test@test.com',
        name: 'John Doe',
        passwordHash: '$2b$10$nIciSzt/a47hhfScTQlNheBTCUf31dPrFmZwR/.8n.4PuRSzFiKva', // password123
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await this.createUser(testUser);

      // Create test player
      const testPlayer: Player = {
        id: 'player-1',
        userId: 'user-1',
        name: 'John Doe',
        position: 'MID',
        preferredFoot: 'RIGHT',
        location: 'Mumbai',
        createdAt: new Date(),
      };
      await this.createPlayer(testPlayer);

      // Create test teams
      const team1: Team = {
        id: 'team-1',
        name: 'Local Rangers',
        description: 'A local football team',
        createdBy: 'user-1',
        createdAt: new Date(),
      };
      
      const team2: Team = {
        id: 'team-2',
        name: 'City United',
        description: 'City football club',
        createdBy: 'user-1',
        createdAt: new Date(),
      };

      await this.createTeam(team1);
      await this.createTeam(team2);

      // Add player to team
      const teamPlayer: TeamPlayer = {
        id: 'tp-1',
        teamId: 'team-1',
        playerId: 'player-1',
        role: 'CAPTAIN',
        jerseyNumber: 10,
        joinedAt: new Date(),
      };
      await this.addPlayerToTeam(teamPlayer);

      console.log('🌱 Database seeded successfully');
    } catch (error) {
      console.error('Error seeding database:', error);
    }
  }

  async close(): Promise<void> {
    return new Promise((resolve) => {
      this.db.close((err) => {
        if (err) console.error('Error closing database:', err);
        resolve();
      });
    });
  }
}

export const sqliteDb = new SQLiteDatabase();