import express from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getCurrentPlayer,
  updateCurrentPlayer,
  getPlayerById,
  searchPlayers,
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

// Get specific player by ID
router.get('/:id', getPlayerById);

export default router;