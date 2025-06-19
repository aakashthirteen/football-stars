import { Request, Response } from 'express';
import { simpleMatchTimer } from '../services/SimpleMatchTimer';

/**
 * Simple match controller for testing timer functionality
 * Bypasses complex database operations for now
 */

interface SimpleMatchRequest extends Request {
  params: {
    id: string;
  };
}

/**
 * Start a match timer (simplified)
 */
export const startSimpleMatch = async (req: SimpleMatchRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    console.log(`⚽ SimpleController: Starting match ${id}`);
    
    // Start the timer
    const timerState = simpleMatchTimer.startMatch(id);
    
    console.log(`✅ SimpleController: Match ${id} started successfully`);
    
    res.json({
      success: true,
      matchId: id,
      timerState,
      message: 'Match started with simple timer service'
    });
  } catch (error) {
    console.error('❌ SimpleController: Start match error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to start match',
      details: error instanceof Error ? error.message : String(error)
    });
  }
};

/**
 * Stop a match timer
 */
export const stopSimpleMatch = async (req: SimpleMatchRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    console.log(`🛑 SimpleController: Stopping match ${id}`);
    
    // Stop the timer
    simpleMatchTimer.stopMatch(id);
    
    console.log(`✅ SimpleController: Match ${id} stopped successfully`);
    
    res.json({
      success: true,
      matchId: id,
      message: 'Match stopped successfully'
    });
  } catch (error) {
    console.error('❌ SimpleController: Stop match error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to stop match',
      details: error instanceof Error ? error.message : String(error)
    });
  }
};

/**
 * Get match timer state
 */
export const getSimpleMatchState = async (req: SimpleMatchRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const timerState = simpleMatchTimer.getState(id);
    
    res.json({
      success: true,
      matchId: id,
      timerState,
      serverTime: Date.now()
    });
  } catch (error) {
    console.error('❌ SimpleController: Get match state error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get match state',
      details: error instanceof Error ? error.message : String(error)
    });
  }
};

/**
 * Get all active matches
 */
export const getActiveSimpleMatches = async (req: Request, res: Response): Promise<void> => {
  try {
    const activeMatches = simpleMatchTimer.getActiveMatches();
    
    res.json({
      success: true,
      activeMatches,
      count: activeMatches.length
    });
  } catch (error) {
    console.error('❌ SimpleController: Get active matches error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get active matches',
      details: error instanceof Error ? error.message : String(error)
    });
  }
};