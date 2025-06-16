import express from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getPlayerStats,
  getCurrentUserStats,
  getAllPlayersStats,
  getTeamPlayersStats,
  getLeaderboard,
  addPlayerRating,
  getPlayerRating,
} from '../controllers/statsController';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get current user's stats
router.get('/me', getCurrentUserStats);

// Get specific player's stats
router.get('/player/:playerId', getPlayerStats);

// Get all players stats
router.get('/players', getAllPlayersStats);

// Get team players stats
router.get('/team/:teamId', getTeamPlayersStats);

// Get leaderboard
router.get('/leaderboard', getLeaderboard);

// Player ratings
router.post('/player/:playerId/match/:matchId/rating', addPlayerRating);
router.get('/player/:playerId/match/:matchId/rating', getPlayerRating);

export default router;