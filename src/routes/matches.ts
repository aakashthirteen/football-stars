import { Router } from 'express';
import { 
  getUserMatches, 
  createMatch, 
  getMatchById, 
  startMatch, 
  addMatchEvent,
  endMatch,
  pauseForHalftime,
  startSecondHalf,
  addStoppageTime,
  populateTeamsWithPlayers,
  saveFormationForMatch,
  getFormationForMatch,
  getMatchWithFormations,
  updateFormationDuringMatch,
  pauseMatch,
  resumeMatch,
  manualHalftime
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
router.patch('/:id/halftime', pauseForHalftime);
router.patch('/:id/second-half', startSecondHalf);
router.patch('/:id/add-time', addStoppageTime);
router.post('/:id/events', addMatchEvent);

// New Manual Match Control Routes
router.patch('/:id/pause', pauseMatch);
router.patch('/:id/resume', resumeMatch);
router.patch('/:id/manual-halftime', manualHalftime);

// Formation routes
router.post('/:matchId/teams/:teamId/formation', saveFormationForMatch);
router.get('/:matchId/teams/:teamId/formation', getFormationForMatch);
router.get('/:matchId/formations', getMatchWithFormations);
router.patch('/:matchId/teams/:teamId/formation', updateFormationDuringMatch);

export default router;