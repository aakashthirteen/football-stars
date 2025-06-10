import AsyncStorage from '@react-native-async-storage/async-storage';

// API Configuration - Switch between Mock and Production
const USE_MOCK = true; // Set to false when Railway is deployed
const RAILWAY_URL = 'https://your-railway-app-url.up.railway.app/api'; // Update with your Railway URL
const LOCAL_URL = 'http://192.168.0.102:3001/api';
const API_BASE_URL = USE_MOCK ? 'MOCK' : RAILWAY_URL;

class ApiService {
  private async getAuthHeaders() {
    const token = await AsyncStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    // Mock responses for testing
    if (USE_MOCK) {
      return this.mockRequest(endpoint, options);
    }

    const url = `${API_BASE_URL}${endpoint}`;
    const headers = await this.getAuthHeaders();

    const config: RequestInit = {
      headers,
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  private async mockRequest(endpoint: string, options: RequestInit = {}) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const body = options.body ? JSON.parse(options.body as string) : {};

    if (endpoint === '/auth/login') {
      if (body.email === 'test@test.com' && body.password === 'password123') {
        return {
          user: { id: '1', email: body.email, name: 'John Doe' },
          token: 'mock-jwt-token',
          message: 'Login successful'
        };
      }
      throw new Error('Invalid credentials');
    }

    if (endpoint === '/auth/register') {
      return {
        user: { id: '1', email: body.email, name: body.name },
        token: 'mock-jwt-token',
        message: 'Registration successful'
      };
    }

    if (endpoint === '/teams') {
      if (options.method === 'POST') {
        const newTeam = {
          id: Math.random().toString(),
          name: body.name,
          description: body.description,
          players: [{
            id: '1',
            playerId: 'player-1',
            player: { name: 'John Doe', position: 'MID' },
            role: 'CAPTAIN',
            jerseyNumber: 10
          }],
          createdBy: '1'
        };
        
        // Store in temporary array for mock persistence
        if (!global.mockTeams) global.mockTeams = [];
        global.mockTeams.push(newTeam);
        
        return {
          team: newTeam,
          message: 'Team created successfully'
        };
      }
      
      // Get teams
      const defaultTeams = [
        { 
          id: '1', 
          name: 'Local Rangers', 
          description: 'Our neighborhood football team',
          players: [{
            id: '1',
            playerId: 'player-1',
            player: { name: 'John Doe', position: 'MID' },
            role: 'CAPTAIN',
            jerseyNumber: 10
          }], 
          createdBy: '1' 
        },
        { 
          id: '2', 
          name: 'Sunday Warriors',
          description: 'Weekend football enthusiasts', 
          players: [{
            id: '2',
            playerId: 'player-2',
            player: { name: 'Jane Smith', position: 'FWD' },
            role: 'CAPTAIN',
            jerseyNumber: 9
          }], 
          createdBy: '1' 
        }
      ];
      
      const userTeams = global.mockTeams || [];
      return {
        teams: [...defaultTeams, ...userTeams]
      };
    }

    if (endpoint.startsWith('/teams/')) {
      const teamId = endpoint.split('/')[2];
      const allTeams = [
        { 
          id: '1', 
          name: 'Local Rangers', 
          description: 'Our neighborhood football team with a focus on developing young talent and playing beautiful football.',
          players: [
            {
              id: '1',
              playerId: 'player-1',
              player: { name: 'John Doe', position: 'MID' },
              role: 'CAPTAIN',
              jerseyNumber: 10
            },
            {
              id: '2',
              playerId: 'player-2',
              player: { name: 'Mike Johnson', position: 'DEF' },
              role: 'PLAYER',
              jerseyNumber: 5
            },
            {
              id: '3',
              playerId: 'player-3',
              player: { name: 'Alex Brown', position: 'GK' },
              role: 'PLAYER',
              jerseyNumber: 1
            }
          ], 
          createdBy: '1' 
        },
        { 
          id: '2', 
          name: 'Sunday Warriors',
          description: 'Weekend football enthusiasts who love the game and play for fun and fitness.', 
          players: [
            {
              id: '4',
              playerId: 'player-4',
              player: { name: 'Jane Smith', position: 'FWD' },
              role: 'CAPTAIN',
              jerseyNumber: 9
            },
            {
              id: '5',
              playerId: 'player-5',
              player: { name: 'Tom Wilson', position: 'MID' },
              role: 'VICE_CAPTAIN',
              jerseyNumber: 8
            }
          ], 
          createdBy: '1' 
        },
        ...(global.mockTeams || [])
      ];
      
      const team = allTeams.find(t => t.id === teamId);
      if (team) {
        return { team };
      }
      throw new Error('Team not found');
    }

    if (endpoint === '/matches') {
      if (options.method === 'POST') {
        const newMatch = {
          id: Math.random().toString(),
          homeTeamId: body.homeTeamId,
          awayTeamId: body.awayTeamId,
          homeTeam: { name: 'Home Team' },
          awayTeam: { name: 'Away Team' },
          venue: body.venue,
          matchDate: body.matchDate,
          duration: body.duration || 90,
          homeScore: 0,
          awayScore: 0,
          status: 'SCHEDULED',
          events: []
        };
        
        // Store in temporary array for mock persistence
        if (!global.mockMatches) global.mockMatches = [];
        global.mockMatches.push(newMatch);
        
        return {
          match: newMatch,
          message: 'Match created successfully'
        };
      }
      
      // Get matches
      const defaultMatches = [
        {
          id: '1',
          homeTeam: { name: 'Local Rangers' },
          awayTeam: { name: 'City United' },
          homeScore: 2,
          awayScore: 1,
          status: 'COMPLETED',
          matchDate: new Date(Date.now() - 86400000).toISOString(), // Yesterday
          venue: 'Central Park',
          events: [
            {
              id: '1',
              eventType: 'GOAL',
              minute: 15,
              player: { name: 'John Doe' },
              teamId: 'team-1'
            },
            {
              id: '2',
              eventType: 'GOAL',
              minute: 32,
              player: { name: 'Mike Johnson' },
              teamId: 'team-2'
            }
          ]
        },
        {
          id: '2',
          homeTeam: { name: 'Sunday Warriors' },
          awayTeam: { name: 'FC Legends' },
          homeScore: 0,
          awayScore: 0,
          status: 'LIVE',
          matchDate: new Date().toISOString(), // Now
          venue: 'Sports Complex',
          events: []
        },
        {
          id: '3',
          homeTeam: { name: 'Local Rangers' },
          awayTeam: { name: 'Sunday Warriors' },
          homeScore: 0,
          awayScore: 0,
          status: 'SCHEDULED',
          matchDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
          venue: 'Home Ground',
          events: []
        }
      ];
      
      const userMatches = global.mockMatches || [];
      return {
        matches: [...defaultMatches, ...userMatches]
      };
    }

    if (endpoint.startsWith('/matches/')) {
      const parts = endpoint.split('/');
      const matchId = parts[2];
      
      if (parts[3] === 'start') {
        // Start match endpoint
        const allMatches = [
          {
            id: '1',
            homeTeam: { name: 'Local Rangers' },
            awayTeam: { name: 'City United' },
            homeScore: 2,
            awayScore: 1,
            status: 'LIVE', // Updated to LIVE
            matchDate: new Date().toISOString(),
            venue: 'Central Park',
            events: []
          }
        ];
        
        const match = allMatches.find(m => m.id === matchId);
        if (match) {
          return { match, message: 'Match started successfully' };
        }
        throw new Error('Match not found');
      }
      
      if (parts[3] === 'events') {
        // Add match event
        const newEvent = {
          id: Math.random().toString(),
          matchId: matchId,
          playerId: body.playerId,
          teamId: body.teamId,
          eventType: body.eventType,
          minute: body.minute,
          description: body.description,
          player: { name: 'Player Name' },
          createdAt: new Date().toISOString()
        };
        
        return {
          event: newEvent,
          message: 'Event added successfully'
        };
      }
      
      // Get single match
      const allMatches = [
        {
          id: '1',
          homeTeam: { 
            name: 'Local Rangers',
            players: [
              { id: '1', name: 'John Doe', position: 'MID', jerseyNumber: 10 },
              { id: '2', name: 'Mike Johnson', position: 'DEF', jerseyNumber: 5 }
            ]
          },
          awayTeam: { 
            name: 'City United',
            players: [
              { id: '3', name: 'Alex Smith', position: 'FWD', jerseyNumber: 9 },
              { id: '4', name: 'Tom Wilson', position: 'GK', jerseyNumber: 1 }
            ]
          },
          homeScore: 2,
          awayScore: 1,
          status: 'COMPLETED',
          matchDate: new Date(Date.now() - 86400000).toISOString(),
          venue: 'Central Park',
          events: [
            {
              id: '1',
              eventType: 'GOAL',
              minute: 15,
              player: { name: 'John Doe' },
              teamId: 'team-1'
            }
          ]
        },
        {
          id: '2',
          homeTeam: { 
            name: 'Sunday Warriors',
            players: [
              { id: '5', name: 'Jane Smith', position: 'FWD', jerseyNumber: 9 },
              { id: '6', name: 'Bob Brown', position: 'MID', jerseyNumber: 8 }
            ]
          },
          awayTeam: { 
            name: 'FC Legends',
            players: [
              { id: '7', name: 'Chris Wilson', position: 'DEF', jerseyNumber: 4 },
              { id: '8', name: 'Dave Johnson', position: 'GK', jerseyNumber: 1 }
            ]
          },
          homeScore: 0,
          awayScore: 0,
          status: 'LIVE',
          matchDate: new Date().toISOString(),
          venue: 'Sports Complex',
          events: []
        },
        ...(global.mockMatches || [])
      ];
      
      const match = allMatches.find(m => m.id === matchId);
      if (match) {
        return { match };
      }
      throw new Error('Match not found');
    }

    // Stats endpoints
    if (endpoint === '/stats/me') {
      return {
        playerId: 'player-1',
        playerName: 'John Doe',
        position: 'MID',
        matchesPlayed: 8,
        goals: 12,
        assists: 7,
        yellowCards: 2,
        redCards: 0,
        minutesPlayed: 720
      };
    }

    if (endpoint.startsWith('/stats/player/')) {
      const playerId = endpoint.split('/')[3];
      return {
        playerId,
        playerName: 'Player Name',
        position: 'MID',
        matchesPlayed: 5,
        goals: 3,
        assists: 2,
        yellowCards: 1,
        redCards: 0,
        minutesPlayed: 450
      };
    }

    if (endpoint === '/stats/players') {
      return {
        players: [
          {
            playerId: 'player-1',
            playerName: 'John Doe',
            position: 'MID',
            matchesPlayed: 8,
            goals: 12,
            assists: 7,
            yellowCards: 2,
            redCards: 0,
            minutesPlayed: 720
          },
          {
            playerId: 'player-2',
            playerName: 'Jane Smith',
            position: 'FWD',
            matchesPlayed: 6,
            goals: 8,
            assists: 3,
            yellowCards: 1,
            redCards: 0,
            minutesPlayed: 540
          },
          {
            playerId: 'player-3',
            playerName: 'Mike Johnson',
            position: 'DEF',
            matchesPlayed: 7,
            goals: 2,
            assists: 4,
            yellowCards: 3,
            redCards: 1,
            minutesPlayed: 630
          }
        ]
      };
    }

    if (endpoint.startsWith('/stats/team/')) {
      const teamId = endpoint.split('/')[3];
      return {
        teamId,
        teamName: 'Local Rangers',
        players: [
          {
            playerId: 'player-1',
            playerName: 'John Doe',
            position: 'MID',
            role: 'CAPTAIN',
            jerseyNumber: 10,
            matchesPlayed: 8,
            goals: 12,
            assists: 7,
            yellowCards: 2,
            redCards: 0
          },
          {
            playerId: 'player-2',
            playerName: 'Mike Johnson',
            position: 'DEF',
            role: 'PLAYER',
            jerseyNumber: 5,
            matchesPlayed: 7,
            goals: 2,
            assists: 4,
            yellowCards: 3,
            redCards: 1
          }
        ]
      };
    }

    if (endpoint.startsWith('/stats/leaderboard')) {
      return {
        type: 'goals',
        limit: 10,
        leaderboard: [
          {
            playerId: 'player-1',
            playerName: 'John Doe',
            position: 'MID',
            matchesPlayed: 8,
            goals: 12,
            assists: 7,
            yellowCards: 2,
            redCards: 0,
            minutesPlayed: 720
          },
          {
            playerId: 'player-2',
            playerName: 'Jane Smith',
            position: 'FWD',
            matchesPlayed: 6,
            goals: 8,
            assists: 3,
            yellowCards: 1,
            redCards: 0,
            minutesPlayed: 540
          },
          {
            playerId: 'player-3',
            playerName: 'Mike Johnson',
            position: 'DEF',
            matchesPlayed: 7,
            goals: 2,
            assists: 4,
            yellowCards: 3,
            redCards: 1,
            minutesPlayed: 630
          },
          {
            playerId: 'player-4',
            playerName: 'Alex Brown',
            position: 'GK',
            matchesPlayed: 5,
            goals: 0,
            assists: 1,
            yellowCards: 0,
            redCards: 0,
            minutesPlayed: 450
          }
        ]
      };
    }

    // Player profile endpoints
    if (endpoint === '/players/me') {
      if (options.method === 'PUT') {
        return {
          player: {
            id: 'player-1',
            userId: 'user-1',
            name: body.name || 'John Doe',
            position: body.position || 'MID',
            preferredFoot: body.preferredFoot || 'RIGHT',
            bio: body.bio || 'Passionate football player who loves the beautiful game!',
            location: body.location || 'Mumbai',
            height: body.height ? parseInt(body.height) : 175,
            weight: body.weight ? parseInt(body.weight) : 70,
            dateOfBirth: body.dateOfBirth,
            avatarUrl: null,
            createdAt: new Date().toISOString()
          },
          message: 'Player profile updated successfully'
        };
      }
      
      // GET request
      return {
        player: {
          id: 'player-1',
          userId: 'user-1',
          name: 'John Doe',
          position: 'MID',
          preferredFoot: 'RIGHT',
          bio: 'Passionate football player who loves the beautiful game!',
          location: 'Mumbai',
          height: 175,
          weight: 70,
          dateOfBirth: null,
          avatarUrl: null,
          createdAt: new Date().toISOString()
        }
      };
    }

    // Tournament endpoints
    if (endpoint === '/tournaments') {
      if (options.method === 'POST') {
        return {
          tournament: {
            id: Math.random().toString(),
            name: body.name,
            description: body.description,
            tournamentType: body.tournamentType,
            startDate: body.startDate,
            endDate: body.endDate,
            maxTeams: body.maxTeams,
            registeredTeams: 0,
            entryFee: body.entryFee,
            prizePool: body.prizePool,
            status: 'UPCOMING',
            createdBy: 'user-1',
            createdAt: new Date().toISOString()
          },
          message: 'Tournament created successfully'
        };
      }

      // GET tournaments
      return {
        tournaments: [
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
            createdBy: 'user-1'
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
            createdBy: 'user-1'
          }
        ]
      };
    }

    if (endpoint.startsWith('/tournaments/') && endpoint.includes('/standings')) {
      return {
        standings: [
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
        ]
      };
    }

    if (endpoint.startsWith('/tournaments/') && endpoint.includes('/register')) {
      return {
        message: 'Team registered to tournament successfully'
      };
    }

    if (endpoint.startsWith('/tournaments/') && !endpoint.includes('/standings') && !endpoint.includes('/register')) {
      const tournamentId = endpoint.split('/')[2];
      return {
        tournament: {
          id: tournamentId,
          name: 'Summer League 2024',
          description: 'Annual summer tournament for local teams with exciting matches and great prizes',
          tournamentType: 'LEAGUE',
          startDate: '2024-06-01T00:00:00.000Z',
          endDate: '2024-08-31T23:59:59.999Z',
          maxTeams: 8,
          registeredTeams: 6,
          entryFee: 500,
          prizePool: 3000,
          status: 'UPCOMING',
          createdBy: 'user-1',
          teams: [],
          matches: []
        }
      };
    }

    return { message: 'Mock response' };
  }

  // Auth endpoints
  async login(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(name: string, email: string, password: string) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
  }

  // Teams endpoints
  async getTeams() {
    return this.request('/teams');
  }

  async createTeam(name: string, description?: string) {
    return this.request('/teams', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    });
  }

  async getTeamById(id: string) {
    return this.request(`/teams/${id}`);
  }

  // Matches endpoints
  async getMatches() {
    return this.request('/matches');
  }

  async createMatch(matchData: {
    homeTeamId: string;
    awayTeamId: string;
    venue?: string;
    matchDate: string;
    duration?: number;
  }) {
    return this.request('/matches', {
      method: 'POST',
      body: JSON.stringify(matchData),
    });
  }

  async getMatchById(id: string) {
    return this.request(`/matches/${id}`);
  }

  async startMatch(id: string) {
    return this.request(`/matches/${id}/start`, {
      method: 'PATCH',
    });
  }

  async addMatchEvent(matchId: string, eventData: {
    playerId: string;
    teamId: string;
    eventType: 'GOAL' | 'ASSIST' | 'YELLOW_CARD' | 'RED_CARD' | 'SUBSTITUTION';
    minute: number;
    description?: string;
  }) {
    return this.request(`/matches/${matchId}/events`, {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
  }

  // Stats endpoints
  async getCurrentUserStats() {
    return this.request('/stats/me');
  }

  async getPlayerStats(playerId: string) {
    return this.request(`/stats/player/${playerId}`);
  }

  async getAllPlayersStats() {
    return this.request('/stats/players');
  }

  async getTeamPlayersStats(teamId: string) {
    return this.request(`/stats/team/${teamId}`);
  }

  async getLeaderboard(type: 'goals' | 'assists' | 'matches' | 'minutes' = 'goals', limit: number = 10) {
    return this.request(`/stats/leaderboard?type=${type}&limit=${limit}`);
  }

  // Player profile endpoints
  async getCurrentPlayerProfile() {
    return this.request('/players/me');
  }

  async updateCurrentPlayerProfile(playerData: {
    name?: string;
    position?: 'GK' | 'DEF' | 'MID' | 'FWD';
    preferredFoot?: 'LEFT' | 'RIGHT' | 'BOTH';
    bio?: string;
    location?: string;
    height?: string;
    weight?: string;
    dateOfBirth?: string;
  }) {
    return this.request('/players/me', {
      method: 'PUT',
      body: JSON.stringify(playerData),
    });
  }

  async getPlayerById(playerId: string) {
    return this.request(`/players/${playerId}`);
  }

  // Tournament endpoints
  async getTournaments() {
    return this.request('/tournaments');
  }

  async createTournament(tournamentData: {
    name: string;
    description?: string;
    tournamentType: 'LEAGUE' | 'KNOCKOUT' | 'GROUP_STAGE';
    maxTeams: number;
    entryFee?: number;
    prizePool?: number;
    startDate: string;
    endDate: string;
  }) {
    return this.request('/tournaments', {
      method: 'POST',
      body: JSON.stringify(tournamentData),
    });
  }

  async getTournamentById(tournamentId: string) {
    return this.request(`/tournaments/${tournamentId}`);
  }

  async registerTeamToTournament(tournamentId: string, teamId: string) {
    return this.request(`/tournaments/${tournamentId}/register`, {
      method: 'POST',
      body: JSON.stringify({ teamId }),
    });
  }

  async getTournamentStandings(tournamentId: string) {
    return this.request(`/tournaments/${tournamentId}/standings`);
  }
}

export const apiService = new ApiService();