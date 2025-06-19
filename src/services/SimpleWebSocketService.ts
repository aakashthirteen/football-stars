import { WebSocket, WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';
import { Server } from 'http';
import { simpleMatchTimer, TimerUpdate } from './SimpleMatchTimer';

interface ClientConnection {
  ws: WebSocket;
  clientId: string;
  subscribedMatches: Set<string>;
}

/**
 * Simple WebSocket service - built from scratch for reliability
 */
export class SimpleWebSocketService {
  private static instance: SimpleWebSocketService;
  private wss: WebSocketServer | null = null;
  private clients: Map<string, ClientConnection> = new Map();

  private constructor() {
    // Listen to timer updates
    simpleMatchTimer.on('timerUpdate', (update: TimerUpdate) => {
      console.log(`🔌 WebSocket: Broadcasting timer update for match ${update.matchId}`);
      this.broadcastToMatch(update.matchId, update);
    });
  }

  public static getInstance(): SimpleWebSocketService {
    if (!SimpleWebSocketService.instance) {
      SimpleWebSocketService.instance = new SimpleWebSocketService();
    }
    return SimpleWebSocketService.instance;
  }

  /**
   * Initialize WebSocket server
   */
  public initialize(server: Server): void {
    console.log('🔌 SimpleWebSocket: Initializing WebSocket server...');

    this.wss = new WebSocketServer({
      server,
      path: '/simple-ws'
    });

    this.wss.on('connection', (ws: WebSocket, request: IncomingMessage) => {
      this.handleConnection(ws, request);
    });

    console.log('✅ SimpleWebSocket: WebSocket server ready on /simple-ws');
  }

  /**
   * Handle new client connection
   */
  private handleConnection(ws: WebSocket, request: IncomingMessage): void {
    // Generate simple client ID
    const clientId = `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`👋 SimpleWebSocket: New client connected: ${clientId}`);

    // Create client connection
    const client: ClientConnection = {
      ws,
      clientId,
      subscribedMatches: new Set()
    };

    this.clients.set(clientId, client);

    // Handle messages from client
    ws.on('message', (data) => {
      this.handleMessage(clientId, data);
    });

    // Handle client disconnect
    ws.on('close', () => {
      console.log(`👋 SimpleWebSocket: Client disconnected: ${clientId}`);
      this.clients.delete(clientId);
    });

    // Handle connection errors
    ws.on('error', (error) => {
      console.error(`❌ SimpleWebSocket: Client error for ${clientId}:`, error);
      this.clients.delete(clientId);
    });

    // Send welcome message
    this.sendToClient(clientId, {
      type: 'WELCOME',
      message: 'Connected to football timer service',
      clientId
    });
  }

  /**
   * Handle message from client
   */
  private handleMessage(clientId: string, data: any): void {
    try {
      const message = JSON.parse(data.toString());
      console.log(`📨 SimpleWebSocket: Message from ${clientId}:`, message);

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
          this.sendToClient(clientId, { type: 'PONG', serverTime: Date.now() });
          break;
        default:
          console.warn(`⚠️ SimpleWebSocket: Unknown message type: ${message.type}`);
      }
    } catch (error) {
      console.error(`❌ SimpleWebSocket: Error handling message from ${clientId}:`, error);
    }
  }

  /**
   * Subscribe client to match updates
   */
  private subscribeToMatch(clientId: string, matchId: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    client.subscribedMatches.add(matchId);
    console.log(`📺 SimpleWebSocket: Client ${clientId} subscribed to match ${matchId}`);

    // Send current match state immediately
    this.sendMatchState(clientId, matchId);
  }

  /**
   * Unsubscribe client from match updates
   */
  private unsubscribeFromMatch(clientId: string, matchId: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    client.subscribedMatches.delete(matchId);
    console.log(`📺 SimpleWebSocket: Client ${clientId} unsubscribed from match ${matchId}`);
  }

  /**
   * Send current match state to client
   */
  private sendMatchState(clientId: string, matchId: string): void {
    const state = simpleMatchTimer.getState(matchId);
    
    if (!state) {
      this.sendToClient(clientId, {
        type: 'MATCH_NOT_FOUND',
        matchId,
        message: 'Match not active'
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
   * Send message to specific client
   */
  private sendToClient(clientId: string, message: any): void {
    const client = this.clients.get(clientId);
    if (!client || client.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    try {
      client.ws.send(JSON.stringify(message));
    } catch (error) {
      console.error(`❌ SimpleWebSocket: Failed to send to ${clientId}:`, error);
      this.clients.delete(clientId);
    }
  }

  /**
   * Broadcast timer update to all clients subscribed to a match
   */
  private broadcastToMatch(matchId: string, update: TimerUpdate): void {
    let sentCount = 0;

    for (const [clientId, client] of this.clients) {
      if (client.subscribedMatches.has(matchId) && client.ws.readyState === WebSocket.OPEN) {
        try {
          const message = {
            type: 'TIMER_UPDATE',
            matchId,
            timerState: update.timerState,
            updateType: update.type,
            serverTime: Date.now()
          };

          client.ws.send(JSON.stringify(message));
          sentCount++;
        } catch (error) {
          console.error(`❌ SimpleWebSocket: Failed to broadcast to ${clientId}:`, error);
          this.clients.delete(clientId);
        }
      }
    }

    if (sentCount > 0) {
      console.log(`📡 SimpleWebSocket: Broadcasted to ${sentCount} clients for match ${matchId}`);
    }
  }

  /**
   * Get connection statistics
   */
  public getStats(): { totalClients: number; activeMatches: string[] } {
    const activeMatches = new Set<string>();
    for (const client of this.clients.values()) {
      for (const matchId of client.subscribedMatches) {
        activeMatches.add(matchId);
      }
    }

    return {
      totalClients: this.clients.size,
      activeMatches: Array.from(activeMatches)
    };
  }
}

// Export singleton
export const simpleWebSocketService = SimpleWebSocketService.getInstance();