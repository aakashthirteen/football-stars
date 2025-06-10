import { Router } from 'express';
import { getUserTeams, createTeam, getTeamById } from '../controllers/teamController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All team routes require authentication
router.use(authenticateToken);

router.get('/', getUserTeams);
router.post('/', createTeam);
router.get('/:id', getTeamById);

export default router;