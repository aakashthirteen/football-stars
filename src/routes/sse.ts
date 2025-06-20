import { Router, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { sseAuthenticate } from '../middleware/sseAuth';
import { sseMatchTimerService } from '../services/sse/SSEMatchTimerService';
import { AuthRequest } from '../types';

const router = Router();

/**
 * Simple SSE test endpoint to verify connectivity
 * GET /api/sse/test
 */
router.get('/test', (req, res: Response) => {
  console.log('🧪 SSE Test: Client connected to test endpoint');
  
  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'X-Accel-Buffering': 'no' // Disable proxy buffering
  });
  
  // Send initial message
  res.write('data: {"message": "SSE test connection established!", "timestamp": ' + Date.now() + '}\n\n');
  
  // Send time updates every second
  const interval = setInterval(() => {
    const data = {
      type: 'test',
      time: new Date().toISOString(),
      timestamp: Date.now()
    };
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  }, 1000);
  
  // Clean up on client disconnect
  req.on('close', () => {
    console.log('🧪 SSE Test: Client disconnected');
    clearInterval(interval);
  });
});

/**
 * Server-Sent Events endpoint for real-time match timer updates
 * GET /api/matches/:id/timer-stream
 */
router.get('/:id/timer-stream', sseAuthenticate, async (req: AuthRequest, res: Response) => {
  const { id: matchId } = req.params;
  
  if (!matchId) {
    res.status(400).json({ error: 'Match ID is required' });
    return;
  }

  console.log(`📡 SSE: Client connecting to match ${matchId} timer stream`);

  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no', // Disable Nginx buffering
    'Access-Control-Allow-Origin': '*',
  });

  // Send initial connection success
  res.write(':ok\n\n');

  // Get current timer state and send if available
  const currentState = sseMatchTimerService.getMatchState(matchId);
  if (currentState) {
    res.write(`data: ${JSON.stringify({
      type: 'initial_state',
      matchId,
      timestamp: Date.now(),
      state: currentState
    })}\n\n`);
  }

  // Register this client with the timer service
  sseMatchTimerService.addSSEClient(matchId, res);

  // Send heartbeat every 30 seconds to keep connection alive
  const heartbeatInterval = setInterval(() => {
    try {
      res.write(':heartbeat\n\n');
    } catch (error) {
      // Client disconnected
      clearInterval(heartbeatInterval);
    }
  }, 30000);

  // Handle client disconnect
  req.on('close', () => {
    console.log(`📡 SSE: Client disconnected from match ${matchId} timer stream`);
    clearInterval(heartbeatInterval);
    sseMatchTimerService.removeSSEClient(matchId, res);
  });

  // Handle errors
  req.on('error', (error) => {
    console.error(`📡 SSE: Error in match ${matchId} timer stream:`, error);
    clearInterval(heartbeatInterval);
    sseMatchTimerService.removeSSEClient(matchId, res);
  });
});

/**
 * Start match with SSE timer
 * PATCH /api/matches/:id/start-sse
 */
router.patch('/:id/start-sse', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id: matchId } = req.params;
    
    console.log(`⚽ Starting match ${matchId} with SSE timer`);
    
    const timerState = await sseMatchTimerService.startMatch(matchId);
    
    res.json({
      success: true,
      timerState,
      message: 'Match started with SSE timer service'
    });
  } catch (error) {
    console.error('Failed to start match with SSE:', error);
    res.status(500).json({ 
      error: 'Failed to start match',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Manually start second half
 * PATCH /api/matches/:id/start-second-half-sse
 */
router.patch('/:id/start-second-half-sse', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id: matchId } = req.params;
    
    console.log(`⚽ Starting second half for match ${matchId}`);
    
    const timerState = await sseMatchTimerService.startSecondHalf(matchId);
    
    res.json({
      success: true,
      timerState,
      message: 'Second half started'
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
 * Pause match
 * PATCH /api/matches/:id/pause-sse
 */
router.patch('/:id/pause-sse', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id: matchId } = req.params;
    
    const timerState = await sseMatchTimerService.pauseMatch(matchId);
    
    res.json({
      success: true,
      timerState,
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
 * PATCH /api/matches/:id/resume-sse
 */
router.patch('/:id/resume-sse', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id: matchId } = req.params;
    
    const timerState = await sseMatchTimerService.resumeMatch(matchId);
    
    res.json({
      success: true,
      timerState,
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
 * PATCH /api/matches/:id/halftime-sse
 */
router.patch('/:id/halftime-sse', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id: matchId } = req.params;
    
    console.log(`🟨 Manual halftime trigger for match ${matchId}`);
    
    // Call the private method via the service
    const state = sseMatchTimerService.getMatchState(matchId);
    if (!state || state.status !== 'LIVE' || state.currentHalf !== 1) {
      res.status(400).json({ 
        error: 'Cannot trigger halftime for this match',
        currentStatus: state?.status,
        currentHalf: state?.currentHalf
      });
      return;
    }
    
    // Trigger halftime manually
    await (sseMatchTimerService as any).triggerHalftime(matchId);
    const timerState = sseMatchTimerService.getMatchState(matchId);
    
    res.json({
      success: true,
      timerState,
      message: 'Halftime triggered manually'
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
 * PATCH /api/matches/:id/fulltime-sse
 */
router.patch('/:id/fulltime-sse', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id: matchId } = req.params;
    
    console.log(`🏁 Manual fulltime trigger for match ${matchId}`);
    
    // Call the private method via the service
    const state = sseMatchTimerService.getMatchState(matchId);
    if (!state || state.status !== 'LIVE' || state.currentHalf !== 2) {
      res.status(400).json({ 
        error: 'Cannot trigger fulltime for this match',
        currentStatus: state?.status,
        currentHalf: state?.currentHalf
      });
      return;
    }
    
    // Trigger fulltime manually
    await (sseMatchTimerService as any).triggerFulltime(matchId);
    const timerState = sseMatchTimerService.getMatchState(matchId);
    
    res.json({
      success: true,
      timerState,
      message: 'Fulltime triggered manually'
    });
  } catch (error) {
    console.error('Failed to trigger fulltime:', error);
    res.status(500).json({ 
      error: 'Failed to trigger fulltime',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Add stoppage time
 * PATCH /api/matches/:id/add-time-sse
 */
router.patch('/:id/add-time-sse', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id: matchId } = req.params;
    const { minutes = 1 } = req.body;
    
    const timerState = await sseMatchTimerService.addStoppageTime(matchId, minutes);
    
    res.json({
      success: true,
      timerState,
      message: `Added ${minutes} minute(s) stoppage time`
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
 * Test SSE connection
 * GET /api/matches/test-sse
 */
router.get('/test-sse', async (req: any, res: Response) => {
  console.log('🧪 SSE Test: Connection attempt');
  
  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  // Send test data
  res.write(':ok\n\n');
  res.write(`data: {"message": "SSE connection successful", "time": "${new Date().toISOString()}"}\n\n`);
  
  // Send periodic test messages
  const interval = setInterval(() => {
    try {
      res.write(`data: {"message": "Heartbeat", "time": "${new Date().toISOString()}"}\n\n`);
    } catch (error) {
      clearInterval(interval);
    }
  }, 5000);

  req.on('close', () => {
    console.log('🧪 SSE Test: Connection closed');
    clearInterval(interval);
  });
});

export default router;
