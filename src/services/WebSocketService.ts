import { WebSocket, WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';
import { matchTimerService, MatchTimerUpdate } from './MatchTimerService';
import jwt from 'jsonwebtoken';

interface ClientConnection {
  ws: WebSocket;
  userId: string;
  subscribedMatches: Set<string>;
  lastPing: number;
}

/**
 * Professional WebSocket service for real-time match updates
 * Handles timer synchronization like ESPN/BBC Sport
 */
export class WebSocketService {
  private static instance: WebSocketService;
  private wss: WebSocketServer | null = null;
  private clients: Map<string, ClientConnection> = new Map();
  private pingInterval: NodeJS.Timeout | null = null;

  private constructor() {
    // Initialize timer service event listener
    matchTimerService.on('timerUpdate', (update: MatchTimerUpdate) => {
      console.log(`🔌 WEBSOCKET_SERVICE: Received timer update for match ${update.matchId}:`, update.timerState?.currentMinute);
      this.broadcastToMatch(update.matchId, update);
    });
  }

  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  /**
   * Initialize WebSocket server
   */
  public initialize(server: any): void {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws',
      clientTracking: true
    });

    this.wss.on('connection', (ws: WebSocket, request: IncomingMessage) => {
      this.handleConnection(ws, request);
    });

    // Start ping/pong for connection health
    this.startPingInterval();

    console.log('🔌 WEBSOCKET_SERVICE: WebSocket server initialized on /ws');
  }

  /**
   * Handle new WebSocket connection
   */
  private async handleConnection(ws: WebSocket, request: IncomingMessage): Promise<void> {
    try {
      // Extract token from query params or headers
      const url = new URL(request.url || '', `http://${request.headers.host}`);
      const token = url.searchParams.get('token') || request.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        ws.close(1008, 'Authentication required');
        return;
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
      const userId = decoded.id;

      if (!userId) {
        ws.close(1008, 'Invalid token');
        return;
      }

      // Create client connection
      const clientId = `${userId}-${Date.now()}`;
      const client: ClientConnection = {
        ws,
        userId,
        subscribedMatches: new Set(),
        lastPing: Date.now()
      };

      this.clients.set(clientId, client);

      console.log(`🔗 WEBSOCKET_SERVICE: Client ${userId} connected (${clientId})`);

      // Handle messages from client
      ws.on('message', (data: Buffer) => {
        this.handleMessage(clientId, data);
      });

      // Handle disconnection
      ws.on('close', () => {
        this.clients.delete(clientId);
        console.log(`🔌 WEBSOCKET_SERVICE: Client ${userId} disconnected (${clientId})`);
      });

      // Handle errors
      ws.on('error', (error) => {
        console.error(`❌ WEBSOCKET_SERVICE: Client ${userId} error:`, error);
        this.clients.delete(clientId);
      });

      // Send welcome message with connection status
      this.sendToClient(clientId, {
        type: 'CONNECTION_ESTABLISHED',
        message: 'Connected to match timer service',
        serverTime: Date.now()
      });

    } catch (error) {
      console.error('❌ WEBSOCKET_SERVICE: Connection authentication failed:', error);
      ws.close(1008, 'Authentication failed');
    }
  }

  /**
   * Handle incoming messages from clients
   */
  private handleMessage(clientId: string, data: Buffer): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    try {
      const message = JSON.parse(data.toString());
      
      switch (message.type) {
        case 'SUBSCRIBE_MATCH':
          this.subscribeToMatch(clientId, message.matchId);
          break;
          
        case 'UNSUBSCRIBE_MATCH':
          this.unsubscribeFromMatch(clientId, message.matchId);
          break;
          
        case 'GET_MATCH_STATE':
          this.sendMatchState(clientId, message.matchId);
          break;
          
        case 'PING':
          client.lastPing = Date.now();
          this.sendToClient(clientId, { type: 'PONG', serverTime: Date.now() });
          break;
          
        default:
          console.warn(`⚠️ WEBSOCKET_SERVICE: Unknown message type: ${message.type}`);
      }
    } catch (error) {
      console.error('❌ WEBSOCKET_SERVICE: Error handling message:', error);
    }
  }

  /**
   * Subscribe client to match timer updates
   */
  private subscribeToMatch(clientId: string, matchId: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    client.subscribedMatches.add(matchId);
    
    // Send current match state immediately
    this.sendMatchState(clientId, matchId);
    
    console.log(`📺 WEBSOCKET_SERVICE: Client ${client.userId} subscribed to match ${matchId}`);
  }

  /**
   * Unsubscribe client from match timer updates
   */
  private unsubscribeFromMatch(clientId: string, matchId: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    client.subscribedMatches.delete(matchId);
    console.log(`📺 WEBSOCKET_SERVICE: Client ${client.userId} unsubscribed from match ${matchId}`);
  }

  /**
   * Send current match timer state to client
   */
  private sendMatchState(clientId: string, matchId: string): void {
    const state = matchTimerService.getMatchState(matchId);
    if (!state) {
      this.sendToClient(clientId, {
        type: 'MATCH_NOT_FOUND',
        matchId,
        message: 'Match not found or not active'
      });
      return;
    }

    this.sendToClient(clientId, {
      type: 'MATCH_STATE',
      matchId,
      timerState: state,
      serverTime: Date.now()
    });
  }

  /**
   * Broadcast timer update to all clients subscribed to a match
   */
  private broadcastToMatch(matchId: string, update: MatchTimerUpdate): void {
    let sentCount = 0;
    
    console.log(`📡 WEBSOCKET_SERVICE: Broadcasting to match ${matchId}, connected clients: ${this.clients.size}`);
    
    for (const [clientId, client] of this.clients) {
      console.log(`📡 WEBSOCKET_SERVICE: Checking client ${clientId}, subscribed to: [${Array.from(client.subscribedMatches).join(', ')}]`);
      
      if (client.subscribedMatches.has(matchId) && client.ws.readyState === WebSocket.OPEN) {
        try {
          const message = JSON.stringify({
            type: 'MATCH_TIMER_UPDATE',
            data: update
          });
          client.ws.send(message);
          sentCount++;
          console.log(`📡 WEBSOCKET_SERVICE: Sent timer update to client ${clientId}`);
        } catch (error) {
          console.error(`❌ WEBSOCKET_SERVICE: Failed to send to client ${clientId}:`, error);
          this.clients.delete(clientId);
        }
      }
    }

    if (sentCount > 0) {
      console.log(`📡 WEBSOCKET_SERVICE: Broadcasted ${update.type} for match ${matchId} to ${sentCount} clients`);
    }
  }

  /**
   * Send message to specific client
   */
  private sendToClient(clientId: string, message: any): void {
    const client = this.clients.get(clientId);
    if (!client || client.ws.readyState !== WebSocket.OPEN) return;

    try {
      client.ws.send(JSON.stringify(message));
    } catch (error) {
      console.error(`❌ WEBSOCKET_SERVICE: Failed to send to client ${clientId}:`, error);
      this.clients.delete(clientId);
    }
  }

  /**
   * Start ping interval to detect dead connections
   */
  private startPingInterval(): void {
    this.pingInterval = setInterval(() => {
      const now = Date.now();
      const deadClients: string[] = [];

      for (const [clientId, client] of this.clients) {
        // Consider client dead if no ping for 60 seconds
        if (now - client.lastPing > 60000) {
          deadClients.push(clientId);
        } else if (client.ws.readyState === WebSocket.OPEN) {
          // Send ping
          try {
            client.ws.ping();
          } catch (error) {
            deadClients.push(clientId);
          }
        }
      }

      // Remove dead clients
      deadClients.forEach(clientId => {
        console.log(`💀 WEBSOCKET_SERVICE: Removing dead client ${clientId}`);
        this.clients.delete(clientId);
      });

    }, 30000); // Check every 30 seconds
  }

  /**
   * Get service stats
   */
  public getStats(): { connectedClients: number, activeMatches: string[] } {
    return {
      connectedClients: this.clients.size,
      activeMatches: matchTimerService.getActiveMatches()
    };
  }

  /**
   * Cleanup WebSocket service
   */
  public cleanup(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }

    if (this.wss) {
      this.wss.close();
    }

    this.clients.clear();
    console.log('🧹 WEBSOCKET_SERVICE: Cleaned up WebSocket service');
  }
}

// Export singleton instance
export const webSocketService = WebSocketService.getInstance();