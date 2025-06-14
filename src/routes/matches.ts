import { Router } from 'express';
import { 
  getUserMatches, 
  createMatch, 
  getMatchById, 
  startMatch, 
  addMatchEvent,
  endMatch,
  populateTeamsWithPlayers,
  submitPlayerRatings,
  getMatchRatings
} from '../controllers/matchController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All match routes require authentication
router.use(authenticateToken);

router.get('/', getUserMatches);
router.post('/', createMatch);
router.post('/populate-teams', populateTeamsWithPlayers);
router.get('/:id', getMatchById);
router.patch('/:id/start', startMatch);
router.patch('/:id/end', endMatch);
router.post('/:id/events', addMatchEvent);
router.post('/:id/ratings', submitPlayerRatings);
router.get('/:id/ratings', getMatchRatings);

// Debug endpoint to test rating functionality
router.post('/:id/ratings/debug', async (req: any, res: any) => {
  try {
    console.log('🔍 Debug endpoint called');
    console.log('Match ID:', req.params.id);
    console.log('User:', req.user?.id);
    console.log('Body:', JSON.stringify(req.body, null, 2));
    
    res.json({
      message: 'Debug endpoint working',
      matchId: req.params.id,
      userId: req.user?.id,
      bodyReceived: req.body,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Debug error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;