import { Response } from 'express';
import { database } from '../models/databaseFactory';
import { AuthRequest } from '../types';

export const getCurrentPlayer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    let player = await database.getPlayerByUserId(req.user.id);
    
    // If no player profile exists, create one automatically
    if (!player) {
      console.log('Creating player profile for user:', req.user.id);
      try {
        player = await database.createPlayer(req.user.id, req.user.name, 'MID', 'RIGHT');
      } catch (createError) {
        console.error('Error creating player profile:', createError);
        res.status(500).json({ error: 'Failed to create player profile' });
        return;
      }
    }

    res.json({ player });
  } catch (error) {
    console.error('Get current player error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateCurrentPlayer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    let player = await database.getPlayerByUserId(req.user.id);
    
    // If no player profile exists, create one automatically
    if (!player) {
      console.log('Creating player profile for user:', req.user.id);
      try {
        player = await database.createPlayer(req.user.id, req.user.name, 'MID', 'RIGHT');
      } catch (createError) {
        console.error('Error creating player profile:', createError);
        res.status(500).json({ error: 'Failed to create player profile' });
        return;
      }
    }

    const {
      name,
      position,
      preferredFoot,
      dateOfBirth,
      height,
      weight,
      bio,
      location,
      profileImage,
      avatarUrl
    } = req.body as any;

    // Validate position if provided
    if (position && !['GK', 'DEF', 'MID', 'FWD'].includes(position)) {
      res.status(400).json({ error: 'Invalid position. Must be GK, DEF, MID, or FWD' });
      return;
    }

    // Validate preferred foot if provided
    if (preferredFoot && !['LEFT', 'RIGHT', 'BOTH'].includes(preferredFoot)) {
      res.status(400).json({ error: 'Invalid preferred foot. Must be LEFT, RIGHT, or BOTH' });
      return;
    }

    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (position !== undefined) updates.position = position;
    if (preferredFoot !== undefined) updates.preferredFoot = preferredFoot;
    if (dateOfBirth !== undefined) updates.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : undefined;
    if (height !== undefined) updates.height = height ? parseInt(height, 10) : null;
    if (weight !== undefined) updates.weight = weight ? parseInt(weight, 10) : null;
    if (bio !== undefined) updates.bio = bio;
    if (location !== undefined) updates.location = location;
    
    // Handle profile image (support both field names for compatibility)
    const imageUrl = profileImage || avatarUrl;
    if (imageUrl !== undefined) updates.avatar_url = imageUrl;

    const updatedPlayer = await database.updatePlayer(player.id, updates);

    res.json({
      player: updatedPlayer,
      message: 'Player profile updated successfully'
    });
  } catch (error) {
    console.error('Update player error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getPlayerById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    
    const player = await database.getPlayerById(id);
    if (!player) {
      res.status(404).json({ error: 'Player not found' });
      return;
    }

    res.json({ player });
  } catch (error) {
    console.error('Get player by ID error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const searchPlayers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { query, position, location, limit = 20 } = req.query;
    
    const players = await database.searchPlayers({
      query: query as string,
      position: position as string,
      location: location as string,
      limit: parseInt(limit as string, 10)
    });

    res.json({ players });
  } catch (error) {
    console.error('Search players error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Connection Management Endpoints
export const sendConnectionRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const currentPlayer = await database.getPlayerByUserId(req.user.id);
    if (!currentPlayer) {
      res.status(404).json({ error: 'Player profile not found' });
      return;
    }

    const { connectedPlayerId } = req.body;
    
    if (!connectedPlayerId) {
      res.status(400).json({ error: 'Connected player ID is required' });
      return;
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(connectedPlayerId)) {
      res.status(400).json({ error: 'Invalid player ID format' });
      return;
    }

    const connection = await database.createConnectionRequest(currentPlayer.id, connectedPlayerId);
    
    // Create notification for the target player
    await database.createConnectionRequestNotification(currentPlayer.id, connectedPlayerId);

    res.status(201).json({
      connection,
      message: 'Connection request sent successfully'
    });
  } catch (error) {
    console.error('Send connection request error:', error);
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export const acceptConnectionRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const currentPlayer = await database.getPlayerByUserId(req.user.id);
    if (!currentPlayer) {
      res.status(404).json({ error: 'Player profile not found' });
      return;
    }

    const { id: connectionId } = req.params;
    
    // Get the connection to verify ownership
    const connection = await database.getConnectionById(connectionId);
    if (!connection) {
      res.status(404).json({ error: 'Connection request not found' });
      return;
    }

    // Only the recipient can accept
    if (connection.connectedPlayerId !== currentPlayer.id) {
      res.status(403).json({ error: 'You can only accept requests sent to you' });
      return;
    }

    if (connection.status !== 'pending') {
      res.status(400).json({ error: 'Connection request is no longer pending' });
      return;
    }

    const updatedConnection = await database.updateConnectionStatus(connectionId, 'accepted');
    
    // Create notification for the requester
    await database.createConnectionAcceptedNotification(currentPlayer.id, connection.playerId);

    res.json({
      connection: updatedConnection,
      message: 'Connection request accepted successfully'
    });
  } catch (error) {
    console.error('Accept connection request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const rejectConnectionRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const currentPlayer = await database.getPlayerByUserId(req.user.id);
    if (!currentPlayer) {
      res.status(404).json({ error: 'Player profile not found' });
      return;
    }

    const { id: connectionId } = req.params;
    
    // Get the connection to verify ownership
    const connection = await database.getConnectionById(connectionId);
    if (!connection) {
      res.status(404).json({ error: 'Connection request not found' });
      return;
    }

    // Only the recipient can reject
    if (connection.connectedPlayerId !== currentPlayer.id) {
      res.status(403).json({ error: 'You can only reject requests sent to you' });
      return;
    }

    if (connection.status !== 'pending') {
      res.status(400).json({ error: 'Connection request is no longer pending' });
      return;
    }

    const updatedConnection = await database.updateConnectionStatus(connectionId, 'rejected');

    res.json({
      connection: updatedConnection,
      message: 'Connection request rejected successfully'
    });
  } catch (error) {
    console.error('Reject connection request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getPlayerConnections = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const currentPlayer = await database.getPlayerByUserId(req.user.id);
    if (!currentPlayer) {
      res.status(404).json({ error: 'Player profile not found' });
      return;
    }

    const connections = await database.getPlayerConnections(currentPlayer.id);

    res.json({ connections });
  } catch (error) {
    console.error('Get player connections error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getPendingConnectionRequests = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const currentPlayer = await database.getPlayerByUserId(req.user.id);
    if (!currentPlayer) {
      res.status(404).json({ error: 'Player profile not found' });
      return;
    }

    const pendingRequests = await database.getPendingConnectionRequests(currentPlayer.id);

    res.json({ pendingRequests });
  } catch (error) {
    console.error('Get pending connection requests error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const removeConnection = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const currentPlayer = await database.getPlayerByUserId(req.user.id);
    if (!currentPlayer) {
      res.status(404).json({ error: 'Player profile not found' });
      return;
    }

    const { id: connectionId } = req.params;
    
    // Get the connection to verify ownership
    const connection = await database.getConnectionById(connectionId);
    if (!connection) {
      res.status(404).json({ error: 'Connection not found' });
      return;
    }

    // Only involved players can remove the connection
    if (connection.playerId !== currentPlayer.id && connection.connectedPlayerId !== currentPlayer.id) {
      res.status(403).json({ error: 'You can only remove your own connections' });
      return;
    }

    const removed = await database.removeConnection(connectionId);
    
    if (!removed) {
      res.status(404).json({ error: 'Connection not found' });
      return;
    }

    res.json({ message: 'Connection removed successfully' });
  } catch (error) {
    console.error('Remove connection error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Notification Management Endpoints
export const getPlayerNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const currentPlayer = await database.getPlayerByUserId(req.user.id);
    if (!currentPlayer) {
      res.status(404).json({ error: 'Player profile not found' });
      return;
    }

    const { limit = 50 } = req.query;
    const notifications = await database.getPlayerNotifications(
      currentPlayer.id, 
      parseInt(limit as string, 10)
    );

    const unreadCount = await database.getUnreadNotificationCount(currentPlayer.id);

    res.json({ 
      notifications,
      unreadCount 
    });
  } catch (error) {
    console.error('Get player notifications error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const markNotificationAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const currentPlayer = await database.getPlayerByUserId(req.user.id);
    if (!currentPlayer) {
      res.status(404).json({ error: 'Player profile not found' });
      return;
    }

    const { id: notificationId } = req.params;
    
    const notification = await database.markNotificationAsRead(notificationId);
    
    if (!notification) {
      res.status(404).json({ error: 'Notification not found' });
      return;
    }

    // Verify the notification belongs to the current player
    if (notification.playerId !== currentPlayer.id) {
      res.status(403).json({ error: 'You can only mark your own notifications as read' });
      return;
    }

    res.json({
      notification,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteNotification = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const currentPlayer = await database.getPlayerByUserId(req.user.id);
    if (!currentPlayer) {
      res.status(404).json({ error: 'Player profile not found' });
      return;
    }

    const { id: notificationId } = req.params;
    
    // First, get the notification to verify ownership
    const notifications = await database.getPlayerNotifications(currentPlayer.id, 1000);
    const notification = notifications.find(n => n.id === notificationId);
    
    if (!notification) {
      res.status(404).json({ error: 'Notification not found' });
      return;
    }

    if (notification.playerId !== currentPlayer.id) {
      res.status(403).json({ error: 'You can only delete your own notifications' });
      return;
    }

    const deleted = await database.deleteNotification(notificationId);
    
    if (!deleted) {
      res.status(404).json({ error: 'Notification not found' });
      return;
    }

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const markAllNotificationsAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const currentPlayer = await database.getPlayerByUserId(req.user.id);
    if (!currentPlayer) {
      res.status(404).json({ error: 'Player profile not found' });
      return;
    }

    await database.markAllNotificationsAsRead(currentPlayer.id);

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getConnectionSummary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const currentPlayer = await database.getPlayerByUserId(req.user.id);
    if (!currentPlayer) {
      res.status(404).json({ error: 'Player profile not found' });
      return;
    }

    const summary = await database.getPlayerConnectionSummary(currentPlayer.id);

    res.json({ summary });
  } catch (error) {
    console.error('Get connection summary error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};