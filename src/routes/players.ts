import express from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getCurrentPlayer,
  updateCurrentPlayer,
  getPlayerById,
  searchPlayers,
  // Connection endpoints
  sendConnectionRequest,
  acceptConnectionRequest,
  rejectConnectionRequest,
  getPlayerConnections,
  getPendingConnectionRequests,
  removeConnection,
  // Notification endpoints
  getPlayerNotifications,
  markNotificationAsRead,
  deleteNotification,
  markAllNotificationsAsRead,
  getConnectionSummary,
} from '../controllers/playerController';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Search players (must come before /:id)
router.get('/search', searchPlayers);

// Get current user's player profile
router.get('/me', getCurrentPlayer);

// Update current user's player profile
router.put('/me', updateCurrentPlayer);

// Connection routes
router.post('/connections/request', sendConnectionRequest);
router.post('/connections/accept/:id', acceptConnectionRequest);
router.post('/connections/reject/:id', rejectConnectionRequest);
router.get('/connections', getPlayerConnections);
router.get('/connections/pending', getPendingConnectionRequests);
router.get('/connections/summary', getConnectionSummary);
router.delete('/connections/:id', removeConnection);

// Notification routes
router.get('/notifications', getPlayerNotifications);
router.post('/notifications/:id/read', markNotificationAsRead);
router.post('/notifications/read-all', markAllNotificationsAsRead);
router.delete('/notifications/:id', deleteNotification);

// Get specific player by ID
router.get('/:id', getPlayerById);

export default router;