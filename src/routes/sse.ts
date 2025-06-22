import { Router, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { sseAuthenticate } from '../middleware/sseAuth';
import { scalableFootballTimer } from '../services/sse/ScalableFootballTimerService';
import { AuthRequest } from '../types';

const router = Router();

/**
 * Simple HTTP test endpoint to verify basic connectivity
 */
router.get('/health', (req, res: Response) => {
  console.log('🏥 SSE Health: Endpoint accessed');
  res.json({
    success: true,
    message: 'Scalable Football Timer SSE routes are working',
    timestamp: Date.now(),
    headers: req.headers,
    performance: scalableFootballTimer.getPerformanceMetrics()
  });
});

/**
 * Server-Sent Events endpoint for real-time match timer updates
 */
router.get('/:id/timer-stream', sseAuthenticate, async (req: AuthRequest, res: Response) => {
  const { id: matchId } = req.params;
  
  if (!matchId) {
    res.status(400).json({ error: 'Match ID is required' });
    return;
  }

  console.log(`📡 Scalable Timer SSE: Client connecting to match ${matchId}`);

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');
  res.setHeader('X-Accel-Buffering', 'no');

  res.status(200);

  // Subscribe client to scalable timer
  scalableFootballTimer.subscribeToMatch(matchId, res);

  // Send initial state if match exists
  const state = scalableFootballTimer.getMatchState(matchId);
  if (state) {
    const elapsed = calculateElapsedTime(state);
    const displayMinute = Math.floor(elapsed / (60 * 1000));
    const displaySecond = Math.floor((elapsed % (60 * 1000)) / 1000);
    
    const initialUpdate = {
      type: 'initial_state',
      matchId,
      timestamp: Date.now(),
      state: {
        currentMinute: displayMinute,
        currentSecond: displaySecond,
        status: mapPhaseToStatus(state.phase),
        currentHalf: state.phase === 'FIRST_HALF' ? 1 : 2,
        isHalftime: state.phase === 'HALFTIME_BREAK',
        isPaused: !state.isActive,
        addedTimeFirstHalf: Math.floor(state.firstHalfStoppageMs / (60 * 1000)),
        addedTimeSecondHalf: Math.floor(state.secondHalfStoppageMs / (60 * 1000)),
        serverTime: Date.now()
      }
    };
    
    res.write(`data: ${JSON.stringify(initialUpdate)}\n\n`);
  }

  // Handle client disconnect
  req.on('close', () => {
    console.log(`📡 Scalable Timer SSE: Client disconnected from match ${matchId}`);
    scalableFootballTimer.unsubscribeFromMatch(matchId, res);
  });

  req.on('error', (error) => {
    console.error('📡 Scalable Timer SSE: Request error:', error);
    scalableFootballTimer.unsubscribeFromMatch(matchId, res);
  });
});

/**
 * Start match with professional timer
 */
router.patch('/:id/start-sse', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id: matchId } = req.params;
    
    const timerState = await scalableFootballTimer.startMatch(matchId);
    
    res.json({
      success: true,
      timerState: formatScalableStateForAPI(timerState),
      message: 'Match started with scalable timer system'
    });
  } catch (error) {
    console.error('Failed to start match with professional timer:', error);
    res.status(500).json({ 
      error: 'Failed to start match',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Start second half
 */
router.patch('/:id/second-half-sse', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id: matchId } = req.params;
    
    const timerState = await scalableFootballTimer.startSecondHalf(matchId);
    
    res.json({
      success: true,
      timerState: formatScalableStateForAPI(timerState),
      message: 'Second half started with scalable timing'
    });
  } catch (error) {
    console.error('Failed to start second half:', error);
    res.status(500).json({ 
      error: 'Failed to start second half',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Add stoppage time with professional rescheduling
 */
router.patch('/:id/add-time-sse', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id: matchId } = req.params;
    const { minutes = 1 } = req.body;
    
    const timerState = await scalableFootballTimer.addStoppageTime(matchId, minutes);
    
    res.json({
      success: true,
      timerState: formatScalableStateForAPI(timerState),
      message: `Added ${minutes} minute(s) stoppage time with scalable rescheduling`
    });
  } catch (error) {
    console.error('Failed to add stoppage time:', error);
    res.status(500).json({ 
      error: 'Failed to add stoppage time',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Pause match
 */
router.patch('/:id/pause-sse', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id: matchId } = req.params;
    
    const timerState = await scalableFootballTimer.pauseMatch(matchId);
    
    res.json({
      success: true,
      timerState: formatScalableStateForAPI(timerState),
      message: 'Match paused'
    });
  } catch (error) {
    console.error('Failed to pause match:', error);
    res.status(500).json({ 
      error: 'Failed to pause match',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Resume match
 */
router.patch('/:id/resume-sse', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id: matchId } = req.params;
    
    const timerState = await scalableFootballTimer.resumeMatch(matchId);
    
    res.json({
      success: true,
      timerState: formatScalableStateForAPI(timerState),
      message: 'Match resumed'
    });
  } catch (error) {
    console.error('Failed to resume match:', error);
    res.status(500).json({ 
      error: 'Failed to resume match',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Manually trigger halftime
 */
router.patch('/:id/halftime-sse', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id: matchId } = req.params;
    
    const timerState = await scalableFootballTimer.manuallyTriggerHalftime(matchId);
    
    res.json({
      success: true,
      timerState: formatScalableStateForAPI(timerState),
      message: 'Halftime triggered manually with scalable timing'
    });
  } catch (error) {
    console.error('Failed to trigger halftime:', error);
    res.status(500).json({ 
      error: 'Failed to trigger halftime',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Manually trigger fulltime
 */
router.patch('/:id/fulltime-sse', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id: matchId } = req.params;
    
    const timerState = await scalableFootballTimer.manuallyTriggerFulltime(matchId);
    
    res.json({
      success: true,
      timerState: formatScalableStateForAPI(timerState),
      message: 'Fulltime triggered manually with scalable timing'
    });
  } catch (error) {
    console.error('Failed to trigger fulltime:', error);
    res.status(500).json({ 
      error: 'Failed to trigger fulltime',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Helper functions
function mapPhaseToStatus(phase: 'FIRST_HALF' | 'HALFTIME_BREAK' | 'SECOND_HALF' | 'COMPLETED'): string {
  switch (phase) {
    case 'FIRST_HALF':
    case 'SECOND_HALF':
      return 'LIVE';
    case 'HALFTIME_BREAK':
      return 'HALFTIME';
    case 'COMPLETED':
      return 'COMPLETED';
    default:
      return 'SCHEDULED';
  }
}

// Helper function to calculate elapsed time for scalable timer
function calculateElapsedTime(state: any): number {
  const now = Date.now();
  let elapsed = now - state.startedAt - state.totalPausedMs;
  
  // If currently paused, don't count pause time
  if (state.pausedAt) {
    elapsed -= (now - state.pausedAt);
  }
  
  return Math.max(0, elapsed);
}

function formatScalableStateForAPI(state: any) {
  const elapsed = calculateElapsedTime(state);
  const displayMinute = Math.floor(elapsed / (60 * 1000));
  const displaySecond = Math.floor((elapsed % (60 * 1000)) / 1000);
  
  return {
    currentMinute: displayMinute,
    currentSecond: displaySecond,
    status: mapPhaseToStatus(state.phase),
    currentHalf: state.phase === 'FIRST_HALF' ? 1 : 2,
    isHalftime: state.phase === 'HALFTIME_BREAK',
    isPaused: !state.isActive,
    addedTimeFirstHalf: Math.floor(state.firstHalfStoppageMs / (60 * 1000)),
    addedTimeSecondHalf: Math.floor(state.secondHalfStoppageMs / (60 * 1000)),
    serverTime: Date.now()
  };
}

export default router;