import express from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getTournaments,
  createTournament,
  getTournamentById,
  registerTeamToTournament,
  getTournamentStandings,
} from '../controllers/tournamentController';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all tournaments
router.get('/', getTournaments);

// Create a new tournament
router.post('/', createTournament);

// Get specific tournament by ID
router.get('/:id', getTournamentById);

// Register a team to a tournament
router.post('/:tournamentId/register', registerTeamToTournament);

// Get tournament standings
router.get('/:tournamentId/standings', getTournamentStandings);

export default router;