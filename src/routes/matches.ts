import { Router } from 'express';
import { 
  getUserMatches, 
  createMatch, 
  getMatchById, 
  startMatch, 
  addMatchEvent,
  endMatch 
} from '../controllers/matchController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All match routes require authentication
router.use(authenticateToken);

router.get('/', getUserMatches);
router.post('/', createMatch);
router.get('/:id', getMatchById);
router.patch('/:id/start', startMatch);
router.patch('/:id/end', endMatch);
router.post('/:id/events', addMatchEvent);

export default router;