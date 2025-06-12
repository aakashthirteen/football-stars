import { Router } from 'express';
import { 
  getUserTeams, 
  createTeam, 
  getTeamById, 
  getAllTeams,
  addPlayerToTeam,
  removePlayerFromTeam,
  getAvailablePlayers
} from '../controllers/teamController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All team routes require authentication
router.use(authenticateToken);

router.get('/', getUserTeams);
router.get('/all', getAllTeams);
router.get('/players/available', getAvailablePlayers);
router.post('/', createTeam);
router.get('/:id', getTeamById);
router.post('/:id/players', addPlayerToTeam);
router.delete('/:id/players/:playerId', removePlayerFromTeam);

export default router;