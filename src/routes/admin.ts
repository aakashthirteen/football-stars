import { Router, Request, Response } from 'express';
import { database } from '../models/databaseFactory';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Clean old matches (admin only)
router.delete('/clean-matches', authenticateToken, async (req: Request, res: Response) => {
  const client = await database.pool.connect();
  
  try {
    // Get today's date at midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Start transaction
    await client.query('BEGIN');
    
    // Get count of matches to be deleted
    const countResult = await client.query(`
      SELECT COUNT(*) as count FROM matches WHERE match_date < $1
    `, [today]);
    
    const matchCount = parseInt(countResult.rows[0].count);
    
    if (matchCount === 0) {
      await client.query('COMMIT');
      return res.json({
        success: true,
        message: 'No old matches to delete',
        deletedCounts: {
          matches: 0,
          events: 0,
          stats: 0
        }
      });
    }
    
    // Delete related data first
    const eventsResult = await client.query(`
      DELETE FROM match_events 
      WHERE match_id IN (
        SELECT id FROM matches WHERE match_date < $1
      )
    `, [today]);
    
    const statsResult = await client.query(`
      DELETE FROM player_stats 
      WHERE match_id IN (
        SELECT id FROM matches WHERE match_date < $1
      )
    `, [today]);
    
    // Delete the matches
    const matchesResult = await client.query(`
      DELETE FROM matches 
      WHERE match_date < $1
    `, [today]);
    
    // Commit transaction
    await client.query('COMMIT');
    
    res.json({
      success: true,
      message: `Successfully cleaned ${matchesResult.rowCount} old matches`,
      deletedCounts: {
        matches: matchesResult.rowCount,
        events: eventsResult.rowCount,
        stats: statsResult.rowCount
      }
    });
    
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error cleaning matches:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clean matches',
      error: error.message
    });
  } finally {
    client.release();
  }
});

// Get match statistics
router.get('/match-stats', authenticateToken, async (req: Request, res: Response) => {
  try {
    const result = await database.pool.query(`
      SELECT 
        COUNT(*) as total_matches,
        COUNT(CASE WHEN status = 'LIVE' THEN 1 END) as live_matches,
        COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed_matches,
        COUNT(CASE WHEN status = 'UPCOMING' THEN 1 END) as upcoming_matches,
        COUNT(CASE WHEN match_date >= CURRENT_DATE THEN 1 END) as today_and_future,
        COUNT(CASE WHEN match_date < CURRENT_DATE THEN 1 END) as past_matches
      FROM matches
    `);
    
    res.json({
      success: true,
      stats: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error getting match stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get match statistics',
      error: error.message
    });
  }
});

export default router;