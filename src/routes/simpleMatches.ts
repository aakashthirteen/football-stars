import express from 'express';
import { 
  startSimpleMatch,
  stopSimpleMatch, 
  getSimpleMatchState,
  getActiveSimpleMatches
} from '../controllers/simpleMatchController';

const router = express.Router();

// Simple match timer routes for testing
router.post('/:id/start', startSimpleMatch);
router.post('/:id/stop', stopSimpleMatch);
router.get('/:id/state', getSimpleMatchState);
router.get('/active', getActiveSimpleMatches);

export default router;