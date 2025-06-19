import { Router } from 'express';
import { 
  getUserTeams, 
  createTeam, 
  getTeamById, 
  getAllTeams,
  addPlayerToTeam,
  removePlayerFromTeam,
  getAvailablePlayers,
  updateTeam,
  deleteTeam
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
router.patch('/:id', updateTeam);
router.post('/:id/players', addPlayerToTeam);
router.delete('/:id/players/:playerId', removePlayerFromTeam);
router.delete('/:id', deleteTeam);

export default router;