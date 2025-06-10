// In-memory database for quick development
// We'll replace this with PostgreSQL later

import { User, Player, Team, TeamPlayer, Match, MatchEvent, PlayerStats, Tournament } from '../types';

class Database {
  private users: Map<string, User> = new Map();
  private players: Map<string, Player> = new Map();
  private teams: Map<string, Team> = new Map();
  private teamPlayers: Map<string, TeamPlayer> = new Map();
  private matches: Map<string, Match> = new Map();
  private matchEvents: Map<string, MatchEvent> = new Map();
  private playerStats: Map<string, PlayerStats> = new Map();
  private tournaments: Map<string, Tournament> = new Map();

  // Users
  createUser(user: User): User {
    this.users.set(user.id, user);
    return user;
  }

  getUserById(id: string): User | undefined {
    return this.users.get(id);
  }

  getUserByEmail(email: string): User | undefined {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  // Players
  createPlayer(player: Player): Player {
    this.players.set(player.id, player);
    return player;
  }

  getPlayerById(id: string): Player | undefined {
    return this.players.get(id);
  }

  getPlayerByUserId(userId: string): Player | undefined {
    return Array.from(this.players.values()).find(player => player.userId === userId);
  }

  // Teams
  createTeam(team: Team): Team {
    this.teams.set(team.id, team);
    return team;
  }

  getTeamById(id: string): Team | undefined {
    return this.teams.get(id);
  }

  getTeamsByUserId(userId: string): Team[] {
    const playerTeams = Array.from(this.teamPlayers.values())
      .filter(tp => {
        const player = this.getPlayerById(tp.playerId);
        return player?.userId === userId;
      })
      .map(tp => this.getTeamById(tp.teamId))
      .filter(Boolean) as Team[];

    const createdTeams = Array.from(this.teams.values())
      .filter(team => team.createdBy === userId);

    return [...new Set([...playerTeams, ...createdTeams])];
  }

  // Team Players
  addPlayerToTeam(teamPlayer: TeamPlayer): TeamPlayer {
    this.teamPlayers.set(teamPlayer.id, teamPlayer);
    return teamPlayer;
  }

  getTeamPlayers(teamId: string): TeamPlayer[] {
    return Array.from(this.teamPlayers.values())
      .filter(tp => tp.teamId === teamId);
  }

  // Matches
  createMatch(match: Match): Match {
    this.matches.set(match.id, match);
    return match;
  }

  getMatchById(id: string): Match | undefined {
    return this.matches.get(id);
  }

  getMatchesByUserId(userId: string): Match[] {
    const userTeams = this.getTeamsByUserId(userId);
    const teamIds = userTeams.map(team => team.id);
    
    return Array.from(this.matches.values())
      .filter(match => 
        teamIds.includes(match.homeTeamId) || 
        teamIds.includes(match.awayTeamId) ||
        match.createdBy === userId
      );
  }

  updateMatch(id: string, updates: Partial<Match>): Match | undefined {
    const match = this.matches.get(id);
    if (!match) return undefined;
    
    const updatedMatch = { ...match, ...updates };
    this.matches.set(id, updatedMatch);
    return updatedMatch;
  }

  // Match Events
  createMatchEvent(event: MatchEvent): MatchEvent {
    this.matchEvents.set(event.id, event);
    return event;
  }

  getMatchEvents(matchId: string): MatchEvent[] {
    return Array.from(this.matchEvents.values())
      .filter(event => event.matchId === matchId)
      .sort((a, b) => a.minute - b.minute);
  }

  // Player Stats
  getPlayerStats(playerId: string, season: string): PlayerStats | undefined {
    return Array.from(this.playerStats.values())
      .find(stats => stats.playerId === playerId && stats.season === season);
  }

  updatePlayerStats(stats: PlayerStats): PlayerStats {
    this.playerStats.set(stats.id, stats);
    return stats;
  }

  // Seed data for testing
  seedData(): void {
    // Create a test user
    const testUser: User = {
      id: 'user-1',
      email: 'test@test.com',
      name: 'John Doe',
      passwordHash: '$2b$10$nIciSzt/a47hhfScTQlNheBTCUf31dPrFmZwR/.8n.4PuRSzFiKva', // bcrypt hash for 'password123'
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.createUser(testUser);

    // Create a test player
    const testPlayer: Player = {
      id: 'player-1',
      userId: 'user-1',
      name: 'John Doe',
      position: 'MID',
      preferredFoot: 'RIGHT',
      location: 'Mumbai',
      createdAt: new Date(),
    };
    this.createPlayer(testPlayer);

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

    this.createTeam(team1);
    this.createTeam(team2);

    // Add player to team
    const teamPlayer: TeamPlayer = {
      id: 'tp-1',
      teamId: 'team-1',
      playerId: 'player-1',
      role: 'CAPTAIN',
      jerseyNumber: 10,
      joinedAt: new Date(),
    };
    this.addPlayerToTeam(teamPlayer);
  }
}

export const db = new Database();
// Initialize with seed data
db.seedData();